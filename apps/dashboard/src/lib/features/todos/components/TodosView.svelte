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

{#if view === 'board'}
	<KanbanBoard {todos} {by} />
{:else if view === 'timeline'}
	<TimelineView {todos} by={by === 'status' ? 'stage' : by} />
{:else if view === 'table'}
	<TodoTable {todos} />
{:else}
	<TodoList {todos} />
{/if}
