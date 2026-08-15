<script module lang="ts">
	import type { Story } from '../story';
	import Code from './Code.svelte';

	const ts = `export function greet(name: string) {
  // a comment
  const count = 42;
  return \`hello \${name}\`;
}`;

	const json = `{
  "type": "todo.created",
  "data": { "id": "tod_01", "done": false }
}`;

	export const story: Story = {
		title: 'Code',
		blurb:
			'Syntax highlighting from `@tanstack/highlight`: tokens are real `<span>`s coloured by `code.css`, so there is no `{@html}` and no theme stylesheet. Consumers restyle the frame with `:global(pre.tm-code)`. Past 50k characters it renders plain to keep tokenising off the critical path.',
		of: Code,
		props: {
			value: { type: 'textarea', value: ts },
			lang: {
				type: 'select',
				value: 'ts',
				options: ['ts', 'json', 'shell', 'svelte', 'sql', 'yaml', 'diff', 'plaintext']
			},
			title: { type: 'text', value: '' }
		},
		variants: [
			{ label: 'typescript', props: { value: ts, lang: 'ts' } },
			{ label: 'json', props: { value: json, lang: 'json' } },
			{ label: 'shell', props: { value: 'curl -X POST https://x.co/api \\\n  -d \'{"a":1}\'', lang: 'shell' } },
			{ label: 'titled', props: { value: ts, lang: 'ts', title: 'greet.ts' } }
		]
	};
</script>
