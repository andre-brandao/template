<script lang="ts">
	import { Card } from '@template/ui';
	import { resolve } from '$app/paths';
	import { stories } from '@template/ui/story';
	import * as Header from '$lib/components/header';
</script>

<Header.Root title="Storybook">
	{#snippet lead()}
		Every component in <code>@template/ui</code>, {stories.length} of them. Stories live beside their
		components and are listed in <code>src/lib/story.ts</code>.
	{/snippet}
</Header.Root>

<!-- Wide cards, so a blurb reads as prose rather than a column of two-word lines. -->
<div class="list">
	{#each stories as entry (entry.slug)}
		<Card href={resolve('/dev/story/[name]', { name: entry.slug })} interactive>
			<h2>{entry.story.title}</h2>
			<!-- Blurbs are written with backticks; the odd parts of the split sit between them. -->
			<p>
				{#each (entry.story.blurb ?? '').split('`') as part, i (i)}
					{#if i % 2}<code>{part}</code>{:else}{part}{/if}
				{/each}
			</p>
		</Card>
	{/each}
</div>

<style>
	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 24em), 1fr));
		align-content: start;
		gap: 0.8em;
		padding-bottom: 3em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 0.95em;
	}

	p {
		margin: 0;
		color: var(--muted);
		font-size: 0.82em;
		line-height: 1.5;
	}

	code {
		font-family: var(--font-mono);
		color: var(--ink);
	}
</style>
