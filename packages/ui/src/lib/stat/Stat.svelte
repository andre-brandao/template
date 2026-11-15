<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		value,
		note,
		href,
		children
	}: {
		label: string;
		value?: string;
		note?: string;
		/** Makes the whole tile a link. */
		href?: string;
		/** In place of `value`, for a figure that loads on its own. */
		children?: Snippet;
	} = $props();
</script>

<svelte:element this={href ? 'a' : 'div'} {href} class={['stat', { link: !!href }]}>
	<span class="label">{label}</span>
	<span class="value">
		{#if children}{@render children()}{:else}{value}{/if}
	</span>
	{#if note}<span class="note">{note}</span>{/if}
</svelte:element>

<style>
	/* One figure with its label: a tile in a row of them. */
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 0;
		padding: 0.75em 0.9em;
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius, 8px);
		background: var(--surface, #fff);
		color: inherit;
		text-decoration: none;
	}

	.link {
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.link:hover {
		border-color: var(--border-bright, #d3d1cc);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.04));
	}

	.link:focus-visible {
		outline: none;
		border-color: var(--accent, #2f7f68);
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
	}

	.label {
		color: var(--muted, #64625d);
		font-size: 0.8em;
		overflow-wrap: anywhere;
	}

	.value {
		overflow: hidden;
		color: var(--ink, #1c1b19);
		font-size: 1.3em;
		font-variant-numeric: tabular-nums;
		text-overflow: ellipsis;
	}

	.note {
		color: var(--dim, #75736d);
		font-size: 0.78em;
	}

	@media (prefers-reduced-motion: reduce) {
		.link {
			transition: none;
		}
	}
</style>
