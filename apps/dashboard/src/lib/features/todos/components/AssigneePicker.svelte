<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { LazySelect } from '@template/ui';
	import { users } from '../api/todos.query';

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

	const client = useQueryClient();
</script>

<!-- Only a picker needs the whole directory, and only once it's touched. -->
<LazySelect
	dedupe
	options={[
		{ value: '', label: empty },
		...(selected ? [{ value: selected.id, label: selected.name }] : [])
	]}
	load={async () =>
		(await client.fetchQuery(users())).map((one) => ({
			value: one.id,
			label: one.name,
			hint: one.email
		}))}
	value={value ?? ''}
	{...rest}
/>
