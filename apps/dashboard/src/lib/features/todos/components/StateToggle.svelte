<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Button } from '@template/ui';
	import { closeTodo, reopenTodo } from '../api/todos.remote';

	let { todo }: { todo: Todo.Info } = $props();
	// Two forms can't share one binding instance, so completed/not-planned each get their own key.
	const close = $derived(closeTodo.for(`${todo.id}:completed`));
	const closeNotPlanned = $derived(closeTodo.for(`${todo.id}:not_planned`));
	const reopen = $derived(reopenTodo.for(todo.id));
</script>

<span class="toggle">
	{#if todo.state === 'open'}
		<form {...close}>
			<input {...close.fields.id.as('hidden', todo.id)} />
			<input {...close.fields.reason.as('hidden', 'completed')} />
			<Button variant="primary" type="submit" pending={!!close.pending}>Close as completed</Button>
		</form>
		<form {...closeNotPlanned}>
			<input {...closeNotPlanned.fields.id.as('hidden', todo.id)} />
			<input {...closeNotPlanned.fields.reason.as('hidden', 'not_planned')} />
			<Button variant="ghost" type="submit" pending={!!closeNotPlanned.pending}>Close as not planned</Button>
		</form>
	{:else}
		<form {...reopen}>
			<input {...reopen.fields.id.as('hidden', todo.id)} />
			<Button variant="secondary" type="submit" pending={!!reopen.pending}>Reopen</Button>
		</form>
	{/if}
</span>

<style>
	.toggle {
		display: inline-flex;
		gap: 0.4em;
		flex-wrap: wrap;
	}
</style>
