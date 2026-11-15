<!-- The ⋯ menu on a todo row or card. Destructive last. -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Todo } from '@template/core/todo';
	import { Menu, modal } from '@template/ui';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import LinkForm from '$lib/components/LinkForm.svelte';
	import { link } from '../api/todos.query';

	let {
		todo,
		deleting,
		ask,
		onrename
	}: { todo: Todo.Info; deleting: boolean; ask: () => void; onrename: () => void } = $props();

	const attach = link();
</script>

<Menu.Root label="{todo.title} actions" align="end">
	{#snippet trigger(attrs)}
		<button class="dots" aria-label="{todo.title} actions" {...attrs}>
			<Ellipsis size={16} strokeWidth={1.75} />
		</button>
	{/snippet}
	<Menu.Item onselect={() => goto(`/todos/${todo.id}`)}>Open</Menu.Item>
	<Menu.Item disabled={deleting} onselect={onrename}>Rename</Menu.Item>
	<Menu.Item
		disabled={deleting}
		onselect={() =>
			modal(LinkForm, {
				add: (body: { url: string; title?: string }) =>
					attach.mutateAsync({ path: { id: todo.id }, body })
			})}
	>
		Add link
	</Menu.Item>
	<Menu.Separator />
	<Menu.Item danger disabled={deleting} onselect={ask}>Delete</Menu.Item>
</Menu.Root>

<style>
	.dots {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 1.9em;
		height: 1.9em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		cursor: pointer;
		opacity: var(--dots, 0);
		transition:
			opacity 140ms ease,
			background 140ms ease;
	}

	.dots:hover,
	.dots[aria-expanded='true'] {
		opacity: 1;
		background: var(--hover);
		color: var(--ink);
	}

	.dots:focus-visible {
		opacity: 1;
		outline: 2px solid var(--accent);
		outline-offset: -1px;
	}

	@media (hover: none) {
		.dots {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dots {
			transition: none;
		}
	}
</style>
