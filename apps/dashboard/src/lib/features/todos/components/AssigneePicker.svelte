<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { LazySelect } from '@template/ui';
	import { getUsers } from '../api/todos.remote';

	let {
		value,
		empty = 'Unassigned',
		...rest
	}: { value?: string | null; empty?: string } & HTMLSelectAttributes = $props();
</script>

<!-- Only a picker needs the whole directory, and only once it's touched. -->
<LazySelect
	options={[{ value: '', label: empty }]}
	load={async () =>
		(await getUsers({})).map((one) => ({ value: one.id, label: one.name, hint: one.email }))}
	value={value ?? ''}
	{...rest}
/>
