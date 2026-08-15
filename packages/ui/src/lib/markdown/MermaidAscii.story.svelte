<script module lang="ts">
	import type { Story } from '../story';
	import Mermaid from './Mermaid.svelte';

	const flow = `graph LR
  A[Parse] --> B[Layout]
  B --> C[Draw]`;

	const branch = `flowchart TD
  A[Fence] --> B{lang}
  B -->|mermaid| C[Diagram]
  B -->|other| D[Code]`;

	const seq = `sequenceDiagram
  Browser->>API: POST /files
  API-->>Browser: { url }`;

	const chart = `xychart-beta
  title "Lockfile entries"
  x-axis [mermaid, beautiful]
  bar [137, 3]`;

	export const story: Story = {
		title: 'Mermaid ASCII',
		blurb:
			'The same component with `ascii` set: `renderMermaidASCII` at `colorMode: none`, so the output is plain text in a `<pre>` rather than an SVG through `{@html}`. Unicode box-drawing by default. XY charts get dedicated block characters. Copy-pasteable straight into a terminal, a commit message, or a code comment.',
		of: Mermaid,
		base: { ascii: true },
		props: { value: { type: 'textarea', value: flow } },
		variants: [
			{ label: 'chain', props: { value: flow } },
			{ label: 'branching', props: { value: branch } },
			{ label: 'sequence', props: { value: seq } },
			{ label: 'xy chart', props: { value: chart } }
		]
	};
</script>
