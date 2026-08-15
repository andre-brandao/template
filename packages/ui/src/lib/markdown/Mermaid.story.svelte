<script module lang="ts">
	import type { Story } from '../story';
	import Mermaid from './Mermaid.svelte';

	const flow = `flowchart LR
  A[Fence] -->|lang=mermaid| B(Mermaid)
  A -->|anything else| C(Code)
  B --> D{renders?}
  D -->|yes| E[SVG]
  D -->|no| F[highlighted source]`;

	const seq = `sequenceDiagram
  Browser->>API: POST /files
  API-->>Browser: { url }
  Browser->>Editor: swap placeholder`;

	const chart = `xychart-beta
  title "Lockfile entries"
  x-axis [mermaid, beautiful]
  bar [137, 3]`;

	export const story: Story = {
		title: 'Mermaid',
		blurb:
			'Rendered by `beautiful-mermaid` — synchronous and DOM-free, so the SVG comes out of SSR with no hydration swap. Colours go in as `var(--...)` references, so the light/dark toggle repaints without a re-render. Six diagram types are supported; anything else throws and falls back to the highlighted source, which the Code tab also shows on demand. Pass `ascii` for box-drawing text instead of an SVG — plain output, so it escapes rather than going through {@html}.',
		of: Mermaid,
		props: {
			value: { type: 'textarea', value: flow },
			ascii: { type: 'bool', value: false }
		},
		variants: [
			{ label: 'flowchart', props: { value: flow } },
			{ label: 'sequence', props: { value: seq } },
			{ label: 'xychart', props: { value: chart } },
			{ label: 'unsupported (pie)', props: { value: 'pie\n  "A" : 60\n  "B" : 40' } },
			{ label: 'broken source', props: { value: 'flowchart LR\n  A --> ' } }
		]
	};
</script>
