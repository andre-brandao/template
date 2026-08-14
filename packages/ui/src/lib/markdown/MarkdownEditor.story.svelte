<script module lang="ts">
	import type { Story } from '../story';
	import MarkdownEditor from './MarkdownEditor.svelte';

	export const story: Story = {
		title: 'MarkdownEditor',
		blurb:
			'`value` is bindable and `upload` is required — the app hands in its own IO. Drop an image on the editor.',
		of: MarkdownEditor
	};
</script>

<script lang="ts">
	let value = $state('Drop a png here, or use the attachment button.');

	// Stands in for the app's real uploader: keeps the file in the page as a data URL.
	const upload = (file: File) =>
		new Promise<string | null>((ok) => {
			const reader = new FileReader();
			reader.onload = () => ok(String(reader.result));
			reader.onerror = () => ok(null);
			reader.readAsDataURL(file);
		});
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
