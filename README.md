# Svelte SVG Inline

A tiny Vite plugin that inlines external SVG files at **build time**.

- No runtime fetching or client JS
- SSR-friendly
- Applies `<svg>` attributes to the source

`vite.config.js`:

```ts
import { svg } from 'svelte-svg-inline';

export default defineConfig({
	plugins: [svg(/** options */), sveltekit()],
});
```

```svelte
	<svg {@attach svg('./image.svg')} fill="currentColor" />
```

```svelte
<script lang="ts">
	const fill="red";
</script>

<svg {@attach svg('./image.svg')} {fill}></svg>
```

## Plugin Options

Relative paths resolve relative to the importing `.svelte` file.

With `base` option set, absolute paths (started with `/`) resolve against <project-root>/<base>; relative-path behavior is unchanged.
Suitable when all icons located in a single directory.

```ts
type Options = {
	base?: string;
};
```

## Typescript

Import attachment types, e.g. `app.d.ts`:

```ts
import 'svelte-svg-inline/dist/attachment.d.ts';
```

## Limitation

The `path` argument must be a string `Literal`, not an `Identifier` or others.
`Identifier` support can be added in a future update.

This code will **NOT** work:

```svelte
<script lang="ts">
	import path from './sample.svg';
</script>

<!-- path here is NOT Literal -->
<svg {@attach svg(path)} fill="red"></svg>
```
