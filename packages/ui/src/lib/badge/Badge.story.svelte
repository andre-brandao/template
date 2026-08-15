<script module lang="ts">
	import type { Story } from '../story';
	import Badge from './Badge.svelte';

	export const story: Story = {
		title: 'Badge',
		blurb:
			'A state, not a decoration: `tone` names what is being reported and the token supplies the colour, so the same word reads the same way on every screen. The border is a wash of the text colour, which keeps a mixed row at one weight.',
		of: Badge,
		slot: 'ready',
		props: {
			tone: {
				type: 'select',
				value: 'done',
				options: ['muted', 'pending', 'progress', 'done', 'danger', 'accent']
			}
		},
		variants: [
			{ label: 'muted', props: { tone: 'muted' } },
			{ label: 'pending', props: { tone: 'pending' } },
			{ label: 'progress', props: { tone: 'progress' } },
			{ label: 'done', props: { tone: 'done' } },
			{ label: 'danger', props: { tone: 'danger' } },
			{ label: 'accent', props: { tone: 'accent' } }
		]
	};
</script>
