import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				// Required for remote functions (`$app/server`'s query/form/command) to use top-level await.
				experimental: { async: true }
			},
			// Required for remote functions (`$app/server`'s query/form/command). This is a `kit`-level
			// option, but since config is passed inline here (no svelte.config.js in this app), SvelteKit
			// flattens `KitConfig` fields like `adapter` and `experimental` directly onto this object.
			experimental: { remoteFunctions: true },
			adapter: adapter()
		})
	]
});
