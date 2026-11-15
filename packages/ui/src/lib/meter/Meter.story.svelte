<script module lang="ts">
	import type { Story } from '../story';
	import Meter from './Meter.svelte';

	export const story: Story = {
		title: 'Meter',
		blurb:
			'A thin bar for a share of a whole: `value` of `max`, as wide as its container. `tone="danger"` for a reading past its limit. Without `label` it is decoration beside its number.',
		of: Meter,
		props: {
			value: { type: 'number', value: 0.6 },
			max: { type: 'number', value: 1 },
			tone: { type: 'select', value: 'accent', options: ['accent', 'danger'] },
			label: { type: 'text', value: '' }
		},
		variants: [
			{ label: 'share', props: { value: 0.35 } },
			{ label: 'full', props: { value: 1 } },
			{ label: 'danger', props: { value: 0.92, tone: 'danger' } }
		]
	};
</script>
