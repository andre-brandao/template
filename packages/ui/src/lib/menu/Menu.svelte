<!--
	An action menu: Popover with role="menu", plus roving focus over its items. Items
	close it through context, so a caller only writes `onselect`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Popover, { type Trigger } from '../popover/Popover.svelte';
	import type { Align, Place } from '../popover/place';
	import { createMenu } from './ctx';

	let {
		open = $bindable(false),
		side = 'bottom',
		align = 'start',
		label,
		trigger,
		children
	}: {
		open?: boolean;
		side?: Place;
		align?: Align;
		label?: string;
		/** Optional: a context-only menu opens through `at(e)` instead. */
		trigger?: Snippet<[Trigger]>;
		children: Snippet;
	} = $props();

	let pop: Popover | undefined = $state();
	// Type-ahead buffer: letters typed within half a second build one prefix.
	const ahead = { text: '', last: 0 };

	createMenu({ close: () => pop?.close() });

	/** Wire to `oncontextmenu` on any element to open the menu at the pointer. */
	export function at(e: MouseEvent) {
		e.preventDefault();
		pop?.show({ x: e.clientX, y: e.clientY });
	}

	function keys(e: KeyboardEvent & { currentTarget: HTMLElement }) {
		if (e.key === 'Tab') return pop?.close();
		const items = [
			...e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)')
		];
		if (!items.length) return;
		const now = items.indexOf(document.activeElement as HTMLElement);
		const step = { ArrowDown: now + 1, ArrowUp: now - 1, Home: 0, End: items.length - 1 }[e.key];
		if (step !== undefined) {
			e.preventDefault();
			items[(step + items.length) % items.length].focus();
			return;
		}
		if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
		ahead.text = e.timeStamp - ahead.last > 500 ? e.key.toLowerCase() : ahead.text + e.key.toLowerCase();
		ahead.last = e.timeStamp;
		// Searching from the next item lets a repeated letter cycle through its matches.
		const order = [...items.slice(now + 1), ...items.slice(0, now + 1)];
		order.find((one) => one.textContent?.trim().toLowerCase().startsWith(ahead.text))?.focus();
	}
</script>

<Popover bind:this={pop} bind:open {side} {align} {label} {trigger} role="menu">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="menu" onkeydown={keys}>
		{@render children()}
	</div>
</Popover>

<style>
	.menu {
		display: flex;
		flex-direction: column;
		min-width: 11em;
	}
</style>
