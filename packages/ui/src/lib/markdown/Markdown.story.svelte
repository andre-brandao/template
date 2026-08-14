<script module lang="ts">
	import type { Story } from '../story';
	import Markdown from './Markdown.svelte';

	const sample = `# Heading

Prose with **bold**, *italic*, \`code\` and a [link](https://svelte.dev).

- one
- two
- [ ] a task

> Raw HTML never renders: the parser escapes it and \`javascript:\` hrefs are dropped.

| lang | size |
| ---- | ---: |
| ts   |  4.9 |

\`\`\`ts
const answer: number = 42; // highlighted by @tanstack/highlight
\`\`\`
`;

	export const story: Story = {
		title: 'Markdown',
		blurb:
			'Renders the `@tanstack/markdown` AST as real Svelte elements — no `{@html}`, no sanitizer. Pass `components` to override `a`, `img` or `code`. It tracks `value`, so no `{#key}` wrapper is needed.',
		of: Markdown,
		props: { value: { type: 'textarea', value: sample } },
		variants: [
			{ label: 'sample document', props: { value: sample } },
			{ label: 'empty', props: { value: '' } }
		]
	};
</script>
