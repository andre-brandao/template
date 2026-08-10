<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
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

<input type="text" list={list} {placeholder} {...rest} onpointerenter={fetch} onfocus={fetch} />
<datalist id={list}>
	{#each stages as stage (stage.name)}
		<option value={stage.name}></option>
	{/each}
</datalist>

<style>
	input {
		min-width: 0;
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
