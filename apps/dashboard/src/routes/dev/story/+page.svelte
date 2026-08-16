<script lang="ts">
	import { Card } from '@template/ui';
	import { resolve } from '$app/paths';
	import { stories } from '@template/ui/story';
</script>

<div class="index">
	<header>
		<h1>Storybook</h1>
		<p>
			Every component in <code>@template/ui</code>, {stories.length} of them. Stories live beside
			their components in <code>packages/ui/src/lib</code> and are listed in
			<code>src/lib/story.ts</code>.
		</p>
	</header>

	<div class="list">
		{#each stories as entry (entry.slug)}
			<Card href={resolve('/dev/story/[name]', { name: entry.slug })} interactive>
				<h2>{entry.story.title}</h2>
				<!-- Blurbs are written with backticks; the odd parts of the split are the spans
				     between them. -->
				<p>
					{#each (entry.story.blurb ?? '').split('`') as part, i (i)}
						{#if i % 2}<code>{part}</code>{:else}{part}{/if}
					{/each}
				</p>
			</Card>
		{/each}
	</div>
</div>

<style>
	/* Same shape as a story page: the intro is fixed chrome, the list below it scrolls. */
	.index {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	header {
		padding-bottom: 0.9em;
		border-bottom: 1px solid var(--border);
	}

	h1 {
		margin: 0 0 0.4em;
		font-size: 1.5em;
	}

	header p {
		max-width: 60ch;
		margin: 0;
		color: var(--muted);
		font-size: 0.9em;
	}

	header code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	/* Wide cards, so a blurb reads as prose rather than a column of two-word lines. */
	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(24em, 1fr));
		align-content: start;
		gap: 0.8em;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1.25em 0 3em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 0.95em;
	}

	.list p {
		margin: 0;
		color: var(--muted);
		font-size: 0.82em;
		line-height: 1.5;
	}

	.list code {
		font-family: var(--font-mono);
		color: var(--ink);
	}

	@media (max-width: 900px) {
		.index {
			height: auto;
		}

		.list {
			overflow: visible;
		}
	}
</style>
