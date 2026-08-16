<script module lang="ts">
	import type { Story } from '../story';
	import Field from './Field.svelte';

	export const story: Story = {
		title: 'Field',
		blurb:
			'A caption over a control. It renders a `label`, so the control inside is associated without an id; `as="div"` is the way out for an editor or a tag list, which cannot legally sit in one. The caption style lives here and nowhere else, so every form on every screen labels the same way.',
		of: Field,
		slot: 'control goes here',
		props: { label: { type: 'text', value: 'Display name' } }
	};
</script>

<script lang="ts">
	// import { Field, Input } from '@template/ui';
	import Input from '../input/Input.svelte';
</script>

<div class="pair">
	<Field label="Endpoint URL">
		<Input placeholder="https://example.com/hooks" />
	</Field>

	<Field label="Expires" style="max-width: 12em">
		<Input type="date" />
	</Field>
</div>

<style>
	.pair {
		display: grid;
		gap: 1em;
		max-width: 28em;
	}
</style>
