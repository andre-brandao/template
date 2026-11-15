<!-- The directory as a searchable picker: you first, then nobody, then everyone else. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Avatar, Combobox } from '@template/ui';
	import UserRound from '@lucide/svelte/icons/user-round';
	import { user } from '$lib/utils/context';
	import { users } from '../api/todos.query';

	type Person = { id: string; name: string; email: string; image: string | null };

	let {
		value = $bindable(''),
		name,
		selected,
		empty = 'Unassigned',
		onchange
	}: {
		/** A user id; empty for nobody. */
		value?: string;
		name?: string;
		/** The already-loaded current assignee, so SSR can label it without the directory. */
		selected?: Person | null;
		empty?: string;
		onchange?: (value: string) => void;
	} = $props();

	const me = user();
	let open = $state(false);
	// Only an open picker needs the whole directory.
	const people = createQuery(() => ({ ...users(), enabled: open }));

	const nobody: Person = $derived({ id: '', name: empty, email: '', image: null });
	const items = $derived.by(() => {
		const self = me.current;
		const rest = (people.data ?? (selected ? [selected] : [])).filter((one) => one.id !== self?.id);
		return [...(self ? [self] : []), nobody, ...rest];
	});
</script>

{#snippet face(one: Person)}
	{#if one.id}
		<Avatar name={one.name} image={one.image} size={18} />
	{:else}
		<span class="none"><UserRound size={14} strokeWidth={1.75} /></span>
	{/if}
{/snippet}

<Combobox
	{items}
	key={(one) => one.id}
	text={(one) => (one.id === me.current?.id ? `${one.name} ${one.email} me` : `${one.name} ${one.email}`)}
	bind:value
	bind:open
	{name}
	{onchange}
	label="Assignee"
	placeholder="Search people"
>
	{#snippet trigger(one)}
		{@render face(one ?? nobody)}
		<span class="name">{one?.name ?? empty}</span>
	{/snippet}
	{#snippet item(one, row)}
		{@render face(one)}
		<span class="name">{@render row.marked(one.name)}</span>
		{#if one.id === me.current?.id}<span class="me">Me</span>{/if}
		{#if one.email}<span class="email">{@render row.marked(one.email)}</span>{/if}
	{/snippet}
</Combobox>

<style>
	.none {
		display: inline-grid;
		flex: none;
		place-items: center;
		width: 18px;
		height: 18px;
		color: var(--dim);
	}

	/* The name keeps its room; a long email gives way first. */
	.name {
		flex: none;
		max-width: 60%;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.me {
		flex: none;
		padding: 0 0.4em;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--muted);
		font-size: 0.8em;
	}

	.email {
		margin-inline-start: auto;
		padding-inline-start: 0.6em;
		overflow: hidden;
		color: var(--dim);
		font-size: 0.85em;
		text-overflow: ellipsis;
	}
</style>
