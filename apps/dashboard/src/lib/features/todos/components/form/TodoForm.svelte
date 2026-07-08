<script lang="ts">
	import { Button } from '@template/ui';
	import { createTodo, getStatuses } from '../../api/todos.remote';
</script>

{#each createTodo.fields.allIssues() ?? [] as issue}
	<p class="error">{issue.message}</p>
{/each}

<form class="add" {...createTodo}>
	<input placeholder="What needs doing?" {...createTodo.fields.title.as('text')} />
	<input class="status" placeholder="Status" list="statuses" {...createTodo.fields.status.as('text')} />
	<datalist id="statuses">
		{#each await getStatuses() as status (status)}
			<option value={status}></option>
		{/each}
	</datalist>
	<Button type="submit" pending={!!createTodo.pending}>Add</Button>
</form>

<style>
	.add {
		display: flex;
		gap: 0.6em;
		margin-bottom: 1.25em;
	}

	input {
		flex: 1;
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	.status {
		flex: 0 1 11em;
	}

	input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
