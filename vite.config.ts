import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svg } from './src/lib/index.js';

export default defineConfig({
	plugins: [svg(), sveltekit()],
});
