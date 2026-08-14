<script module lang="ts">
	import type { Story } from '../story';
	import LazySelect from './LazySelect.svelte';
	import type { Option } from './Select.svelte';

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

	export const story: Story = {
		title: 'LazySelect',
		blurb: 'Fetches its options once, on first hover or focus. Point at the control below.',
		of: LazySelect
	};
</script>

<label class="field">
	<span>Project</span>
	<LazySelect {load} options={statics} />
</label>

<p class="note">
	A value outside the static options fetches immediately instead, so the label resolves:
</p>

<label class="field">
	<span>Preselected</span>
	<LazySelect {load} options={statics} value="p2" dedupe />
</label>

<style>
	.note {
		margin: 1.2em 0 0.6em;
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
