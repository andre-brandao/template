<script module lang="ts">
	import type { Story } from '../story';
	import Textarea from './Textarea.svelte';

	export const story: Story = {
		title: 'Textarea',
		blurb:
			'The same box as `Input`, for more than a line. It grows with its text from `rows` up to a cap, then scrolls. `value` is bindable and every other attribute spreads through, so a remote form field spreads straight on.',
		of: Textarea,
		props: {
			placeholder: { type: 'text', value: 'What happened, and what did you expect?' },
			rows: { type: 'number', value: 3 },
			disabled: { type: 'bool', value: false }
		},
		variants: [
			{ label: 'empty', props: { placeholder: 'Add a description' } },
			{ label: 'filled', props: { value: 'First line\nSecond line' } },
			{ label: 'one row', props: { rows: 1, placeholder: 'Grows as you type' } },
			{ label: 'disabled', props: { value: 'locked', disabled: true } }
		]
	};
</script>
