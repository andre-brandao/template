<!-- The panels the assistant built and someone saved, newest first. -->
<script lang="ts">
	import { Button, Empty, Input, Toggle, modal, toast } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { user } from '$lib/utils/context';
	import { getPanels, removePanel } from '../api/panel.remote';
	import { failure } from '../failure';

	const me = user();
	const panels = $derived(await getPanels());
	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

	let search = $state('');
	let mine = $state(false);

	// The list arrives whole and stays small, so narrowing it is a client-side filter.
	const shown = $derived(
		panels.filter(
			(row) =>
				(!mine || row.createdBy === me.current?.id) &&
				`${row.title} ${row.author}`.toLowerCase().includes(search.trim().toLowerCase())
		)
	);

	async function remove(row: { id: string; title: string }) {
		const ok = await modal.confirm({ title: `Delete "${row.title}"`, action: 'Delete', body: warning });
		if (!ok) return;
		await removePanel(row.id).catch((err) => toast.error(failure(err)));
	}
</script>

{#snippet warning()}The panel's spec is deleted; its data stays where it is.{/snippet}

<Header.Root title="Panels" lead="Saved from the assistant; each reruns its queries as the viewer.">
	<Header.Item label="Saved">{panels.length}</Header.Item>
	{#snippet strip()}
		<Header.Group>
			<Input
				type="search"
				aria-label="Search panels"
				placeholder="Search title or author"
				value={search}
				oninput={(e) => (search = e.currentTarget.value)}
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

{#if panels.length === 0}
	<Empty>No saved panels yet. Ask the assistant to build one, then save it.</Empty>
{:else if shown.length === 0}
	<Empty>No panels match these filters.</Empty>
{:else}
	<ul>
		{#each shown as row (row.id)}
			<li>
				<a href="/admin/panels/{row.id}">{row.title}</a>
				<small>{row.author || 'Unknown'} · {when.format(new Date(row.timeUpdated))}</small>
				{#if row.createdBy === me.current?.id}
					<Button variant="ghost" onclick={() => remove(row)}>Delete</Button>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.75em;
		padding: 0.6em 0.8em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	a {
		color: var(--ink);
		font-weight: 500;
	}

	small {
		flex: 1;
		color: var(--muted);
	}
</style>
