<!-- A planned date as quiet meta; clicking it opens a date field that saves on pick. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Popover, Status } from '@template/ui';
	import Calendar from '@lucide/svelte/icons/calendar';
	import { fmt } from '$lib/utils/fmt';
	import { update } from '../api/todos.query';
	import { late } from '../status';

	let {
		todo,
		field = "dueDate"
	}: { todo: Todo.Info; field?: "dueDate" | "startDate" } = $props();

	const name = $derived(field === "dueDate" ? "Due" : "Start");

	const f = fmt();
	const save = update();
	// The picked day stays up until the refetch lands; a failure falls back to the stored one.
	const shown = $derived(
		save.isPending && save.variables?.body[field] !== undefined
			? save.variables.body[field]
			: todo[field]
	);
	const mark = $derived(
		save.isPending ? 'pending' : save.isError ? 'failed' : save.isSuccess ? 'saved' : 'idle'
	);

	function set(day: string, close: () => void) {
		close();
		save.mutate({
			path: { id: todo.id },
			body: { [field]: day ? new Date(day).toISOString() : null }
		});
	}
</script>

<span class="due">
	<Popover label="{name} date" align="end">
		{#snippet trigger(attrs)}
			<button
				class={["when", { late: field === "dueDate" && late({ ...todo, dueDate: shown }) }]}
				type="button"
				aria-label={shown ? `${name} ${f.date(shown)}` : `Set ${name.toLowerCase()} date`}
				disabled={save.isPending}
				{...attrs}
			>
				{#if shown}{f.date(shown)}{:else}<Calendar size={13} strokeWidth={1.75} />{/if}
			</button>
		{/snippet}
		{#snippet children(close)}
			<div class="pick">
				<input
					type="date"
					aria-label="{name} date"
					value={shown?.slice(0, 10) ?? ''}
					onchange={(e) => set(e.currentTarget.value, close)}
				/>
				{#if shown}
					<button class="clear" type="button" onclick={() => set('', close)}>Clear</button>
				{/if}
			</div>
		{/snippet}
	</Popover>
	<Status state={mark} message={save.error?.message} />
</span>

<style>
	.due {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}

	.when {
		display: inline-flex;
		align-items: center;
		min-height: 1.6em;
		padding: 0 0.35em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--dim);
		font: inherit;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		cursor: pointer;
		transition: background 140ms ease;
	}

	.when:hover,
	.when[aria-expanded='true'] {
		background: var(--hover);
		color: var(--ink);
	}

	.when.late {
		color: var(--danger);
	}

	.when:disabled {
		cursor: default;
	}

	.pick {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.6em;
	}

	.pick input {
		font: inherit;
		font-size: 0.85em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		padding: 0.3em 0.45em;
	}

	.clear {
		border: none;
		background: none;
		color: var(--muted);
		font: inherit;
		font-size: 0.82em;
		cursor: pointer;
	}

	.clear:hover {
		color: var(--ink);
	}

	@media (prefers-reduced-motion: reduce) {
		.when {
			transition: none;
		}
	}
</style>
