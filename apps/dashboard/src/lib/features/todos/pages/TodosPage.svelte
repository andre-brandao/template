<script lang="ts">
  import { z } from 'zod'
  import { query } from '$lib/params'
  import { getTodos } from '../api/todos.remote'
  import TodoForm from '../components/form/TodoForm.svelte'
  import TodoFilters from '../components/TodoFilters.svelte'
  import ViewSelector from '../components/ViewSelector.svelte'
  import TodosView from '../components/TodosView.svelte'

  const params = query(
    z.object({
      q: z.string().default(''),
      status: z.string().array().default([]),
      view: z.enum(['list', 'board', 'table']).default('list'),
    }),
  )

  const todos = $derived(
    await getTodos({
      status: params.status.length ? params.status : undefined,
      q: params.q || undefined,
    }),
  )
</script>

<h1>Todos</h1>

<div class="toolbar">
  <TodoFilters
    filters={{ statuses: params.status, search: params.q }}
    onchange={(next) =>
      params.update({ status: next.statuses, q: next.search })}
  />
  <span class="sep"></span>
  <ViewSelector
    view={params.view}
    onchange={(view) => params.update({ view })}
  />
</div>

<TodoForm />

<TodosView {todos} view={params.view} />

<style>
  h1 {
    margin: 0 0 0.75em;
    font-size: 1.4em;
  }

  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75em;
    margin-bottom: 1.25em;
  }

  .sep {
    width: 1px;
    align-self: stretch;
    background: var(--border);
    margin-left: auto;
  }
</style>
