<script module lang="ts">
	import type { Story } from '../story';
	import Stat from './Stat.svelte';

	export const story: Story = {
		title: 'Stat',
		blurb:
			'One figure with its label and an optional note. `href` makes the tile a link; `children` stand in for `value` when the figure loads on its own.',
		of: Stat,
		props: {
			label: { type: 'text', value: 'Users' },
			value: { type: 'text', value: '1,204' },
			note: { type: 'text', value: '12 disabled' },
			href: { type: 'text', value: '' }
		},
		variants: [
			{ label: 'plain', props: { label: 'Projects', value: '38' } },
			{ label: 'with note', props: { label: 'Todos', value: '912', note: '640 done' } },
			{ label: 'link', props: { label: 'Logs', value: '20,511', href: '/dev/story/stat' } }
		]
	};
</script>
