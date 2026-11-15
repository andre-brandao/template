<!-- A planned date as quiet meta; clicking it opens a date picker that saves on pick. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { DatePicker, Status } from '@template/ui';
	import Calendar from '@lucide/svelte/icons/calendar';
	import { fmt } from '$lib/utils/fmt';
	import { update } from '../api/todos.query';
	import { late } from '../status';

	let { todo, field = 'dueDate' }: { todo: Todo.Info; field?: 'dueDate' | 'startDate' } = $props();

	const name = $derived(field === 'dueDate' ? 'Due' : 'Start');

	const f = fmt();
	const save = update();
	// The picked value stays up until the refetch lands; a failure falls back to the stored one.
	const shown = $derived(
		save.isPending && save.variables?.body?.[field] !== undefined
			? save.variables.body?.[field]
			: todo[field]
	);

	const set = (next: string | undefined) =>
		save.mutate({ path: { id: todo.id }, body: { [field]: next ?? null } });
</script>

<span class="due">
	<DatePicker
		bind:value={() => shown ?? undefined, set}
		label="{name} date"
		placeholder="{name} date"
		time
		clearable
	>
		{#snippet trigger(attrs, text)}
			<button
				class={[
					'when',
					{ late: field === 'dueDate' && late({ ...todo, dueDate: shown ?? null }, f.zone) }
				]}
				type="button"
				aria-label={shown ? `${name} ${text}` : `Set ${name.toLowerCase()} date`}
				disabled={save.isPending}
				{...attrs}
			>
				{#if shown}{text}{:else}<Calendar size={13} strokeWidth={1.75} />{/if}
			</button>
		{/snippet}
	</DatePicker>
	<Status of={save} />
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

	@media (prefers-reduced-motion: reduce) {
		.when {
			transition: none;
		}
	}
</style>
