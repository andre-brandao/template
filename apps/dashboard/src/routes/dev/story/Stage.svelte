<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import type { Control, Entry } from '@template/ui/story';
	import Controls from './Controls.svelte';
	import Code from './Code.svelte';
	import { markup, snippet } from './snippet';

	let { entry }: { entry: Entry } = $props();

	const story = $derived(entry.story);
	const Demo = $derived(entry.demo);
	const Live = $derived(story.of);
	// Empty for prop-only stories: nothing survives once the module block is stripped.
	const source = $derived(markup(entry.src));

	const tabs = $derived(['preview', story.props || source ? 'code' : undefined].filter(
		(one) => one !== undefined
	));
	// Carried in the URL, so the tab survives a jump to another component and a reload.
	const tab = $derived(tabs.find((one) => one === page.url.searchParams.get('tab')) ?? 'preview');

	const seed = (props: Record<string, Control>) =>
		Object.fromEntries(Object.entries(props).map(([name, one]) => [name, one.value]));

	// Seeded once — the page keys this component on the slug, so a new story remounts.
	let state = $state<Record<string, unknown>>(
		untrack(() => (entry.story.props ? seed(entry.story.props) : {}))
	);
</script>

<div class="stage">
	<header>
		<h1>{story.title}</h1>
		<nav class="tabs" aria-label="View">
			{#each tabs as one (one)}
				<a
					class="tab"
					class:active={tab === one}
					aria-current={tab === one ? 'page' : undefined}
					href="?tab={one}"
					data-sveltekit-replacestate
					data-sveltekit-noscroll>{one}</a
				>
			{/each}
		</nav>
	</header>

	<div class="panel scroll">
		<p class="blurb">{story.blurb ?? ''}</p>

		{#if tab === 'preview'}
			<section class="live">
				<!-- One frame either way, so the preview lands in the same place for every story:
				     the controllable instance, or the story file's own markup. -->
				<div class="frame" class:canvas={!!story.props}>
					{#if story.props}
						{#key story.remount ? JSON.stringify(state) : ''}
							{#if story.slot}
								<Live {...story.base} {...state}>{story.slot}</Live>
							{:else}
								<Live {...story.base} {...state} />
							{/if}
						{/key}
					{/if}
					<Demo />
				</div>
				{#if story.props}
					<Controls controls={story.props} bind:state />
				{/if}
			</section>
			{#if story.variants}
				<section class="variants">
					<h2>Variants</h2>
					<div class="grid">
						{#each story.variants as variant (variant.label)}
							<figure>
								<figcaption>{variant.label}</figcaption>
								{#if story.slot}
									<Live {...story.base} {...variant.props}>{story.slot}</Live>
								{:else}
									<Live {...story.base} {...variant.props} />
								{/if}
							</figure>
						{/each}
					</div>
				</section>
			{/if}
		{:else}
			<section class="codes">
				{#if story.props}
					<Code text={snippet(story, state)} />
				{/if}
				{#if source}
					<Code text={source} label="Story source" />
				{/if}
			</section>
		{/if}
	</div>
</div>

<style>
	.tab {
		text-transform: capitalize;
	}

	.panel {
		display: flex;
		flex-direction: column;
		padding-top: 1.25em;
	}

	/* Three lines are reserved whatever the blurb runs to, so the frame below starts at the
	   same place for every story. */
	.blurb {
		margin: 0 0 1.2em;
		min-height: 4.35em;
		max-width: 60ch;
		color: var(--muted);
		font-size: 0.9em;
		line-height: 1.45;
	}

	section {
		margin-bottom: 1.5em;
	}

	/* The preview takes what the variants below it don't need, down to a floor that keeps a
	   tall component readable; past that the panel scrolls. */
	.live,
	.codes {
		display: flex;
		flex: 1;
		min-height: 11em;
		gap: 1.25em;
	}

	.codes {
		flex-direction: column;
		gap: 1em;
	}

	.frame {
		flex: 1;
		min-width: 0;
		overflow: auto;
		padding: 1.5em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	/* A live instance sits centred on a faint checkerboard, so a transparent component
	   still reads against a ground; a story's own markup stays top-left like a page. */
	.canvas {
		display: flex;
		/* `safe`: an instance taller than the frame aligns to the start instead of
		   centring its overflow out of reach. */
		align-items: safe center;
		justify-content: safe center;
		--tile: color-mix(in oklab, var(--surface-2) 55%, var(--surface));
		background:
			conic-gradient(var(--tile) 25%, transparent 0 50%, var(--tile) 0 75%, transparent 0) 0 0 /
			20px 20px,
			var(--surface);
	}

	/* auto-fit, not auto-fill: a story with two variants gets two half-width cards rather
	   than two narrow ones beside a row of empty tracks. */
	.variants {
		flex: none;
	}

	h2 {
		margin: 0 0 0.7em;
		font-family: var(--font-mono);
		font-size: 0.7em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15em, 1fr));
		align-content: start;
		gap: 0.9em;
	}

	figure {
		display: flex;
		flex-direction: column;
		gap: 0.7em;
		margin: 0;
		padding: 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	figcaption {
		font-family: var(--font-mono);
		font-size: 0.7em;
		color: var(--dim);
	}

	@media (max-width: 900px) {
		.stage {
			height: auto;
		}

		.panel {
			overflow: visible;
		}

		.live {
			flex-direction: column;
		}

		.codes {
			display: block;
		}

		.frame {
			overflow: visible;
		}
	}

	/* Named only while the swap it owns is running: an unconditional name would make this
	   its own group on every navigation, including ones where it exists on one side only. */
	:global(html[data-swap~='tab']) .panel {
		view-transition-name: stage;
	}

	:global(::view-transition-old(stage)),
	:global(::view-transition-new(stage)) {
		animation-duration: 200ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
		animation-fill-mode: both;
		mix-blend-mode: normal;
	}

	:global(::view-transition-old(stage)) {
		animation-name: out;
	}

	:global(::view-transition-new(stage)) {
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
		:global(::view-transition-old(stage)),
		:global(::view-transition-new(stage)) {
			animation: none;
		}
	}
</style>
