<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { createQuery } from '@tanstack/svelte-query';
	import { Input } from '@template/ui';
	import { stages } from '../api/todos.query';

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
	let touched = $state(false);
	const query = createQuery(() => ({ ...stages(scope), enabled: touched }));

	const list = $derived(`stages-${rest.id ?? rest.name ?? 'todo'}`);
</script>

<Input
	type="text"
	{list}
	{placeholder}
	{...rest}
	onpointerenter={() => (touched = true)}
	onfocus={() => (touched = true)}
/>
<datalist id={list}>
	{#each query.data ?? [] as stage (stage.name)}
		<option value={stage.name}></option>
	{/each}
</datalist>
