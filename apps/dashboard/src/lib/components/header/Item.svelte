<!-- `Header.Item`: one fact on the facts band, a muted label and the caller's value. A rule
     splits it from the fact before, except where it opens a line (`Root` sets `data-lead`). -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<span class="item">
	<span class="label">{label}</span>
	<span class="value">{@render children()}</span>
</span>

<style>
	.item {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
		padding-inline: 1.1em;
		border-left: 1px solid var(--border);
	}

	.item:first-child,
	.item:global([data-lead]) {
		padding-left: 0;
		border-left: none;
	}

	.label {
		flex: none;
		white-space: nowrap;
	}

	.value {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3em 0.6em;
		min-width: 0;
		color: var(--ink);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	@container header (max-width: 640px) {
		.item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.3em;
		}
	}
</style>
