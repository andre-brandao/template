<script lang="ts">
	import { untrack } from 'svelte';
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
	// A story that ships no markup of its own is documented by the instance it describes.
	const live = $derived(!!story.props || !source);

	const seed = (props: Record<string, Control>) =>
		Object.fromEntries(Object.entries(props).map(([name, one]) => [name, one.value]));

	// Seeded once — the page keys this component on the slug, so a new story remounts.
	let state = $state<Record<string, unknown>>(
		untrack(() => (entry.story.props ? seed(entry.story.props) : {}))
	);

	const codes = $derived(
		[
			live ? { label: 'Usage', text: snippet(story, state) } : undefined,
			source ? { label: 'Story source', text: source } : undefined
		].filter((one) => one !== undefined)
	);

	let open = $state(false);
</script>

<div class="stage">
	<header>
		<h1>{story.title}</h1>
	</header>

	<div class="panel">
		<section class="block">
			<div class="row">
				<!-- One frame either way, so the preview lands in the same place for every story:
				     the controllable instance, or the story file's own markup. -->
				<div class="frame" class:canvas={live}>
					{#if live}
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
			</div>

			{#if codes.length}
				<div class="reveal">
					<div class="listing" class:open>
						{#each codes as one (one.label)}
							<Code text={one.text} label={one.label} />
						{/each}
					</div>
					<button onclick={() => (open = !open)} aria-expanded={open}>
						{open ? 'Hide code' : 'View code'}
					</button>
				</div>
			{/if}
		</section>

		{#if story.variants}
			<section class="variants">
				<h2>Examples</h2>
				{#each story.variants as variant (variant.label)}
					<figure>
						<figcaption>{variant.label}</figcaption>
						<div class="sample">
							{#if story.slot}
								<Live {...story.base} {...variant.props}>{story.slot}</Live>
							{:else}
								<Live {...story.base} {...variant.props} />
							{/if}
						</div>
					</figure>
				{/each}
			</section>
		{/if}
	</div>
</div>

<style>
	/* The title is fixed chrome; only the panel below it scrolls. */
	.stage {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.stage > header {
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

	/* Full width on every story — the props panel is a column inside it, not a neighbour, so
	   a story that has none doesn't widen the preview. */
	.block {
		margin-bottom: 2em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
	}

	/* Fixed whatever the component is, so the code under it starts in the same place on every
	   story and revealing it is the only thing that ever moves. */
	.row {
		display: flex;
		height: clamp(16em, 40vh, 26em);
	}

	.frame {
		flex: 1;
		min-width: 0;
		overflow: auto;
		padding: 1.5em;
	}

	/* A live instance sits centred on a faint checkerboard, so a transparent component
	   still reads against a ground; a story's own markup stays top-left like a page. */
	.canvas {
		display: flex;
		/* `safe`: an instance taller than the frame aligns to the start instead of
		   centring its overflow out of reach. */
		align-items: safe center;
		justify-content: safe center;
		/* The one story that has both an instance and its own markup shows them side by side. */
		flex-wrap: wrap;
		gap: 2em;
		--tile: color-mix(in oklab, var(--surface-2) 55%, var(--surface));
		background:
			conic-gradient(var(--tile) 25%, transparent 0 50%, var(--tile) 0 75%, transparent 0) 0 0 /
			20px 20px,
			var(--surface);
	}

	/* Fade and button are positioned against this, not the listing — so scrolling an open
	   listing runs under a pill that stays put. */
	.reveal {
		position: relative;
	}

	.reveal::after {
		content: '';
		position: absolute;
		inset: auto 0 0;
		height: 4.5em;
		pointer-events: none;
		background: linear-gradient(transparent, var(--surface) 85%);
	}

	/* Short enough that every snippet has something left under the fade — the pill would
	   read as decoration otherwise. */
	.listing {
		max-height: 7.5em;
		overflow: hidden;
	}

	.listing.open {
		max-height: 32em;
		overflow: auto;
		overscroll-behavior: contain;
		/* Clears the pill, so the last line is reachable. */
		padding-bottom: 3.5em;
	}

	button {
		position: absolute;
		/* Above the fade — the pseudo-element paints after it otherwise. */
		z-index: 1;
		bottom: 0.7em;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.4em 1em;
		border: 1px solid var(--border-bright);
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.72em;
		cursor: pointer;
		box-shadow: var(--shadow-1);
	}

	button:hover {
		background: var(--surface);
	}

	h2 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.7em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}

	/* Stacked, not tiled: one full-width example at a time reads down the page and gives a
	   wide variant the room a grid track wouldn't. */
	.variants {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
	}

	figure {
		margin: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
	}

	figcaption {
		padding: 0.45em 1em;
		border-bottom: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 0.7em;
		letter-spacing: 0.1em;
		color: var(--dim);
	}

	.sample {
		display: flex;
		align-items: safe center;
		justify-content: safe center;
		min-height: 7em;
		overflow: auto;
		padding: 1.5em;
	}

	@media (max-width: 900px) {
		.stage {
			height: auto;
		}

		.panel {
			overflow: visible;
		}

		.row {
			flex-direction: column;
			height: auto;
		}

		/* `flex: none` first — stacked, the main axis is vertical and a basis of 0 would win
		   over the height. */
		.frame {
			flex: none;
			height: 18em;
		}
	}
</style>
