<!-- The list chrome matches Stages': the rows differ, and each card staying
     self-contained beats extracting presentation coincidence. -->
<!-- fallow-ignore-file code-duplication -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty, Issue, Skeleton } from '@template/ui';
	import { list } from '../api/todos.query';
	import StatusPill from './StatusPill.svelte';
	import { late } from '../status';
	import { fmt } from '$lib/utils/fmt';

	// No scope lists every todo, for the home.
	let { scope = {} }: { scope?: { source?: string; sourceID?: string } } = $props();

	const f = fmt();
	const todos = createQuery(() => list(scope));
</script>

{#if todos.isPending}
	<Skeleton h="128px" />
{:else if todos.isError}
	<Issue>{todos.error.message}</Issue>
{:else if todos.data.data.length === 0}
	<Empty>Nothing here yet.</Empty>
{:else}
	<ul>
		{#each todos.data.data.slice(0, 8) as todo (todo.id)}
			<li>
				<a href="/todos/{todo.id}">{todo.title}</a>
				<span class="meta">
					<span class={['when', { late: late(todo, f.zone) }]}>
						{todo.dueDate ? f.date(todo.dueDate) : '—'}
					</span>
					<StatusPill status={todo.status} />
				</span>
			</li>
		{/each}
	</ul>
{/if}

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
</style>
