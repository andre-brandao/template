<!-- Stages are free text, so the picker offers the labels in use and creates whatever is typed. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Combobox } from '@template/ui';
	import { placed, projects, stages } from '../api/todos.query';

	type Stage = { name: string; group: string; fresh?: boolean };

	let {
		scope = {},
		value = $bindable(''),
		name,
		onchange
	}: {
		scope?: { source?: string; sourceID?: string };
		/** A stage label; empty for none. */
		value?: string;
		name?: string;
		onchange?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let query = $state('');
	// Grouped by project only when no project is in scope; fetched once the picker opens.
	const loose = $derived(!scope.sourceID);
	const labels = createQuery(() => ({ ...stages(scope), enabled: open }));
	const todos = createQuery(() => ({ ...placed(), enabled: open && loose }));
	const names = createQuery(() => ({ ...projects(), enabled: open && loose }));

	// Under each project that wears the label, so a shared one shows in every project it's in.
	const titles = $derived(Object.fromEntries((names.data?.data ?? []).map((one) => [one.id, one.name])));
	const homes = (stage: string) => {
		const found = (todos.data?.data ?? [])
			.filter((one) => one.stage === stage)
			.map((one) => (one.sourceID && titles[one.sourceID]) || 'No project')
			.filter((one, i, all) => all.indexOf(one) === i)
			.sort();
		return found.length ? found : ['Other'];
	};

	const items = $derived.by(() => {
		const known = (labels.data ?? []).map((one) => one.name);
		const typed = query.trim();
		const fresh = typed && !known.some((one) => one.toLowerCase() === typed.toLowerCase());
		const kept = value && !known.includes(value) && value !== typed;
		const rest = known
			.flatMap((one) => (loose ? homes(one) : ['']).map((group) => ({ name: one, group })))
			.sort((a, b) => a.group.localeCompare(b.group));
		const list: Stage[] = [
			...(fresh ? [{ name: typed, group: '', fresh: true }] : []),
			...(kept ? [{ name: value, group: '' }] : []),
			{ name: '', group: '' },
			...rest
		];
		return list.map((one) => ({ ...one, id: `${one.group}/${one.name}` }));
	});

	// A label can sit under several projects, so rows key on project and label both.
	const pick = (id: string) => {
		value = items.find((one) => one.id === id)?.name ?? '';
		onchange?.(value);
	};
</script>

{#if name}<input type="hidden" {name} {value} />{/if}

<Combobox
	{items}
	key={(one) => one.id}
	text={(one) => one.name || 'No stage'}
	group={(one) => one.group}
	value={items.find((one) => one.name === value)?.id ?? '/'}
	onchange={pick}
	bind:open
	bind:query
	label="Stage"
	placeholder="Search or create a stage"
>
	{#snippet trigger(one)}
		<span class={{ none: !one?.name }}>{one?.name || 'No stage'}</span>
	{/snippet}
	{#snippet item(one, row)}
		{#if one.fresh}
			<span class="add">Create</span> “{one.name}”
		{:else}
			<span class={['name', { none: !one.name }]}>{@render row.marked(one.name || 'No stage')}</span>
		{/if}
	{/snippet}
</Combobox>


<style>
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.none {
		color: var(--dim);
	}

	.add {
		color: var(--accent);
		font-weight: 500;
	}
</style>
