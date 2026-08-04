<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { Select } from '@template/ui';
	import { getUsers } from '../api/todos.remote';

	let {
		value,
		empty = 'Unassigned',
		...rest
	}: { value?: string | null; empty?: string } & HTMLSelectAttributes = $props();

	// Only a picker needs the whole directory, so only a picker fetches it.
	const users = $derived(await getUsers({}));
	const options = $derived([
		{ value: '', label: empty },
		...users.map((one) => ({ value: one.id, label: one.name, hint: one.email }))
	]);
</script>

<Select {options} value={value ?? ''} {...rest} />
