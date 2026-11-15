<script module lang="ts">
	import type { Todo } from '@template/core/todo';

	export type Filters = {
		status: 'all' | Todo.Status;
		assignee: string;
		stage: string;
		search: string;
	};
</script>

<!-- The todo filters as `Header.Group`s, for a header's `strip`. `children` lands before
     Clear, so a view setting (grouping) can sit on the same row. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Input, LazySelect, Select } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { debounce } from '$lib/utils/debounce';
	import { getStages, getUsers } from '../api/todos.remote';
	import { STATUSES, label } from '../status';

	let {
		filters,
		scope = {},
		children,
		onchange
	}: {
		filters: Filters;
		scope?: { source?: string; sourceID?: string };
		children?: Snippet;
		onchange: (next: Filters) => void;
	} = $props();

	// Writable derived: typing overrides it, external changes (back/forward, reload) resnap it.
	let input = $derived(filters.search);
	const commit = debounce((search: string) => onchange({ ...filters, search }), 300);
	const pick = (next: Partial<Filters>) => onchange({ ...filters, ...next });

	const filtered = $derived(
		!!(filters.search || filters.assignee || filters.stage) || filters.status !== 'all'
	);
</script>

<Header.Group>
	<Input
		type="search"
		name="search"
		autocomplete="off"
		aria-label="Search todos"
		placeholder="Search todos…"
		value={input}
		oninput={(e) => {
			input = e.currentTarget.value;
			commit(input);
		}}
	/>
</Header.Group>

<Header.Group label="Status">
	<Select
		aria-label="Status"
		value={filters.status}
		options={[
			{ value: 'all', label: 'Any status' },
			...STATUSES.map((one) => ({ value: one, label: label(one) }))
		]}
		onchange={(e) => pick({ status: e.currentTarget.value as Filters['status'] })}
	/>
</Header.Group>

<Header.Group label="Assignee">
	<LazySelect
		aria-label="Assignee"
		value={filters.assignee}
		options={[
			{ value: '', label: 'Anyone' },
			{ value: 'none', label: 'Unassigned' }
		]}
		load={async () => (await getUsers({})).map((one) => ({ value: one.id, label: one.name }))}
		onchange={(e) => pick({ assignee: e.currentTarget.value })}
	/>
</Header.Group>

<Header.Group label="Stage">
	<LazySelect
		aria-label="Stage"
		value={filters.stage}
		options={[
			{ value: '', label: 'Any stage' },
			{ value: 'none', label: 'No stage' }
		]}
		load={async () => (await getStages(scope)).map((one) => ({ value: one.name, label: one.name }))}
		onchange={(e) => pick({ stage: e.currentTarget.value })}
	/>
</Header.Group>

{@render children?.()}

{#if filtered}
	<Header.Group end>
		<Button
			variant="ghost"
			onclick={() => {
				input = '';
				onchange({ status: 'all', assignee: '', stage: '', search: '' });
			}}
		>
			Clear filters
		</Button>
	</Header.Group>
{/if}
