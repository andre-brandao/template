<!-- The user's past conversations with the agent, newest first; a row reopens it. -->
<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import { Button, Empty, IconButton, Issue, Skeleton, Spinner, modal, toast } from '@template/ui';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { message } from '#lib/query.ts';
	import { fmt } from '#lib/utils/fmt.ts';
	import { conversations, remove } from '../api/agent.query';
	import { agent } from '../agent.svelte';

	const ctx = agent();
	const f = fmt();
	const list = createInfiniteQuery(() => conversations());
	const rows = $derived(list.data?.pages.flatMap((page) => page.data) ?? []);
	const drop = remove();

	// The row being reopened; a second click waits for it.
	let opening = $state<string>();

	function open(id: string) {
		if (opening) return;
		opening = id;
		ctx
			.resume(id)
			.catch((err) => toast.error(message(err)))
			.finally(() => (opening = undefined));
	}

	async function erase(row: { id: string; thread: string }) {
		const ok = await modal.confirm({
			title: 'Delete conversation',
			action: 'Delete',
			body: warning
		});
		if (!ok) return;
		await drop
			.mutateAsync(row.id)
			// The open chat would keep writing to a thread that no longer lists.
			.then(() => row.thread === ctx.thread && ctx.fresh())
			.catch((err) => toast.error(message(err)));
	}
</script>

{#snippet warning()}It leaves your history and cannot be resumed.{/snippet}

<div class="history">
	{#if list.isPending}
		<Skeleton h="4em" />
	{:else if list.isError}
		<Issue>{list.error.message}</Issue>
	{:else if !rows.length}
		<Empty>No conversations yet.</Empty>
	{:else}
		<ul>
			{#each rows as row (row.id)}
				<li class:current={row.thread === ctx.thread} aria-busy={opening === row.id}>
					<button type="button" class="open" onclick={() => open(row.id)}>
						<span class="title">{row.title ?? 'Untitled'}</span>
						<small>{f.stamp(row.timeUpdated)}</small>
					</button>
					{#if opening === row.id}
						<Spinner />
					{:else}
						<span class="remove">
							<IconButton size="sm" label="Delete conversation" onclick={() => erase(row)}>
								<Trash size={14} strokeWidth={1.75} />
							</IconButton>
						</span>
					{/if}
				</li>
			{/each}
		</ul>
		{#if list.hasNextPage}
			<Button
				variant="ghost"
				pending={list.isFetchingNextPage}
				onclick={() => list.fetchNextPage()}
			>
				Load more
			</Button>
		{/if}
	{/if}
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
		padding-right: 0.25em;
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
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.open:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
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

	/* Shown on hover or focus, so the list stays quiet and the keyboard still reaches it. */
	.remove {
		opacity: 0;
	}

	li:hover .remove,
	li:focus-within .remove {
		opacity: 1;
	}

	@media (hover: none) {
		.remove {
			opacity: 1;
		}
	}
</style>
