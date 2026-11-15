<!-- Todos with no dates yet; drag one onto a day to schedule it. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Skeleton } from '@template/ui';
	import Chip from './Chip.svelte';
	import type { Chips } from './CalendarView.svelte';

	let {
		todos,
		total = 0,
		loading = false,
		chips
	}: { todos: Todo.Info[]; total?: number; loading?: boolean; chips: Chips } = $props();
</script>

<aside class="tray" aria-label="Unscheduled todos">
	<header>
		<span>Unscheduled</span>
		<span class="count">{total}</span>
	</header>
	{#if loading}
		<Skeleton h="1.45em" />
		<Skeleton h="1.45em" />
	{:else if todos.length === 0}
		<p class="none">Nothing unscheduled.</p>
	{:else}
		<ul>
			{#each todos as todo (todo.id)}
				<li>
					<Chip {todo} link {...chips.mark(todo.id)} grab={chips.grab} open={chips.open} />
				</li>
			{/each}
		</ul>
		{#if total > todos.length}<p class="none">{todos.length} of {total} shown</p>{/if}
	{/if}
</aside>

<style>
	.tray {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
		padding: 0.55rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	header {
		display: flex;
		justify-content: space-between;
		color: var(--muted);
		font-size: 0.78rem;
		font-weight: 500;
	}

	.count {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	ul {
		display: grid;
		gap: 3px;
		margin: 0;
		padding: 0;
		max-height: 32rem;
		overflow-y: auto;
		scrollbar-width: thin;
		list-style: none;
	}

	.none {
		margin: 0;
		color: var(--dim);
		font-size: 0.75rem;
	}
</style>
