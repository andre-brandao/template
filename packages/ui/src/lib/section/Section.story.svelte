<script module lang="ts">
	import type { Story } from '../story';
	import Section from './Section.svelte';

	export const story: Story = {
		title: 'Section',
		blurb: 'A heading and description beside content. A divider separates sections; narrow screens stack the columns.',
		of: Section,
		slot: 'Section content',
		props: {
			title: { type: 'text', value: 'Details' },
			description: { type: 'text', value: 'Describe what the reader can change here.' },
			danger: { type: 'bool', value: false },
			divider: { type: 'bool', value: false }
		}
	};
</script>

<script lang="ts">
	import Button from '../input/Button.svelte';
	import Field from '../field/Field.svelte';
	import Input from '../input/Input.svelte';
</script>

<Section title="Details" description="The name that appears in lists.">
	<Field label="Name">
		<Input placeholder="Display name" />
	</Field>
</Section>

<Section title="Links" divider>
	{#snippet description()}
		Add a link to <a href="https://example.com">your website</a>.
	{/snippet}
	<Input placeholder="https://example.com" />
</Section>

<Section title="Delete" description="Remove this record from the lists." danger divider>
	<Button>Delete record</Button>
</Section>
