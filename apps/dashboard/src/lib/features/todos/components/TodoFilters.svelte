<script module lang="ts">
	import type { Todo } from '@template/core/todo';

	export type Filters = {
		status: 'all' | Todo.Status;
		assignee: string;
		stage: string;
		search: string;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { LazySelect } from '@template/ui';
	import { debounce } from '$lib/utils/debounce';
	import { getStages, getUsers } from '../api/todos.remote';
	import { STATUSES, label } from '../status';

	let {
		filters,
		scope = {},
		tools,
		onchange
	}: {
		filters: Filters;
		scope?: { source?: string; sourceID?: string };
		/** View/group switches and page actions — they ride the search row. */
		tools?: Snippet;
		onchange: (next: Filters) => void;
	} = $props();

	// Writable derived: typing overrides it, external changes (back/forward, reload) resnap it.
	let input = $derived(filters.search);
	const commit = debounce((value: string) => onchange({ ...filters, search: value }), 300);

	function onInput(value: string) {
		input = value;
		commit(value);
	}
</script>

<div class="bar">
	<input
		class="search"
		type="search"
		name="search"
		autocomplete="off"
		placeholder="Search todos…"
		value={input}
		oninput={(e) => onInput(e.currentTarget.value)}
	/>
	{#if tools}
		<div class="tools">{@render tools()}</div>
	{/if}
</div>

<div class="bar">
	<div class="tabs">
		<button
			class="tab"
			class:active={filters.status === 'all'}
			onclick={() => onchange({ ...filters, status: 'all' })}
		>
			All
		</button>
		{#each STATUSES as status (status)}
			<button
				class="tab"
				class:active={filters.status === status}
				onclick={() => onchange({ ...filters, status })}
			>
				{label(status)}
			</button>
		{/each}
	</div>

	<LazySelect
		value={filters.assignee}
		options={[
			{ value: '', label: 'Anyone' },
			{ value: 'none', label: 'Unassigned' }
		]}
		load={async () => (await getUsers({})).map((one) => ({ value: one.id, label: one.name }))}
		onchange={(e) => onchange({ ...filters, assignee: e.currentTarget.value })}
	/>

	<LazySelect
		value={filters.stage}
		options={[
			{ value: '', label: 'Any stage' },
			{ value: 'none', label: 'No stage' }
		]}
		load={async () => (await getStages(scope)).map((one) => ({ value: one.name, label: one.name }))}
		onchange={(e) => onchange({ ...filters, stage: e.currentTarget.value })}
	/>
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6em;
	}

	.bar + .bar {
		margin-top: 0.6em;
	}

	.tools {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6em;
		margin-left: auto;
	}

	.search {
		flex: 1 1 14em;
		min-width: 12em;
		max-width: 26em;
	}

	.search,
	.bar :global(select) {
		font: inherit;
		font-size: 0.85em;
		height: 2.4em;
		padding: 0 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	.search:focus-visible,
	.bar :global(select:focus-visible) {
		border-color: var(--accent);
		outline: none;
	}

	.tabs {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 2px;
		height: 2.4em;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0 2px;
	}
</style>
