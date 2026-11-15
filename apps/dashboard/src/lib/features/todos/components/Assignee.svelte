<!-- Quick reassign from a row or card: the avatar opens the directory. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { createQuery } from '@tanstack/svelte-query';
	import { Avatar, Popover, Skeleton, Status } from '@template/ui';
	import UserRound from '@lucide/svelte/icons/user-round';
	import { update, users } from '../api/todos.query';

	// `full` names the assignee beside the avatar, for the editor's side panel.
	let { todo, full = false }: { todo: Todo.Info; full?: boolean } = $props();

	let open = $state(false);
	// Only a picker needs the whole directory, and only once it opens.
	const people = createQuery(() => ({ ...users(), enabled: open }));
	const save = update();

	// The pick stays up until the refetch lands; a failure falls back to the stored one.
	const next = $derived(save.isPending ? save.variables?.body?.assignee : undefined);
	const shown = $derived(
		next === undefined ? todo.assignee : (people.data?.find((one) => one.id === next) ?? null)
	);

	function pick(id: string | null, close: () => void) {
		close();
		if (id === (todo.assignee?.id ?? null)) return;
		save.mutate({ path: { id: todo.id }, body: { assignee: id } });
	}
</script>

<span class="who">
	<Popover bind:open label="Assign" role="menu" align="end">
		{#snippet trigger(attrs)}
			<button
				class={['face', { full }]}
				type="button"
				aria-label={shown ? `Assigned to ${shown.name}` : 'Assign'}
				title={shown?.name ?? 'Unassigned'}
				disabled={save.isPending}
				{...attrs}
			>
				{#if shown}
					<Avatar name={shown.name} image={shown.image} size={20} />
				{:else}
					<UserRound size={14} strokeWidth={1.75} />
				{/if}
				{#if full}<span class="label">{shown?.name ?? 'Unassigned'}</span>{/if}
			</button>
		{/snippet}
		{#snippet children(close)}
			<div class="menu">
				<button class="item" type="button" role="menuitem" onclick={() => pick(null, close)}>
					<UserRound size={14} strokeWidth={1.75} />
					Unassigned
				</button>
				{#if people.isPending}
					<div class="wait"><Skeleton h="1.8em" /><Skeleton h="1.8em" /></div>
				{:else}
					{#each people.data ?? [] as one (one.id)}
						<button
							class={['item', { on: one.id === todo.assignee?.id }]}
							type="button"
							role="menuitem"
							onclick={() => pick(one.id, close)}
						>
							<Avatar name={one.name} image={one.image} size={18} />
							{one.name}
						</button>
					{/each}
				{/if}
			</div>
		{/snippet}
	</Popover>
	<Status of={save} />
</span>

<style>
	.who {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}

	.face {
		display: grid;
		place-items: center;
		width: 1.6em;
		height: 1.6em;
		padding: 0;
		border: 1px dashed transparent;
		border-radius: 50%;
		background: none;
		color: var(--dim);
		cursor: pointer;
		transition: border-color 140ms ease;
	}

	.face.full {
		display: inline-flex;
		gap: 0.45em;
		width: auto;
		padding: 0 0.5em 0 0.1em;
		border-radius: var(--radius-sm);
		font: inherit;
		color: var(--ink);
	}

	.face:hover,
	.face[aria-expanded='true'] {
		border-color: var(--border-bright);
		color: var(--ink);
	}

	.face:disabled {
		cursor: default;
	}

	.menu {
		min-width: 13em;
		max-height: 18em;
		overflow-y: auto;
		padding: 0.25em 0;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: 100%;
		border: none;
		background: none;
		padding: 0.4em 0.8em;
		font: inherit;
		font-size: 0.85em;
		text-align: left;
		color: var(--ink);
		cursor: pointer;
	}

	.item:hover,
	.item:focus-visible {
		background: var(--hover);
		outline: none;
	}

	.item.on {
		font-weight: 500;
	}

	.wait {
		display: grid;
		gap: 0.3em;
		padding: 0.3em 0.8em;
	}

	@media (prefers-reduced-motion: reduce) {
		.face {
			transition: none;
		}
	}
</style>
