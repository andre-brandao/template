<script lang="ts">
	import type { Snippet } from 'svelte';
	import { combobox } from './ctx.svelte';

	let { label = 'Options', children }: { label?: string; children: Snippet } = $props();

	const ctx = combobox();
</script>

<div class="list" id={ctx.id} role="listbox" aria-label={label}>
	{@render children()}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-height: 0;
		/* The popover caps itself here; inside a sheet the drawer's own height wins. */
		max-height: 15em;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-gutter: stable;
	}
</style>
