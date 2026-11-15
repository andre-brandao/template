<!-- A container with an optional title. -->
<script lang="ts">
	import type { Block } from '../catalog';

	let { props, children }: Block<'Card'> = $props();
</script>

<section class="card">
	{#if props.title || props.description}
		<header>
			{#if props.title}<h4>{props.title}</h4>{/if}
			{#if props.description}<p>{props.description}</p>{/if}
		</header>
	{/if}
	{@render children?.()}
</section>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		min-width: 0;
		padding: 0.75em 0.85em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	header {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
	}

	h4 {
		margin: 0;
		font-size: 0.95em;
		font-weight: 600;
	}

	p {
		margin: 0;
		color: var(--muted);
		font-size: 0.8em;
	}
</style>
