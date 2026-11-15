<script lang="ts">
	import type { Snippet } from 'svelte';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import { Menu } from '@template/ui';

	// One dense row: its cells, then the row's actions behind a ⋯ that shows on hover or focus.
	let {
		label,
		muted = false,
		children,
		menu
	}: { label: string; muted?: boolean; children: Snippet; menu: Snippet } = $props();

	let open = $state(false);
</script>

<li class={['row', { muted, open }]}>
	{@render children()}
	<Menu.Root bind:open {label} align="end">
		{#snippet trigger(attrs)}
			<button type="button" class="more" aria-label={label} {...attrs}>
				<Ellipsis size={16} />
			</button>
		{/snippet}
		{@render menu()}
	</Menu.Root>
</li>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.9em;
		min-height: 2.75em;
		padding: 0.3em 0.4em 0.3em 0.8em;
		border-bottom: 1px solid var(--border);
		transition:
			background 140ms ease,
			opacity 140ms ease;
	}

	.row:last-child {
		border-bottom: 0;
	}

	.row:hover,
	.row:focus-within,
	.open {
		background: var(--hover);
	}

	.muted {
		opacity: 0.55;
	}

	.more {
		display: grid;
		place-items: center;
		flex: none;
		width: 1.9em;
		height: 1.9em;
		margin-left: auto;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		cursor: pointer;
		opacity: 0;
		transition: opacity 140ms ease;
	}

	.row:hover .more,
	.row:focus-within .more,
	.open .more {
		opacity: 1;
	}

	.more:hover,
	.open .more {
		background: var(--hover);
		color: var(--ink);
	}

	@media (hover: none) {
		.more {
			opacity: 1;
		}
	}
</style>
