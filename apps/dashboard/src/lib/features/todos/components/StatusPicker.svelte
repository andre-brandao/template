<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Popover, Status } from '@template/ui';
	import { update } from '../api/todos.query';
	import { STATUSES, color, label } from '../status';

	// `compact` drops the label: a board card or row shows the dot alone.
	let { todo, compact = false }: { todo: Todo.Info; compact?: boolean } = $props();

	const save = update();
	// The picked status stays up until the refetch lands; a failure falls back to the stored one.
	const shown = $derived((save.isPending && save.variables?.body.status) || todo.status);
	const mark = $derived(
		save.isPending ? 'pending' : save.isError ? 'failed' : save.isSuccess ? 'saved' : 'idle'
	);

	const items = [
		...STATUSES.filter((status) => status !== 'done').map((status) => ({
			key: status,
			status,
			label: label(status),
			reason: ''
		})),
		{ key: 'done', status: 'done' as const, label: 'Done', reason: 'completed' },
		{ key: 'not_planned', status: 'done' as const, label: 'Not planned', reason: 'not_planned' }
	];

	// One shared note: it gives `blocked` its why, and overrides the default done reason.
	let note = $state('');

	function pick(item: (typeof items)[number], close: () => void) {
		close();
		save.mutate({
			path: { id: todo.id },
			body: { status: item.status, reason: (note || item.reason).trim() || null }
		});
		note = '';
	}
</script>

<span class="picker">
	<Popover label="Set status" role="menu">
		{#snippet trigger(attrs)}
			<button
				class={['current', { compact }]}
				type="button"
				style:--c={color(shown)}
				aria-label={compact ? `Status: ${label(shown)}` : undefined}
				title={compact ? label(shown) : undefined}
				disabled={save.isPending}
				{...attrs}
			>
				<span class="dot"></span>
				{#if !compact}{label(shown)}{/if}
			</button>
		{/snippet}
		{#snippet children(close)}
			<div class="menu">
				{#each items as item (item.key)}
					<button
						class="item"
						type="button"
						role="menuitem"
						disabled={item.status === todo.status && !item.reason}
						onclick={() => pick(item, close)}
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
			</div>
		{/snippet}
	</Popover>
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
		transition: background 140ms ease;
	}

	/* A bare dot with a hit area big enough to tap. */
	.current.compact {
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		padding: 0;
		border-color: transparent;
		background: none;
	}

	.current:hover,
	.current[aria-expanded='true'] {
		background: color-mix(in srgb, var(--c) 20%, transparent);
	}

	.current:disabled {
		cursor: default;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c);
	}

	.menu {
		min-width: 13em;
		padding: 0.25em 0;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: 100%;
		border: none;
		background: none;
		padding: 0.45em 0.8em;
		font: inherit;
		font-size: 0.85em;
		text-align: left;
		color: var(--ink);
		cursor: pointer;
	}

	.item:hover:not(:disabled),
	.item:focus-visible {
		background: var(--hover);
		outline: none;
	}

	.item:disabled {
		cursor: default;
		opacity: 0.45;
	}

	.note {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		margin-top: 0.25em;
		padding: 0.6em 0.8em 0.4em;
		border-top: 1px solid var(--border);
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

	@media (prefers-reduced-motion: reduce) {
		.current {
			transition: none;
		}
	}
</style>
