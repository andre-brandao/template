<script module lang="ts">
	import type { Story } from '../story';
	import Avatar from './Avatar.svelte';

	export const story: Story = {
		title: 'Avatar',
		blurb:
			'An image when there is one, the first letter of the name when there is not — so a row of people or projects never has a hole in it. `size` drives everything, including the letter.',
		of: Avatar,
		base: { name: 'Ada Lovelace' },
		props: {
			name: { type: 'text', value: 'Ada Lovelace' },
			size: { type: 'number', value: 28 }
		},
		variants: [
			{ label: 'initial', props: { name: 'Ada Lovelace' } },
			{ label: 'image', props: { name: 'Ada Lovelace', image: 'https://i.pravatar.cc/96?img=5' } },
			{ label: 'small', props: { name: 'Rust', size: 16 } },
			{ label: 'large', props: { name: 'Zig', size: 48 } }
		]
	};
</script>
