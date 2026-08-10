<script lang="ts">
	import { Button } from '@template/ui';
	import { removeTodo } from '../../api/todos.remote';
	import type { Todo } from '@template/core/todo';
	import StatusPicker from '../StatusPicker.svelte';
	import TagList from '../TagList.svelte';
	import { late } from '../../status';
	import { peek } from '$lib/utils/peek';
	import { fmt } from '$lib/utils/fmt';

	let { todo }: { todo: Todo.Info } = $props();

	const f = fmt();
	const remove = $derived(removeTodo.for(todo.id));
</script>

<tr>
	<td><a class="title" href="/todos/{todo.id}" onclick={peek({ selected: todo.id })}>{todo.title}</a></td>
	<td class="dim">{todo.stage ?? '—'}</td>
	<td class="dim">{todo.assignee?.name ?? 'Unassigned'}</td>
	<td class="dim" class:late={late(todo)}>{todo.dueDate ? f.date(todo.dueDate) : '—'}</td>
	<td><TagList tags={todo.tags} /></td>
	<td><StatusPicker {todo} compact /></td>
	<td class="actions">
		<form {...remove}>
			<input {...remove.fields.id.as('hidden', todo.id)} />
			<Button variant="ghost" type="submit" pending={!!remove.pending}>Delete</Button>
		</form>
	</td>
</tr>

<style>
	td {
		padding: 0.6em 0.9em;
		border-bottom: 1px solid var(--border);
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr:hover {
		background: color-mix(in srgb, var(--ink) 4%, transparent);
	}

	.dim {
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.8em;
		white-space: nowrap;
	}

	.dim.late {
		color: var(--danger);
	}

	.actions {
		display: flex;
		gap: 0.4em;
		justify-content: flex-end;
	}

	.title {
		color: var(--ink);
		text-decoration: none;
	}

	.title:hover {
		color: var(--accent);
	}
</style>
