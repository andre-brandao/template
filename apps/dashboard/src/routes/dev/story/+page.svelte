<script lang="ts">
	import { stories } from '@template/ui/story';
</script>

<h1>Storybook</h1>
<p>
	Every component in <code>@template/ui</code>, {stories.length} of them. Stories live beside their
	components in <code>packages/ui/src/lib</code> and are listed in
	<code>src/lib/story.ts</code>.
</p>
<p class="hint">Pick one from the list.</p>

<style>
	h1 {
		margin: 0 0 0.4em;
		font-size: 1.5em;
	}

	p {
		max-width: 60ch;
		color: var(--muted);
		font-size: 0.9em;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	.hint {
		color: var(--dim);
	}
</style>
