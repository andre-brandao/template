<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Button, Spinner } from '@template/ui';
	import { closeTodo, reopenTodo } from '../api/todos.remote';

	let { todo }: { todo: Todo.Info } = $props();
	// Two forms can't share one binding instance, so completed/not-planned each get their own key.
	const close = $derived(closeTodo.for(`${todo.id}:completed`));
	const closeNotPlanned = $derived(closeTodo.for(`${todo.id}:not_planned`));
	const reopen = $derived(reopenTodo.for(todo.id));

	let open = $state(false);
	let wrap: HTMLElement | undefined;
</script>

<svelte:window
	onclick={(e) => open && wrap && !wrap.contains(e.target as Node) && (open = false)}
	onkeydown={(e) => open && e.key === 'Escape' && (open = false)}
/>

<span class="toggle">
	{#if todo.state === 'open'}
		<div class="split" {@attach (el) => (wrap = el)}>
			<form {...close}>
				<input {...close.fields.id.as('hidden', todo.id)} />
				<input {...close.fields.reason.as('hidden', 'completed')} />
				<button class="main" type="submit" disabled={!!close.pending}>
					{#if close.pending}<Spinner />{/if}
					Close as completed
				</button>
			</form>
			<button
				class="caret"
				type="button"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label="Close with a different reason"
				onclick={() => (open = !open)}
			>
				▾
			</button>
			{#if open}
				<div class="menu" role="menu">
					<form {...closeNotPlanned}>
						<input {...closeNotPlanned.fields.id.as('hidden', todo.id)} />
						<input {...closeNotPlanned.fields.reason.as('hidden', 'not_planned')} />
						<button
							class="item"
							type="submit"
							role="menuitem"
							disabled={!!closeNotPlanned.pending}
							onclick={() => (open = false)}
						>
							Close as not planned
						</button>
					</form>
				</div>
			{/if}
		</div>
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

	.split {
		position: relative;
		display: inline-flex;
	}

	.split form {
		display: contents;
	}

	.main,
	.caret {
		border: 1px solid var(--accent, #4fa98f);
		background: var(--accent, #4fa98f);
		color: var(--accent-ink, #0d1110);
		font: inherit;
		font-family: var(--font-mono, monospace);
		font-size: 0.85em;
		cursor: pointer;
		transition:
			background 0.15s ease,
			opacity 0.15s ease;
	}

	.main {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		border-radius: var(--radius) 0 0 var(--radius);
		border-inline-end: none;
		padding: 0.45em 1em;
	}

	.main:disabled,
	.caret:disabled {
		cursor: default;
		opacity: 0.6;
	}

	.caret {
		border-radius: 0 var(--radius) var(--radius) 0;
		border-inline-start: 1px solid rgb(0 0 0 / 0.15);
		padding: 0.45em 0.6em;
		line-height: 1;
	}

	.main:hover:not(:disabled),
	.caret:hover:not(:disabled) {
		filter: brightness(0.95);
	}

	.menu {
		position: absolute;
		z-index: 10;
		top: calc(100% + 0.3em);
		right: 0;
		min-width: 12em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
		overflow: hidden;
	}

	.item {
		display: block;
		width: 100%;
		border: none;
		background: none;
		padding: 0.6em 0.8em;
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
		opacity: 0.6;
	}
</style>
