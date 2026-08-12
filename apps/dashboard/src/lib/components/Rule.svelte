<!--
  One segmented bar with its legend laid out on the same track list, so each label sits
  under the slice it names — the legend is read along the bar rather than decoded against
  it. The segments carry the brand mark's 2px radius, spaced by a hairline gap so the whole
  thing reads as a measuring instrument rather than a stacked bar.

  Two track lists, not one: the bar lets a slice collapse to a 3px tick, while the legend
  holds every column to a legible minimum. Big slices line up exactly; a sliver's label
  drifts a few pixels right rather than colliding with its neighbour. The component does no
  aggregation — a caller with more parts than fit rolls the tail into one "other" part.
-->
<script lang="ts">
	type Part = {
		label: string;
		value?: string | number;
		note?: string;
		color: string;
		/** Share of the whole, 0–100. */
		pct: number;
	};

	let { parts, tail }: { parts: Part[]; tail?: string } = $props();

	// Nothing measured yet — an empty instance, a range with no todos — so the bar divides
	// evenly instead of collapsing to a row of ticks.
	const even = $derived(parts.every((part) => part.pct <= 0));
	const track = (min: string) =>
		parts.map((part) => `minmax(${min}, ${even ? 1 : part.pct}fr)`).join(' ');
</script>

<div class="rule">
	{#if tail}<p class="tail">{tail}</p>{/if}

	<div class="bar" style:--tracks={track('3px')} aria-hidden="true">
		{#each parts as part (part.label)}
			<span class="seg" style:--c={part.color}></span>
		{/each}
	</div>

	<!-- The floor is set by the widest thing a cell holds — a figure like "48.0 KB" at the
	     value's own 1.15em, plus the gutter — or neighbouring columns run together. -->
	<dl class="legend" style:--tracks={track('6.5em')}>
		{#each parts as part (part.label)}
			<div style:--c={part.color}>
				<dt>{part.label}</dt>
				{#if part.value !== undefined}
					<dd>{typeof part.value === 'number' ? part.value.toLocaleString() : part.value}</dd>
				{/if}
				{#if part.note}<dd class="note">{part.note}</dd>{/if}
			</div>
		{/each}
	</dl>
</div>

<style>
	/* A reading measure, like Header's lead. Past this the labels are so far from the
	   slices they name that the alignment stops doing any work. */
	.rule {
		display: flex;
		flex-direction: column;
		gap: 0.8em;
		max-width: 64em;
	}

	.tail {
		margin: 0;
		text-align: right;
		font-family: var(--font-mono);
		font-size: 0.75em;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	.bar,
	.legend {
		display: grid;
		grid-template-columns: var(--tracks);
	}

	.bar {
		gap: 2px;
		height: 6px;
	}

	.seg {
		border-radius: 2px;
		background: var(--c);
	}

	.legend {
		gap: 2px;
		margin: 0;
	}

	.legend > div {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 0;
		padding-right: 0.9em;
	}

	dt {
		font-family: var(--font-mono);
		font-size: 0.68em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--dim);
		overflow: hidden;
		text-overflow: ellipsis;
	}

	dd {
		margin: 0;
		font-size: 1.15em;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
		/* A figure that breaks across two lines ("48.0 / KB") drags its whole column out
		   of line with the rest of the legend. */
		white-space: nowrap;
	}

	dd.note {
		font-family: var(--font-mono);
		font-size: 0.72em;
		line-height: 1.45;
		color: var(--muted);
		white-space: normal;
	}

	/* The bar still reads at phone width — proportion is the point and 6px needs no room.
	   Only the legend gives up its columns, each item keeping its colour as a left edge. */
	@media (max-width: 640px) {
		.legend {
			display: flex;
			flex-direction: column;
			gap: 0;
		}

		.legend > div {
			padding: 0.5em 0 0.5em 0.7em;
			border-left: 3px solid var(--c);
			border-radius: 2px;
		}
	}
</style>
