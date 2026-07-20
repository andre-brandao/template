<script lang="ts">
	import { getDue } from '../../api/insights.remote';
	import StatePill from '../StatePill.svelte';
	import Section from './Section.svelte';

	const todos = $derived(await getDue());

	function date(todo: Awaited<ReturnType<typeof getDue>>[number]) {
		return todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'No due date';
	}
</script>

<Section title="Next due">
	{#if todos.length === 0}
		<p class="empty">No upcoming due todos.</p>
	{:else}
		<ul>
			{#each todos as todo (todo.id)}
				<li>
					<a href="/todos/{todo.id}">{todo.title}</a>
					<span>{date(todo)}</span>
					<StatePill state={todo.state} />
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

	.empty {
		margin: 0;
		color: var(--muted);
	}

	@media (max-width: 640px) {
		li {
			grid-template-columns: 1fr;
			align-items: start;
		}
	}
</style>
