<script lang="ts">
	import { page } from '$app/state';
	import { Markdown, Tabs } from '@template/ui';
	import Frame from './Frame.svelte';
	import Link from './Link.svelte';

	let { data } = $props();

	const feature = $derived(data.features.find((one) => one.name === page.params.feature));
</script>

<div class="stage">
	<header>
		<h1>{feature?.title ?? page.params.feature}</h1>
		{#if data.docs.length > 1}
			<nav aria-label="Document">
				<Tabs.Root>
					{#each data.docs as one (one)}
						<Tabs.Item
							active={data.doc === one}
							aria-current={data.doc === one ? 'page' : undefined}
							href="?doc={one}"
							data-sveltekit-replacestate
							data-sveltekit-noscroll>{one.toLowerCase()}</Tabs.Item
						>
					{/each}
				</Tabs.Root>
			</nav>
		{/if}
	</header>

	<div class="panel">
		<Markdown value={data.text} html components={{ html: Frame, a: Link }} />
	</div>
</div>

<style>
	/* Header and tabs are fixed chrome; only the panel below them scrolls. */
	.stage {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.stage > header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		padding-bottom: 0.9em;
		border-bottom: 1px solid var(--border);
	}

	.stage h1 {
		margin: 0;
		font-size: 1.5em;
	}

	.panel {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		/* Reaching the end shouldn't hand the scroll to the document behind it. */
		overscroll-behavior: contain;
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

	/* The three screens that own a same-page swap share this animation. It can't be lifted
	   without one global view-transition-name for all of them, and the marker has to sit on
	   the line the clone starts on. */
	/* fallow-ignore-next-line code-duplication */
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
