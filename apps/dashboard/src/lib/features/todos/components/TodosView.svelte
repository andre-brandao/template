<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import type { By } from '../group';
	import type { View } from './ViewSelector.svelte';
	import TodoList from './list/TodoList.svelte';
	import KanbanBoard from './kanban/KanbanBoard.svelte';
	import TodoTable from './table/TodoTable.svelte';
	import TimelineView from './timeline/TimelineView.svelte';

	let { todos, view, by = 'status' }: { todos: Todo.Info[]; view: View; by?: By } = $props();
</script>

<!-- Wrapped so the swap has one element to name. `sort` and `q` are deliberately unclaimed:
     a sort click and a search keystroke should land instantly. -->
<div class="view">
	{#if view === 'board'}
		<KanbanBoard {todos} {by} />
	{:else if view === 'timeline'}
		<TimelineView {todos} by={by === 'status' ? 'stage' : by} />
	{:else if view === 'table'}
		<TodoTable {todos} />
	{:else}
		<TodoList {todos} />
	{/if}
</div>

<style>
	/* Named only while the swap it owns is running: an unconditional name would make this
	   its own group on every navigation, including ones where it exists on one side only. */
	:global(html[data-swap~='view']) .view {
		view-transition-name: todos;
	}

	:global(::view-transition-old(todos)),
	:global(::view-transition-new(todos)) {
		animation-duration: 200ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
		animation-fill-mode: both;
		mix-blend-mode: normal;
	}

	:global(::view-transition-old(todos)) {
		animation-name: out;
	}

	/* The three screens that own a same-page swap share this animation. It can't be lifted
	   without one global view-transition-name for all of them, and the marker has to sit on
	   the line the clone starts on. */
	/* fallow-ignore-next-line code-duplication */
	:global(::view-transition-new(todos)) {
		animation-name: in;
	}

	@keyframes out {
		to {
			opacity: 0;
			transform: translateY(-4px);
		}
	}

	@keyframes in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-old(todos)),
		:global(::view-transition-new(todos)) {
			animation: none;
		}
	}
</style>
