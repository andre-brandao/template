<script module lang="ts">
	import type { Story } from '../story';
	import MarkdownEditor from './MarkdownEditor.svelte';

	export const story: Story = {
		title: 'MarkdownEditor',
		blurb:
			'`value` is bindable and `upload` is required — the app hands in its own IO. Drop or paste an image: the preview shows a spinner while `upload` is in flight, then swaps in the URL it returns.',
		of: MarkdownEditor
	};
</script>

<script lang="ts">
	// Imports the markup below needs — they sit in the story's module block, which is not shown.
	// import { MarkdownEditor } from '@template/ui';

	let value = $state('Drop a png here, or use the + button.');

	// Stands in for the app's uploader, which returns a `/files/...` path. Slow on purpose so the
	// pending state is visible; data: and blob: URLs would be stripped by the parser.
	const upload = () =>
		new Promise<string | null>((ok) => setTimeout(() => ok('/favicon.svg'), 1200));
</script>

<div class="editor"><MarkdownEditor bind:value {upload} /></div>

<pre>{value}</pre>

<style>
	.editor {
		height: 22em;
	}

	pre {
		margin-top: 1.2em;
		padding: 0.8em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--muted);
		font-size: 0.78em;
		white-space: pre-wrap;
	}
</style>
