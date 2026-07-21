<script lang="ts">
	import { Button } from '@template/ui';
	import { removeTodo } from '../../api/todos.remote';
	import type { Todo } from '@template/core/todo';
	import { org } from '$lib/features/org/context';
	import StateToggle from '../StateToggle.svelte';
	import TagList from '../TagList.svelte';

	let { todo }: { todo: Todo.Info } = $props();
	const ctx = org();
	const remove = $derived(removeTodo.for(todo.id));
</script>

<tr>
	<td><a class="title" href={ctx.path(`/todos/${todo.id}`)}>{todo.title}</a></td>
	<td><TagList tags={todo.tags} /></td>
	<td><StateToggle {todo} /></td>
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
