import type { Plugin } from 'vite';
import type { AST } from 'svelte/compiler';
import fs from 'node:fs';
import path from 'node:path';
import { walk } from 'zimmerframe';
import MagicString from 'magic-string';
import { parse } from 'svelte/compiler';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

type Options = {
	base?: string;
};

const ATTACH_NAME = 'svg';
const LOG_TAG = '[svelte-svg-inline]';

export function svg(options?: Options): Plugin {
	let root: string;

	return {
		name: 'svelte-svg',
		enforce: 'pre',
		configResolved(config) {
			root = config.root;
		},
		transform(code, id) {
			if (!id.endsWith('.svelte')) return null;
			const ast = parse(code, { modern: true }) as AST.SvelteNode;
			const source = new MagicString(code);

			walk(
				ast,
				{},
				{
					_(node, { next }) {
						const svg = SVGNode(code, node);
						if (!svg) {
							next();
							return;
						}
						// resolve svg path
						let filepath: string;
						if (path.isAbsolute(svg.path) && options?.base) {
							filepath = path.join(root, options.base, svg.path);
						} else {
							filepath = path.resolve(path.dirname(id), svg.path);
						}
						if (!fs.existsSync(filepath)) {
							throw Error(`${LOG_TAG} svg file not found: ${filepath}`);
						}
						// read svg from file
						const input = fs.readFileSync(filepath, 'utf-8');
						const output = process(input, svg.attributes);
						source.overwrite(svg.node.start, svg.node.end, output);
						next();
					},
				},
			);

			return {
				code: source.toString(),
				map: source.generateMap({ hires: true }),
			};
		},
	};
}

function SVGNode(code: string, node: AST.SvelteNode) {
	if (node.type !== 'RegularElement') return;
	if (node.name !== 'svg') return;
	if (!node.attributes) return;
	const attachTag = node.attributes.find((a) => a.type === 'AttachTag');
	if (!attachTag) return;
	const expression = attachTag.expression;
	if (expression.type !== 'CallExpression') return;
	if (expression.callee.type !== 'Identifier') return;
	if (expression.callee.name !== ATTACH_NAME) return;
	const argument = expression.arguments[0];
	if (argument.type !== 'Literal') {
		const highlight = code.slice(node.start, node.end).trim();
		throw Error(`${LOG_TAG} only Literal path is supported, but got ${argument.type} for ${highlight}`);
	}
	const path = String(argument.value);

	const attributes: Record<string, string> = {};
	for (let attribute of node.attributes) {
		if (attribute.type !== 'Attribute') continue;
		const raw = code.slice(attribute.start, attribute.end).trim();
		attributes[attribute.name] = raw;
	}

	return {
		node,
		path,
		attributes,
	};
}

function process(content: string, attributes: Record<string, string>) {
	const document = new DOMParser().parseFromString(content, 'image/svg+xml');
	const root = document.documentElement;
	// extract inner xml
	let innerXML = '';
	const serializer = new XMLSerializer();
	for (let i = 0; i < root.childNodes.length; i++) {
		innerXML += serializer.serializeToString(root.childNodes.item(i));
	}
	innerXML = innerXML.trim();

	// merge attributes
	const previous: Record<string, string> = {};
	Object.values(root.attributes).forEach((attr) => {
		if (!attr.name) return;
		previous[attr.name] = `${attr.name}="${attr.value}"`;
	});
	const merged = { ...previous, ...attributes };
	return `<svg ${Object.values(merged).join(' ')}>${innerXML}</svg>`;
}
