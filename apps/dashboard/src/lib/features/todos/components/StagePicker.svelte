<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Input } from '@template/ui';
	import { getStages } from '../api/todos.remote';

	let {
		scope = {},
		placeholder = 'Sprint 1',
		...rest
	}: {
		scope?: { source?: string; sourceID?: string };
		placeholder?: string;
	} & HTMLInputAttributes = $props();

	// Free text with the labels already in use as hints, so a project doesn't drift
	// into both "Sprint 1" and "sprint 1". Fetched lazily, on first hover/focus.
	let stages = $state.raw<Awaited<ReturnType<typeof getStages>>>([]);
	let pending = false;

	async function fetch() {
		if (pending) return;
		pending = true;
		stages = await getStages(scope);
	}

	const list = $derived(`stages-${rest.id ?? rest.name ?? 'todo'}`);
</script>

<Input type="text" list={list} {placeholder} {...rest} onpointerenter={fetch} onfocus={fetch} />
<datalist id={list}>
	{#each stages as stage (stage.name)}
		<option value={stage.name}></option>
	{/each}
</datalist>
