<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Menu, Status } from '@template/ui';
	import { update } from '../api/todos.query';
	import { STATUSES, color, label } from '../status';
	import Pick from './Pick.svelte';

	// `compact` drops the label: a board card or row shows the dot alone.
	let { todo, compact = false }: { todo: Todo.Info; compact?: boolean } = $props();

	const save = update();
	// The picked status stays up until the refetch lands; a failure falls back to the stored one.
	const shown = $derived((save.isPending && save.variables?.body.status) || todo.status);
	const mark = $derived(
		save.isPending ? 'pending' : save.isError ? 'failed' : save.isSuccess ? 'saved' : 'idle'
	);

	// One letter each while the menu is open; blocked takes X, since B is backlog.
	const letters = {
		backlog: 'B',
		planned: 'P',
		active: 'A',
		blocked: 'X',
		done: 'D'
	} as const satisfies Record<Todo.Status, string>;
	const items = [
		...STATUSES.filter((status) => status !== 'done').map((status) => ({
			key: status,
			status,
			label: label(status),
			letter: letters[status],
			reason: ''
		})),
		{ key: 'done', status: 'done' as const, label: 'Done', letter: 'D' as const, reason: 'completed' },
		{
			key: 'not_planned',
			status: 'done' as const,
			label: 'Not planned',
			letter: 'N' as const,
			reason: 'not_planned'
		}
	];

	// One shared note: it gives `blocked` its why, and overrides the default done reason.
	let note = $state('');

	function pick(item: (typeof items)[number]) {
		save.mutate({
			path: { id: todo.id },
			body: { status: item.status, reason: (note || item.reason).trim() || null }
		});
		note = '';
	}
</script>

<span class="picker">
	<Pick
		label="Set status"
		text={label(shown)}
		color={color(shown)}
		{compact}
		disabled={save.isPending}
	>
		{#each items as item (item.key)}
			<Menu.Item
				shortcut={item.letter}
				disabled={item.status === todo.status && !item.reason}
				onselect={() => pick(item)}
			>
				<span class="dot" style:--c={color(item.status)}></span>
				{item.label}
			</Menu.Item>
		{/each}
		<Menu.Separator />
		<label class="note">
			<span>Reason</span>
			<!-- Kept from the menu's arrows and type-ahead, which would pull focus off it. -->
			<input
				type="text"
				name="reason"
				autocomplete="off"
				bind:value={note}
				placeholder="waiting on design…"
				onkeydown={(e) => e.key !== 'Escape' && e.key !== 'Tab' && e.stopPropagation()}
			/>
		</label>
	</Pick>
	<Status state={mark} message={save.error?.message} />
</span>

<style>
	.picker {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
	}

	.dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-inline-end: 0.5em;
		border-radius: 50%;
		background: var(--c);
	}

	.note {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		padding: 0.4em 0.55em 0.3em;
	}

	.note span {
		font-size: 0.8em;
		color: var(--muted);
	}

	.note input {
		font: inherit;
		font-size: 0.85em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		padding: 0.3em 0.45em;
	}

	.note input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
