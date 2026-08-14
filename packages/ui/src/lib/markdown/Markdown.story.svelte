<script module lang="ts">
	import type { Story } from '../story';
	import Markdown from './Markdown.svelte';

	const sample = `# Heading

Prose with **bold**, *italic*, \`code\` and a [link](https://svelte.dev).

- one
- two

> Sanitized through DOMPurify, so raw HTML never lands.

\`\`\`ts
const answer = 42;
\`\`\`
`;

	export const story: Story = {
		title: 'Markdown',
		blurb:
			'Read-only Carta viewer, coloured from the app tokens via `markdown.css`. It renders once and ignores later `value` changes — wrap it in `{#key value}` to follow edits, which is what this story does.',
		of: Markdown,
		remount: true,
		props: { value: { type: 'textarea', value: sample } },
		variants: [
			{ label: 'sample document', props: { value: sample } },
			{ label: 'empty', props: { value: '' } }
		]
	};
</script>
