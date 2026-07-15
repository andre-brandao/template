<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { getStatuses, setStatus } from '../api/todos.remote';
	import { color, label } from '../status';

	let { todo }: { todo: Todo.Info } = $props();
	const set = $derived(setStatus.for(todo.id));
	const statuses = $derived(await getStatuses());
</script>

<form {...set}>
	<input {...set.fields.id.as('hidden', todo.id)} />
	<select
		{...set.fields.status.as('select', todo.status)}
		style:--c={color(todo.status)}
		aria-label="Status"
		disabled={!!set.pending}
		onchange={(e) => e.currentTarget.form?.requestSubmit()}
	>
		{#each statuses as status (status)}
			<option value={status}>{label(status)}</option>
		{/each}
	</select>
</form>

<style>
	select {
		font-family: var(--font-mono);
		font-size: 0.78em;
		letter-spacing: 0.03em;
		padding: 0.3em 0.6em;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
		background: color-mix(in srgb, var(--c) 12%, transparent);
		color: var(--c);
		cursor: pointer;
		transition: color 0.3s ease, background 0.3s ease, border-color 0.3s ease;
	}

	select:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	select:focus-visible {
		border-color: var(--c);
		outline: none;
	}

	option {
		background: var(--surface);
		color: var(--ink);
	}
</style>
