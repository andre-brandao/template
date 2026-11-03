<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<section class="card">
	<h2>{title}</h2>
	{@render children()}
</section>

<style>
	.card {
		padding: 1.1em 1.25em 1.25em;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0 0 1em;
		font-size: 0.86em;
		font-weight: 500;
		color: var(--muted);
	}
</style>
