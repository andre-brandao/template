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
	.panel {
		padding: 1.25em 0 3em;
	}

	/* The scrollbar stays at the pane's edge; the column inside holds everything — prose,
	   mockups and diagrams — at one measure so their edges line up. */
	.panel :global(.markdown-body) {
		max-width: 80ch;
	}

	/* Named only while the swap it owns is running: an unconditional name would make this
	   its own group on every navigation, including ones where it exists on one side only. */
	:global(html[data-swap~='doc']) .panel {
		view-transition-name: doc;
	}

	:global(::view-transition-old(doc)),
	:global(::view-transition-new(doc)) {
		animation-duration: 200ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
		animation-fill-mode: both;
		mix-blend-mode: normal;
	}

	:global(::view-transition-old(doc)) {
		animation-name: out;
	}

	:global(::view-transition-new(doc)) {
		animation-name: in;
	}

	@keyframes out {
		to {
			opacity: 0;
			transform: translateY(-4px);
		}
	}

	@keyframes in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-old(doc)),
		:global(::view-transition-new(doc)) {
			animation: none;
		}
	}
</style>
