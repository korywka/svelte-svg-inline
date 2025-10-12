import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svgInline } from './src/lib/index.js';

export default defineConfig({
	plugins: [svgInline(), sveltekit()],
});
