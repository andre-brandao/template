<script module lang="ts">
	import type { Story } from '../story';
	import Toggle from './Toggle.svelte';

	export const story: Story = {
		title: 'Toggle',
		blurb:
			'An on/off filter chip for a toolbar, in place of a checkbox. `pressed` is bindable and announced through `aria-pressed`; `count` adds a tabular badge. Sized by `--control`, so it matches the inputs on a filter row.',
		of: Toggle,
		slot: 'Only overdue',
		props: {
			pressed: { type: 'bool', value: false },
			count: { type: 'number', value: 3 }
		},
		variants: [
			{ label: 'off', props: { pressed: false } },
			{ label: 'on', props: { pressed: true } },
			{ label: 'count', props: { pressed: true, count: 12 } }
		]
	};
</script>
