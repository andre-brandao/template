<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Scroll } from '@template/ui';
	import Menu from '$lib/components/Menu.svelte';
	import { update } from '../api/todos.query';
	import { STATUSES, color, label } from '../status';

	let { todo, compact = false }: { todo: Todo.Info; compact?: boolean } = $props();

	// Optimistic: the pill (and a board card's column) moves before the request lands.
	const save = update();

	const items = $derived([
		...STATUSES.filter((status) => status !== 'done').map((status) => ({
			key: status,
			status,
			label: label(status),
			reason: ''
		})),
		{ key: 'done', status: 'done' as const, label: 'Done', reason: 'completed' },
		{ key: 'not_planned', status: 'done' as const, label: 'Done · not planned', reason: 'not_planned' }
	]);

	// One shared note: it gives `blocked` its why, and overrides the default done reason.
	let note = $state('');
</script>

<span class="picker">
	<Menu>
		{#snippet trigger(attrs)}
			<button class="current" class:compact type="button" style:--c={color(todo.status)} {...attrs}>
				<span class="dot"></span>
				{label(todo.status)}
				<span class="caret">▾</span>
			</button>
		{/snippet}
		{#snippet children(close)}
			<Scroll style="min-width: 14em; max-height: 280px">
				{#each items as item (item.key)}
					<button
						class="item"
						type="button"
						role="menuitem"
						disabled={item.status === todo.status && !item.reason}
						onclick={() => {
							close();
							save.mutate({
								path: { id: todo.id },
								body: { status: item.status, reason: (note || item.reason).trim() || null }
							});
						}}
					>
						<span class="dot" style:--c={color(item.status)}></span>
						{item.label}
					</button>
				{/each}
				<label class="note">
					<span>Reason</span>
					<input
						type="text"
						name="reason"
						autocomplete="off"
						bind:value={note}
						placeholder="waiting on design…"
					/>
				</label>
			</Scroll>
		{/snippet}
	</Menu>
</span>

<style>
	.picker {
		display: inline-flex;
	}

	.current {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--c) 12%, transparent);
		color: var(--c);
		font: inherit;
		font-size: 0.86em;
		padding: 0.35em 0.7em;
		cursor: pointer;
	}

	.current.compact {
		font-size: 0.7em;
		padding: 0.25em 0.5em;
	}

	.current:hover {
		background: color-mix(in srgb, var(--c) 20%, transparent);
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--c);
	}

	.caret {
		opacity: 0.7;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: 100%;
		border: none;
		background: none;
		padding: 0.55em 0.8em;
		font: inherit;
		font-size: 0.85em;
		text-align: left;
		color: var(--ink);
		cursor: pointer;
	}

	.item:hover:not(:disabled) {
		background: var(--surface-2);
	}

	.item:disabled {
		cursor: default;
		opacity: 0.45;
	}

	.note {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		padding: 0.6em 0.8em;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}

	.note span {
		font-size: 0.86em;
		color: var(--muted);
	}

	.note input {
		font: inherit;
		font-size: 0.85em;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--surface);
		color: var(--ink);
		padding: 0.3em 0.45em;
	}

	.note input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
