<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { Issue, Skeleton } from '@template/ui';

	let {
		title,
		query,
		height,
		children
	}: {
		title: string;
		query: { data: T | undefined; error: { message: string } | null; isPlaceholderData: boolean };
		/** The loaded body's height, so the skeleton holds the layout. */
		height: string;
		children: Snippet<[T]>;
	} = $props();
</script>

<section class={['card', { stale: query.isPlaceholderData }]}>
	<h2>{title}</h2>
	{#if query.data !== undefined}
		{@render children(query.data)}
	{:else if query.error}
		<Issue>{query.error.message}</Issue>
	{:else}
		<Skeleton h={height} />
	{/if}
</section>

<style>
	.card {
		padding: 1.1em 1.25em 1.25em;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		transition: opacity 140ms ease;
	}

	/* The last range stays up while the next loads, dimmed so it doesn't read as current. */
	.stale {
		opacity: 0.55;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 0.86em;
		font-weight: 500;
		color: var(--muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			transition: none;
		}
	}
</style>
