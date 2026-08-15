<script module lang="ts">
	import type { Story } from '../story';
	import Card from './Card.svelte';

	export const story: Story = {
		title: 'Card',
		blurb:
			'Renders an `<a>` when given `href`, otherwise `as`. `accent` paints a rail down the left edge, and `dense` tightens the padding for list rows.',
		of: Card,
		slot: 'A card holds whatever it is given.',
		props: {
			accent: { type: 'text', value: '' },
			interactive: { type: 'bool', value: false },
			dense: { type: 'bool', value: false },
			as: { type: 'select', value: 'div', options: ['div', 'li'] },
			href: { type: 'text', value: '' }
		},
		variants: [
			{ label: 'plain', props: {} },
			{ label: 'interactive', props: { interactive: true } },
			{ label: 'accent', props: { accent: 'var(--accent)' } },
			{ label: 'danger accent', props: { accent: 'var(--danger)' } },
			{ label: 'dense row', props: { as: 'li', dense: true, accent: 'var(--accent)' } },
			{ label: 'link', props: { href: '/dev/story/card', interactive: true } }
		]
	};
</script>
