<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Spinner } from '@template/ui';
	import Menu from '$lib/components/Menu.svelte';
	import { setStatus } from '../api/todos.remote';
	import { STATUSES, color, label } from '../status';

	let { todo, compact = false }: { todo: Todo.Info; compact?: boolean } = $props();

	// Every item posts its own form, so each needs its own binding key.
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
			<div class="list">
				{#each items as item (item.key)}
					{@const form = setStatus.for(`${todo.id}:${item.key}`)}
					<!-- Closing on click would detach the form before the browser submits it
					     ("form is not connected"); enhance runs after the data is captured,
					     so the menu can close while the request proceeds. -->
					<form
						{...form.enhance(async (f) => {
							close();
							await f.submit();
						})}
					>
						<input {...form.fields.id.as('hidden', todo.id)} />
						<input {...form.fields.status.as('hidden', item.status)} />
						<input {...form.fields.reason.as('hidden', note || item.reason)} />
						<button
							class="item"
							type="submit"
							role="menuitem"
							disabled={!!form.pending || (item.status === todo.status && !item.reason)}
						>
							<span class="dot" style:--c={color(item.status)}></span>
							{item.label}
							{#if form.pending}<Spinner />{/if}
						</button>
					</form>
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
			</div>
		{/snippet}
	</Menu>
</span>

<style>
	.picker {
		display: inline-flex;
	}

	.list form {
		display: contents;
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
		font-family: var(--font-mono);
		font-size: 0.78em;
		text-transform: uppercase;
		letter-spacing: 0.03em;
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

	.list {
		min-width: 14em;
		max-height: 280px;
		overflow-y: auto;
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
		font-family: var(--font-mono);
		font-size: 0.68em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
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
