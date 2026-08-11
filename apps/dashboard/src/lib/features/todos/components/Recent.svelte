<script lang="ts">
	import { getTodos } from '../api/todos.remote';
	import StatusPill from './StatusPill.svelte';
	import Skeleton from './insights/Skeleton.svelte';
	import { late } from '../status';
	import { fmt } from '$lib/utils/fmt';

	let { scope }: { scope: { source: string; sourceID: string } } = $props();

	const f = fmt();
</script>

<svelte:boundary>
	{#snippet pending()}<Skeleton height="128px" />{/snippet}
	{@const todos = await getTodos(scope)}
	{#if todos.length === 0}
		<p class="empty">Nothing here yet.</p>
	{:else}
		<ul>
			{#each todos.slice(0, 8) as todo (todo.id)}
				<li>
					<a href="/todos/{todo.id}">{todo.title}</a>
					<span class="meta">
						<span class="when" class:late={late(todo)}>
							{todo.dueDate ? f.date(todo.dueDate) : '—'}
						</span>
						<StatusPill status={todo.status} />
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</svelte:boundary>

<style>
	/* Shared list chrome with Stages.svelte — the row layouts differ, and keeping
	   each card self-contained is worth the duplicated base rules. */
	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.1em;
		padding: 0;
		margin: 0;
	}

	/* Two lines, because this list sits in the short column. */
	li {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		padding: 0.6em 0;
		border-top: 1px solid var(--border);
	}

	li:first-child {
		border-top: 0;
	}

	a {
		color: var(--ink);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	a:hover {
		color: var(--accent);
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.6em;
	}

	.when {
		font-family: var(--font-mono);
		font-size: 0.72em;
		color: var(--dim);
		white-space: nowrap;
	}

	.when.late {
		color: var(--danger);
	}

	.empty {
		color: var(--dim);
		font-size: 0.9em;
		margin: 0;
	}
</style>
