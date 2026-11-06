<!-- `Header.Group`: one group on the filter row, an optional muted label and its controls. A
     rule splits groups, dropped where one opens a line (`Root` sets `data-lead`); `end` pushes
     this group and those after it right. A group wraps whole. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		end = false,
		children
	}: { label?: string; end?: boolean; children: Snippet } = $props();
</script>

<div class={['group', { end }]} role="group" aria-label={label}>
	{#if label}<span class="label" aria-hidden="true">{label}</span>{/if}
	{@render children()}
</div>

<style>
	.group {
		display: flex;
		flex: 0 1 auto;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
		max-width: 100%;
		padding-inline: 1em;
		border-left: 1px solid var(--border);
	}

	.group:first-child,
	.group:global([data-lead]) {
		padding-left: 0;
		border-left: none;
	}

	/* Search grows to fill its line, but no further than its input, so selects sit beside it. */
	.group:has(:global(input[type='search'])) {
		flex-grow: 1;
		max-width: 30em;
	}

	.end {
		margin-left: auto;
		border-left: none;
	}

	.end:last-child {
		padding-right: 0;
	}

	.label {
		flex: none;
		font-size: 0.85em;
		white-space: nowrap;
		color: var(--muted);
	}
</style>
