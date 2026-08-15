<script module lang="ts">
	import type { Story } from '../story';
	import Empty from './Empty.svelte';
	import Button from '../input/Button.svelte';

	export const story: Story = {
		title: 'Empty',
		blurb:
			'What a list says when it has nothing to list. Bare, it is a dim note in the flow — the shape a filtered list wants. Given an `action` it becomes a place on the page, because a screen that is empty for good has somewhere to send the reader.',
		of: Empty,
		slot: 'No tasks match this filter'
	};
</script>

<script lang="ts">
	// import { Empty, Button } from '@template/ui';
</script>

<div class="pair">
	<figure>
		<figcaption>filtered</figcaption>
		<Empty>No tasks match this filter</Empty>
	</figure>

	<figure>
		<figcaption>nothing yet</figcaption>
		<Empty>
			No projects yet. Create one to start filing todos.
			{#snippet action()}
				<Button>New project</Button>
			{/snippet}
		</Empty>
	</figure>
</div>

<style>
	.pair {
		display: grid;
		gap: 1.5em;
		max-width: 32em;
	}

	figure {
		margin: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1em;
	}

	figcaption {
		margin-bottom: 0.6em;
		font-family: var(--font-mono);
		font-size: 0.7em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--dim);
	}
</style>
