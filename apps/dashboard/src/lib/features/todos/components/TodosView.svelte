<script lang='ts'>
	import type { Todo } from '@template/core/todo';
  import TodoCard from './card/TodoCard.svelte';
  import KanbanBoard from './kanban/KanbanBoard.svelte';
  import TodoTable from './table/TodoTable.svelte';

  type Props = {
    todos: Todo.Info[];
    view: 'list' | 'board' | 'table';
  };

  let { todos, view }: Props = $props();
</script>


{#if view === 'list'}
	<div class="list">
		{#each todos as todo (todo.id)}
			<TodoCard {todo} />
		{/each}
		{#if todos.length === 0}
			<p class="empty">No tasks match this filter</p>
		{/if}
	</div>
{:else if view === 'board'}
	<KanbanBoard {todos} />
{:else}
	<TodoTable {todos} />
{/if}
