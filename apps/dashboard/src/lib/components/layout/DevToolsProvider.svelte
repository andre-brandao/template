<script lang="ts">
	import type { QueryClient } from '@tanstack/svelte-query';
	import { TanStackDevtools } from '@tanstack/svelte-devtools';
	import { hotkeysDevtoolsPlugin } from '@tanstack/svelte-hotkeys-devtools';
	import QueryPanel from './QueryPanel.svelte';

	// Every devtools import lives here; ShellProvider mounts it under `{#if dev}`.
	let { client }: { client: QueryClient } = $props();

	// Bottom-left: the Svelte inspector's toggle owns bottom-right. Alt+D toggles the panel.
	const tools = {
		triggerMode: 'fixed',
		position: 'bottom-left',
		hideUntilHover: false,
		openHotkey: ['Alt', 'D']
	} as const;

	// The core lets stored settings beat `config`, so a browser that saw an older setup would
	// keep it forever. Ours are written over the stored ones before the devtools mount.
	if (typeof localStorage !== 'undefined') {
		const key = 'tanstack_devtools_settings';
		const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
		localStorage.setItem(key, JSON.stringify({ ...stored, ...tools }));
	}

	// A quiet pill: surface, hairline border, accent dot. Core reruns this on theme change.
	function trigger(el: HTMLElement) {
		const pill = document.createElement('span');
		pill.title = 'Devtools (Alt+D)';
		pill.style.cssText =
			'display:grid;place-items:center;width:26px;height:26px;margin:0 0 6px 6px;' +
			'border:1px solid var(--border);border-radius:999px;background:var(--surface);' +
			'box-shadow:0 1px 3px rgb(0 0 0 / 0.25);cursor:pointer';
		const dot = document.createElement('span');
		dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:var(--accent)';
		pill.replaceChildren(dot);
		el.replaceChildren(pill);
	}
</script>

<TanStackDevtools
	config={{ ...tools, openHotkey: [...tools.openHotkey], customTrigger: trigger }}
	plugins={[{ name: 'Query', component: QueryPanel, props: { client } }, hotkeysDevtoolsPlugin()]}
/>
