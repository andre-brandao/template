<script lang="ts">
	import { untrack } from 'svelte';
	import type { Control, Entry } from '@template/ui/story';
	import Controls from './Controls.svelte';

	let { entry }: { entry: Entry } = $props();

	const story = $derived(entry.story);
	const Demo = $derived(entry.demo);
	const Live = $derived(story.of);

	const seed = (props: Record<string, Control>) =>
		Object.fromEntries(Object.entries(props).map(([name, one]) => [name, one.value]));

	// Seeded once — the page keys this component on the slug, so a new story remounts.
	let state = $state<Record<string, unknown>>(
		untrack(() => (entry.story.props ? seed(entry.story.props) : {}))
	);
</script>

<header>
	<h1>{story.title}</h1>
	{#if story.blurb}<p>{story.blurb}</p>{/if}
</header>

{#if story.props}
	<section class="live">
		<div class="canvas">
			{#key story.remount ? JSON.stringify(state) : ''}
				{#if story.slot}
					<Live {...story.base} {...state}>{story.slot}</Live>
				{:else}
					<Live {...story.base} {...state} />
				{/if}
			{/key}
		</div>
		<Controls controls={story.props} bind:state />
	</section>
{/if}

{#if story.variants}
	<section>
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

<!-- The story file's own markup — empty for the ones the object fully describes. -->
<section class="demo"><Demo /></section>

<style>
	header {
		margin-bottom: 1.6em;
	}

	h1 {
		margin: 0;
		font-size: 1.5em;
	}

	header p {
		margin: 0.35em 0 0;
		max-width: 60ch;
		color: var(--muted);
		font-size: 0.9em;
	}

	section {
		margin-bottom: 2em;
	}

	h2 {
		margin: 0 0 0.8em;
		font-family: var(--font-mono);
		font-size: 0.7em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.live {
		display: flex;
		align-items: flex-start;
		gap: 1.25em;
	}

	.canvas {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 9em;
		padding: 1.5em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		/* Faint checkerboard, so a transparent component still reads against a ground. */
		--tile: color-mix(in oklab, var(--surface-2) 55%, var(--surface));
		background:
			conic-gradient(var(--tile) 25%, transparent 0 50%, var(--tile) 0 75%, transparent 0) 0 0 /
			20px 20px,
			var(--surface);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13em, 1fr));
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
		.live {
			flex-direction: column;
		}
	}
</style>
