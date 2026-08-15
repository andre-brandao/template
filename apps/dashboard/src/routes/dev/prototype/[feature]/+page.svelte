<script lang="ts">
	import { page } from '$app/state';
	import { Markdown } from '@template/ui';
	import Frame from './Frame.svelte';
	import Link from './Link.svelte';

	let { data } = $props();

	const feature = $derived(data.features.find((one) => one.name === page.params.feature));
</script>

<div class="stage">
	<header>
		<h1>{feature?.title ?? page.params.feature}</h1>
		{#if data.docs.length > 1}
			<nav class="tabs" aria-label="Document">
				{#each data.docs as one (one)}
					<a
						class="tab"
						class:active={data.doc === one}
						aria-current={data.doc === one ? 'page' : undefined}
						href="?doc={one}"
						data-sveltekit-replacestate
						data-sveltekit-noscroll>{one.toLowerCase()}</a
					>
				{/each}
			</nav>
		{/if}
	</header>

	<div class="panel scroll">
		<Markdown value={data.text} html components={{ html: Frame, a: Link }} />
	</div>
</div>

<style>
	/* Header and tabs are fixed chrome; only the panel scrolls, as in the storybook stage. */
	.stage {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		padding-bottom: 0.9em;
		border-bottom: 1px solid var(--border);
	}

	h1 {
		margin: 0;
		font-size: 1.5em;
	}

	.tab {
		text-decoration: none;
	}

	.panel {
		padding: 1.25em 0 3em;
	}

	/* The scrollbar stays at the pane's edge; the column inside holds everything — prose,
	   mockups and diagrams — at one measure so their edges line up. */
	.panel :global(.markdown-body) {
		max-width: 80ch;
	}
</style>
