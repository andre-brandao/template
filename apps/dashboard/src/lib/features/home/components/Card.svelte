<!-- One home widget in a card: title, optional hint, and the body the route composed. -->
<script lang="ts">
	import type { Widget } from '../modules';

	let { widget }: { widget: Widget } = $props();
</script>

<section>
	<h2>{widget.title}</h2>
	{#if widget.hint}<p>{widget.hint}</p>{/if}
	<div class="body">{@render widget.body()}</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 1em 1.25em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	h2 {
		margin: 0 0 0.75em;
		font-size: 1em;
	}

	p {
		margin: -0.5em 0 1em;
		font-size: 0.93em;
		color: var(--muted);
	}

	.body {
		min-width: 0;
	}
</style>
