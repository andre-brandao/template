<!-- Combobox's facet row: a radiogroup with roving focus, so Tab reaches it once and ←/→ move. -->
<script lang="ts">
	import { tick } from 'svelte';
	import { step } from '../command/model';

	let {
		facets,
		total,
		scope,
		onpick
	}: {
		facets: { name: string; count: number }[];
		/** The count on "All". */
		total: number;
		/** The chosen name; empty for all. */
		scope: string;
		onpick: (name: string) => void;
	} = $props();

	let row: HTMLDivElement | undefined = $state();

	function rove(e: KeyboardEvent) {
		const names = ['', ...facets.map((one) => one.name)];
		const map: Record<string, string> = { ArrowRight: 'ArrowDown', ArrowLeft: 'ArrowUp' };
		const next = step(map[e.key] ?? e.key, names.indexOf(scope), names.length);
		if (next === undefined) return;
		e.preventDefault();
		onpick(names[next]);
		tick().then(() => row?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
	}
</script>

{#snippet chip(name: string, tag: string, count: number)}
	<button
		type="button"
		class="chip"
		role="radio"
		aria-checked={scope === name}
		tabindex={scope === name ? 0 : -1}
		onclick={() => onpick(name)}
		onkeydown={rove}
	>
		{tag}<span class="count">{count}</span>
	</button>
{/snippet}

<div class="facets" role="radiogroup" aria-label="Filter" bind:this={row}>
	{@render chip('', 'All', total)}
	{#each facets as one (one.name)}
		{@render chip(one.name, one.name, one.count)}
	{/each}
</div>

<style>
	.facets {
		display: flex;
		flex: 1;
		gap: 0.25em;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.chip {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 0.35em;
		padding: 0.15em 0.5em;
		border: 1px solid transparent;
		border-radius: 999px;
		background: none;
		color: var(--muted, #64625d);
		font: inherit;
		font-size: 0.85em;
		cursor: pointer;
	}

	.chip:hover {
		background: var(--hover, rgb(0 0 0 / 0.06));
	}

	.chip[aria-checked='true'] {
		border-color: var(--border-bright, #d3d1cc);
		background: var(--surface-2, #f2f1ee);
		color: var(--ink, #1c1b19);
	}

	.chip:focus-visible {
		outline: 2px solid var(--accent, #2f7f68);
		outline-offset: -2px;
	}

	.count {
		color: var(--dim, #75736d);
		font-variant-numeric: tabular-nums;
	}
</style>
