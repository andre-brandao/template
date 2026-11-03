<!-- The panels the assistant built and someone saved, newest first. -->
<script lang="ts">
	import { Button, Empty, modal, toast } from '@template/ui';
	import Header from '$lib/components/Header.svelte';
	import { user } from '$lib/utils/context';
	import { getPanels, removePanel } from '../api/panel.remote';
	import { failure } from '../failure';

	const me = user();
	const panels = $derived(await getPanels());
	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

	async function remove(row: { id: string; title: string }) {
		const ok = await modal.confirm({ title: `Delete "${row.title}"`, action: 'Delete', body: warning });
		if (!ok) return;
		await removePanel(row.id).catch((err) =>
			toast.error(failure(err))
		);
	}
</script>

{#snippet warning()}The panel's spec is deleted; its data stays where it is.{/snippet}

<Header title="Panels">
	Built by the assistant from read-only SQL and saved from the chat. Each one reruns its
	queries as whoever opens it.
</Header>

{#if panels.length === 0}
	<Empty>No saved panels yet. Ask the assistant to build one, then save it.</Empty>
{:else}
	<ul>
		{#each panels as row (row.id)}
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
