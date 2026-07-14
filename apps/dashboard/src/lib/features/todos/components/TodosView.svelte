<script lang='ts'>
	import type { Todo } from '@template/core/todo';
  import TodoList from './list/TodoList.svelte';
  import KanbanBoard from './kanban/KanbanBoard.svelte';
  import TodoTable from './table/TodoTable.svelte';

  type Props = {
    todos: Todo.Info[];
    view: 'list' | 'board' | 'table';
  };

  let { todos, view }: Props = $props();

  const views = {
    list: TodoList,
    board: KanbanBoard,
    table: TodoTable,
  }

  const SelectedView = $derived(views[view]);
</script>

{#if SelectedView}
  <SelectedView {todos} />
{/if}
