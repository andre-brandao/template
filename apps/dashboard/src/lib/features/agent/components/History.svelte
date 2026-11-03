<!-- The user's past conversations with the agent, newest first; a row reopens it. -->
<script lang="ts">
	import { Button, Empty, Skeleton, modal, toast } from '@template/ui';
	import { SvelteSet } from 'svelte/reactivity';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { getConversations, removeConversation } from '../api/agent.remote';
	import { agent } from '../agent.svelte';
	import { failure } from '../failure';

	const ctx = agent();

	let pages = $state(1);
	// Pages past the first don't refresh after a removal, so the gone rows hide here.
	const gone = new SvelteSet<string>();

	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

	function open(id: string) {
		ctx.resume(id).catch((err) => toast.error(failure(err)));
	}

	async function remove(row: { id: string; thread: string }) {
		const ok = await modal.confirm({
			title: 'Delete conversation',
			action: 'Delete',
			body: warning
		});
		if (!ok) return;
		await removeConversation(row.id)
			.then(() => {
				gone.add(row.id);
				// The open chat would keep writing to a thread that no longer lists.
				if (row.thread === ctx.thread) ctx.fresh();
			})
			.catch((err) => toast.error(failure(err)));
	}
</script>

{#snippet warning()}It leaves your history and cannot be resumed.{/snippet}

<div class="history">
	<!-- Mounted only while shown, so each visit fetches the list anew. -->
	<svelte:boundary>
		{@const batches = await Promise.all(
			Array.from({ length: pages }, (_, i) => getConversations(i ? i + 1 : undefined))
		)}
		{@const rows = batches.flatMap((batch) => batch.data).filter((row) => !gone.has(row.id))}
		{#if !rows.length}
			<Empty>No conversations yet.</Empty>
		{:else}
			<ul>
				{#each rows as row (row.id)}
					<li class:current={row.thread === ctx.thread}>
						<button type="button" class="open" onclick={() => open(row.id)}>
							<span class="title">{row.title ?? 'Untitled'}</span>
							<small>{when.format(new Date(row.timeUpdated))}</small>
						</button>
						<button
							type="button"
							class="remove"
							aria-label="Delete conversation"
							onclick={() => remove(row)}
						>
							<Trash size={14} strokeWidth={1.75} />
						</button>
					</li>
				{/each}
			</ul>
			{#if batches.at(-1)?.more}
				<Button variant="ghost" onclick={() => pages++}>Load more</Button>
			{/if}
		{/if}
		{#snippet pending()}
			<Skeleton h="4em" />
		{/snippet}
		{#snippet failed(err)}
			<Empty>{failure(err)}</Empty>
		{/snippet}
	</svelte:boundary>
</div>

<style>
	.history {
		display: grid;
		gap: 0.5em;
		padding: 0.75em;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		border-radius: var(--radius-sm);
	}

	li:hover {
		background: var(--hover);
	}

	li.current {
		background: var(--selected);
	}

	.open {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.1em;
		min-width: 0;
		padding: 0.5em 0.6em;
		border: none;
		background: none;
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.88em;
	}

	small {
		color: var(--muted);
		font-size: 0.75em;
	}

	.remove {
		padding: 0.4em;
		border: none;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.remove:hover {
		color: var(--danger);
	}
</style>
