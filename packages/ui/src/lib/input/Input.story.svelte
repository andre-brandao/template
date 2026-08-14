<script module lang="ts">
	import type { Story } from '../story';
	import Input from './Input.svelte';

	export const story: Story = {
		title: 'Input',
		blurb: 'A bare `<input>` wearing the app chrome — every attribute spreads through.',
		of: Input,
		props: {
			type: {
				type: 'select',
				value: 'text',
				options: ['text', 'email', 'password', 'date', 'number']
			},
			placeholder: { type: 'text', value: 'you@example.com' },
			value: { type: 'text', value: '' },
			disabled: { type: 'bool', value: false }
		},
		variants: [
			{ label: 'empty', props: { placeholder: 'Search…' } },
			{ label: 'filled', props: { value: 'hello@example.com' } },
			{ label: 'disabled', props: { value: 'locked', disabled: true } },
			{ label: 'date', props: { type: 'date' } }
		]
	};
</script>
