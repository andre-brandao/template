<script module lang="ts">
	import type { Story } from '../story';
	import Button from './Button.svelte';

	export const story: Story = {
		title: 'Button',
		blurb:
			'A text button. `secondary` is the default; give `variant="primary"` to the one main action on a screen (a form submit, the header\'s create). `pending` disables it and shows a Spinner. Icon-only controls are `IconButton`.',
		of: Button,
		slot: 'Save changes',
		props: {
			variant: {
				type: 'select',
				value: 'secondary',
				options: ['primary', 'secondary', 'danger', 'ghost']
			},
			type: { type: 'select', value: 'button', options: ['button', 'submit', 'reset'] },
			pending: { type: 'bool', value: false },
			disabled: { type: 'bool', value: false }
		},
		variants: [
			{ label: 'primary', props: { variant: 'primary' } },
			{ label: 'secondary', props: { variant: 'secondary' } },
			{ label: 'danger', props: { variant: 'danger' } },
			{ label: 'ghost', props: { variant: 'ghost' } },
			{ label: 'pending', props: { pending: true } },
			{ label: 'disabled', props: { disabled: true } }
		]
	};
</script>
