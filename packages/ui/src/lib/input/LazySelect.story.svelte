<script module lang="ts">
	import type { Story } from '../story';
	import Field from '../field/Field.svelte';
	import LazySelect from './LazySelect.svelte';
	import type { Option } from './Select.svelte';

	export const story: Story = {
		title: 'LazySelect',
		blurb: 'Fetches its options once, on first hover or focus. Point at the control below.',
		of: LazySelect
	};
</script>

<script lang="ts">
	// Imports the markup below needs — they sit in the story's module block, which is not shown.
	// import { LazySelect, type Option } from '@template/ui';

	const statics = [{ value: '', label: 'Any project' }];

	// Deliberately slow, so the hover-then-fill is visible.
	const load = () =>
		new Promise<Option[]>((ok) =>
			setTimeout(
				() =>
					ok([
						{ value: 'p1', label: 'Website rebuild' },
						{ value: 'p2', label: 'Billing', hint: 'archived' },
						{ value: 'p3', label: 'Onboarding' }
					]),
				800
			)
		);
</script>

<Field label="Project">
	<LazySelect {load} options={statics} />
</Field>

<p class="note">
	A value outside the static options fetches immediately instead, so the label resolves:
</p>

<Field label="Preselected">
	<LazySelect {load} options={statics} value="p2" dedupe />
</Field>

<style>
	.note {
		margin: 1.2em 0 0.6em;
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
