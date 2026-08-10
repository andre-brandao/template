<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { LazySelect } from '@template/ui';
	import { getUsers } from '../api/todos.remote';

	let {
		value,
		selected,
		empty = 'Unassigned',
		...rest
	}: {
		value?: string | null;
		/** The already-loaded current assignee, so SSR can label it without the directory. */
		selected?: { id: string; name: string } | null;
		empty?: string;
	} & HTMLSelectAttributes = $props();
</script>

<!-- Only a picker needs the whole directory, and only once it's touched. -->
<LazySelect
	dedupe
	options={[
		{ value: '', label: empty },
		...(selected ? [{ value: selected.id, label: selected.name }] : [])
	]}
	load={async () =>
		(await getUsers({})).map((one) => ({ value: one.id, label: one.name, hint: one.email }))}
	value={value ?? ''}
	{...rest}
/>
