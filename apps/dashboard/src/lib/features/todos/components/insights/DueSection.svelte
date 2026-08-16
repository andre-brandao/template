<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { Empty } from '@template/ui';
	import { getDue } from '../../api/insights.remote';
	import StatusPill from '../StatusPill.svelte';
	import Section from './Section.svelte';
	import { fmt } from '$lib/utils/fmt';

	let { scope = {} }: { scope?: Insights.Scope } = $props();

	const f = fmt();
	const todos = $derived(await getDue(scope));

	function date(todo: Awaited<ReturnType<typeof getDue>>[number]) {
		return todo.dueDate ? f.date(todo.dueDate) : 'No due date';
	}
</script>

<Section title="Next due">
	{#if todos.length === 0}
		<Empty>No upcoming due todos.</Empty>
	{:else}
		<ul>
			{#each todos as todo (todo.id)}
				<li>
					<a href="/todos/{todo.id}">{todo.title}</a>
					<span>{date(todo)}</span>
					<StatusPill status={todo.status} />
				</li>
			{/each}
		</ul>
	{/if}
</Section>

<style>
	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.7em;
		padding: 0;
		margin: 0;
	}

	li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 0.75em;
		padding: 0.75em 0;
		border-top: 1px solid var(--border);
	}

	li:first-child {
		border-top: 0;
		padding-top: 0;
	}

	a {
		color: var(--text);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	span {
		color: var(--muted);
		font-size: 0.9em;
	}

	@media (max-width: 640px) {
		li {
			grid-template-columns: 1fr;
			align-items: start;
		}
	}
</style>
