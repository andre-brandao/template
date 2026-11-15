<script lang="ts">
	import type { QueryClient } from '@tanstack/svelte-query';
	import { TanStackDevtools } from '@tanstack/svelte-devtools';
	import { hotkeysDevtoolsPlugin } from '@tanstack/svelte-hotkeys-devtools';
	import QueryPanel from './QueryPanel.svelte';

	// Every devtools import lives here; ShellProvider mounts it under `{#if dev}`.
	let { client }: { client: QueryClient } = $props();

	// Bottom-right, beside the Svelte inspector (vite.config.ts): the one corner no app chrome
	// uses. Hidden until hovered, so it never sits over content. Alt+D toggles the panel.
	const tools = {
		triggerMode: 'fixed',
		position: 'bottom-right',
		hideUntilHover: true,
		openHotkey: ['Alt', 'D']
	} as const;

	// The core lets stored settings beat `config`, so a browser that saw an older setup would
	// keep it forever. Ours are written over the stored ones before the devtools mount.
	if (typeof localStorage !== 'undefined') {
		const key = 'tanstack_devtools_settings';
		const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
		localStorage.setItem(key, JSON.stringify({ ...stored, ...tools }));
	}

	// Svelte orange on white, like the inspector: dev chrome reads apart from the app.
	// Core reruns this on theme change.
	function trigger(el: HTMLElement) {
		const pill = document.createElement('span');
		pill.title = 'Devtools (Alt+D)';
		pill.style.cssText =
			'display:grid;place-items:center;width:32px;height:32px;margin:0 8px 2px 0;' +
			'border:1px solid #ff3e00;border-radius:8px;background:#fff;' +
			'box-shadow:0 1px 3px rgb(0 0 0 / 0.25);cursor:pointer';
		const dot = document.createElement('span');
		dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#ff3e00';
		pill.replaceChildren(dot);
		el.replaceChildren(pill);
	}
</script>

<TanStackDevtools
	config={{ ...tools, openHotkey: [...tools.openHotkey], customTrigger: trigger }}
	plugins={[{ name: 'Query', component: QueryPanel, props: { client } }, hotkeysDevtoolsPlugin()]}
/>

<style>
	/* The inspector pins itself 8px from the corner; nudge it left of our trigger's box. */
	:global(#svelte-inspector-toggle) {
		right: 56px !important;
	}
</style>
