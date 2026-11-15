<!-- The signed-out frame: the mark above the form that is asking, on the plain page. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { brand } from '#lib/brand.ts';
	import Brand from '#lib/components/layout/Brand.svelte';

	let { title, lead, children }: { title: string; lead: string; children: Snippet } = $props();
</script>

<svelte:head><title>{title} · {brand.name}</title></svelte:head>

<main>
	<div class="column">
		<div><Brand word /></div>
		<header>
			<h1>{title}</h1>
			<p>{lead}</p>
		</header>
		{@render children()}
	</div>
</main>

<style>
	main {
		display: flex;
		justify-content: center;
		min-height: 100dvh;
		padding: 18vh 1.5em 4em;
		background: var(--bg);
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 1em;
		width: min(380px, 100%);
	}

	header {
		margin: 1em 0 0.4em;
	}

	h1 {
		margin: 0 0 0.35em;
		font-size: 1.4em;
		font-weight: 600;
	}

	header p {
		margin: 0;
		font-size: 0.88em;
		line-height: 1.45;
		color: var(--muted);
	}

	@media (max-width: 640px) {
		main {
			padding-top: 8vh;
		}
	}
</style>
