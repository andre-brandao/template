<!-- A segment meter for a `Header.Item`: one bar per step, done ones in `--done`, the current one
     in `--progress` (`--danger` when stuck), then the caller's label and "n of N". -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		steps,
		current,
		danger = false,
		children
	}: {
		steps: number;
		/** Zero-based; past the last step reads as all done. */
		current: number;
		/** The current step is stuck, like a blocked todo. */
		danger?: boolean;
		/** The current step's name or picker, drawn between the bars and the count. */
		children?: Snippet;
	} = $props();
</script>

<span class="steps">
	<span class="bars" aria-hidden="true">
		{#each { length: steps }, i (i)}
			<i class={{ done: i < current, now: i === current, danger: i === current && danger }}></i>
		{/each}
	</span>
	{@render children?.()}
	<small>{Math.min(current + 1, steps)} of {steps}</small>
</span>

<style>
	.steps {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3em 0.6em;
		min-width: 0;
		max-width: 100%;
	}

	/* Many steps in a squeezed band narrow their bars rather than overflow. */
	.bars {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(4px, 1.5em);
		gap: 3px;
		min-width: 0;
	}

	i {
		height: 0.4em;
		border-radius: 2px;
		background: var(--border);
	}

	.done {
		background: var(--done);
	}

	.now {
		background: var(--progress);
	}

	.danger {
		background: var(--danger);
	}

	small {
		color: var(--dim);
		font-weight: 400;
		font-variant-numeric: tabular-nums;
	}
</style>
