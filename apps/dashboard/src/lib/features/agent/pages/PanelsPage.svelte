<!-- The panels the assistant built and someone saved, newest first. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import {
		Button,
		Empty,
		IconButton,
		Input,
		Issue,
		Skeleton,
		Toggle,
		modal,
		toast
	} from '@template/ui';
	import Trash from '@lucide/svelte/icons/trash-2';
	import * as Header from '#lib/components/header/index.ts';
	import { message } from '#lib/query.ts';
	import { user } from '#lib/utils/context.ts';
	import { fmt } from '#lib/utils/fmt.ts';
	import { panels, remove } from '../api/panel.query';

	const me = user();
	const f = fmt();
	const list = createQuery(() => panels());
	const drop = remove();

	let search = $state('');
	let mine = $state(false);

	// The list arrives whole and stays small, so narrowing it is a client-side filter.
	const shown = $derived(
		(list.data ?? []).filter(
			(row) =>
				(!mine || row.createdBy === me.current?.id) &&
				`${row.title} ${row.author}`.toLowerCase().includes(search.trim().toLowerCase())
		)
	);

	async function erase(row: { id: string; title: string }) {
		const ok = await modal.confirm({
			title: `Delete "${row.title}"`,
			action: 'Delete',
			body: warning
		});
		if (!ok) return;
		await drop.mutateAsync(row.id).catch((err) => toast.error(message(err)));
	}
</script>

{#snippet warning()}The panel's spec is deleted; its data stays where it is.{/snippet}

<Header.Root title="Panels" lead="Saved from the assistant; each reruns its queries as the viewer.">
	{#snippet strip()}
		<Header.Group>
			<Input
				type="search"
				aria-label="Search panels"
				placeholder="Search title or author"
				bind:value={search}
			/>
		</Header.Group>
		<Header.Group label="Author">
			<Toggle bind:pressed={mine}>Only mine</Toggle>
		</Header.Group>
		{#if search || mine}
			<Header.Group end>
				<Button
					variant="ghost"
					onclick={() => {
						search = '';
						mine = false;
					}}
				>
					Clear filters
				</Button>
			</Header.Group>
		{/if}
	{/snippet}
</Header.Root>

{#if list.isPending}
	<Skeleton h="6em" />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if list.data.length === 0}
	<Empty>No saved panels yet. Ask the assistant to build one, then save it.</Empty>
{:else if shown.length === 0}
	<Empty>No panels match these filters.</Empty>
{:else}
	<ul>
		{#each shown as row (row.id)}
			<li>
				<a href="/settings/panels/{row.id}">{row.title}</a>
				<small>{row.author || 'Unknown'} · {f.stamp(row.timeUpdated)}</small>
				{#if row.createdBy === me.current?.id}
					<IconButton size="sm" label="Delete {row.title}" onclick={() => erase(row)}>
						<Trash size={14} strokeWidth={1.75} />
					</IconButton>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		list-style: none;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25em 0.75em;
		min-height: 2.75em;
		padding: 0.3em 0.5em 0.3em 0.8em;
		border-bottom: 1px solid var(--border);
	}

	li:last-child {
		border-bottom: 0;
	}

	a {
		color: var(--ink);
		font-weight: 500;
	}

	small {
		flex: 1;
		min-width: 12em;
		color: var(--muted);
	}
</style>
