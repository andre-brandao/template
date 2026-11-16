<script module lang="ts">
	import type { Snippet } from 'svelte';

	// One card on a record page. The page or route composes them, so slices never import each other.
	export type Widget = { title: string; body: Snippet; fill?: boolean };
</script>

<!--
	A record page's body: three columns of stacks. `main` spans two beside the `side` stack, then
	each `rest` stack takes a column and the last one stretches to the row's end. Narrower, the
	stacks dissolve so their cards pair up, then line up in one column.
-->
<script lang="ts">
	let {
		main,
		side = [],
		rest = []
	}: { main: Widget; side?: Widget[]; rest?: Widget[][] } = $props();

	const stacks = $derived([[main], side, ...rest].filter((stack) => stack.length));
	// Columns the last stack spans so the final row has no hole.
	const span = $derived(rest.length ? 3 - ((rest.length - 1) % 3) : 1);
</script>

{#snippet card(widget: Widget)}
	<section class="card">
		<h2>{widget.title}</h2>
		{@render widget.body()}
	</section>
{/snippet}

<div class="widgets">
	<div class="grid" style:--span={span}>
		{#each stacks as stack, i (stack[0].title)}
			<div class={['stack', { main: i === 0 }]}>
				{#each stack as widget (widget.title)}
					{#if widget.fill}
						<div class="fill">{@render card(widget)}</div>
					{:else}
						{@render card(widget)}
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	/* Sized off its own box, so the shell's side panels and the drawer pick the column count. */
	.widgets {
		container: widgets / inline-size;
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1em;
	}

	.stack {
		display: contents;
	}

	.card {
		min-width: 0;
		padding: 1em 1.25em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	h2 {
		margin: 0 0 0.75em;
		font-size: 0.92em;
		font-weight: 600;
		color: var(--muted);
	}

	/* Stacked, a fill card can't borrow a neighbour's height, so it caps its own. */
	.fill > .card {
		max-height: 22em;
		overflow: auto;
	}

	@container widgets (min-width: 36rem) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.main > .card,
		.fill {
			grid-column: 1 / -1;
		}
	}

	@container widgets (min-width: 56rem) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.stack {
			display: flex;
			flex-direction: column;
			gap: 1em;
			min-width: 0;
		}

		.main {
			grid-column: span 2;
		}

		.stack:last-child:not(.main) {
			grid-column: span var(--span);
		}

		/* Each stack's last card stretches, so stack bottoms line up across a row. */
		.stack > :last-child {
			flex: 1;
		}

		.main > .card,
		.fill {
			grid-column: auto;
		}

		/* A fill card never sets the row height: it takes what its neighbours leave, and scrolls. */
		.fill {
			position: relative;
			min-height: 12em;
		}

		.fill > .card {
			position: absolute;
			inset: 0;
			max-height: none;
		}
	}
</style>
