<!-- A todo's name: a link stretched over its row or card, swapped for Inline while renaming. -->
<script lang="ts">
	import { tick } from 'svelte';
	import type { Todo } from '@template/core/todo';
	import { Inline, Status } from '@template/ui';
	import { peek } from '$lib/utils/peek';
	import { update } from '../api/todos.query';

	let {
		todo,
		renaming = $bindable(false),
		busy = false
	}: { todo: Todo.Info; renaming?: boolean; busy?: boolean } = $props();

	const save = update();
	// The typed title stays up until the refetch lands; a failure falls back to the stored one.
	const shown = $derived((save.isPending && save.variables?.body.title) || todo.title);
	const mark = $derived(
		save.isPending ? 'pending' : save.isError ? 'failed' : save.isSuccess ? 'saved' : 'idle'
	);

	let anchor: HTMLAnchorElement | undefined;

	async function done() {
		renaming = false;
		await tick();
		anchor?.focus();
	}
</script>

{#if renaming}
	<!-- Leaving the field by any route ends the rename; Inline owns the draft. -->
	<div
		class="edit"
		onfocusout={() => (renaming = false)}
		onkeydowncapture={(e) => (e.key === 'Escape' || e.key === 'Enter') && done()}
		{@attach (el) => el.querySelector('button')?.focus()}
	>
		<Inline
			label="Todo title"
			value={todo.title}
			onsave={(next) => save.mutateAsync({ path: { id: todo.id }, body: { title: next } })}
		/>
	</div>
{:else}
	<span class="title">
		<a
			class="name"
			href="/todos/{todo.id}"
			onclick={peek({ selected: todo.id })}
			{@attach (el) => {
				anchor = el;
			}}>{shown}</a
		>
		<Status state={busy ? 'pending' : mark} message={save.error?.message} />
	</span>
{/if}

<style>
	.title {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
	}

	.name {
		overflow: hidden;
		color: var(--ink);
		font-weight: 500;
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
		outline: none;
	}

	/* Stretched over the row or card, so anywhere that isn't a control opens the todo. */
	.name::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.name:focus-visible::after {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
		border-radius: var(--radius-sm);
	}

	/* Inline pads its box; pull it back so the text stays on the name's line. */
	.edit {
		position: relative;
		z-index: 1;
		margin: -0.2em -0.4em;
		font-weight: 500;
	}
</style>
