<!--
	The ⋯ menu on a todo row or card. Its container also wires `oncontextmenu` to `at`, so a
	right-click opens these same items at the pointer. Destructive last.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
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
		onrename,
		children
	}: {
		todo: Todo.Info;
		deleting: boolean;
		ask: () => void;
		/** Left out where the title can't turn into a field, like the table. */
		onrename?: () => void;
		/** Extra items before Delete, like the table's Indent and Outdent. */
		children?: Snippet;
	} = $props();

	const attach = link();
	let menu: Menu.Root | undefined = $state();

	export function at(e: MouseEvent) {
		menu?.at(e);
	}
</script>

<Menu.Root bind:this={menu} label="{todo.title} actions" align="end">
	{#snippet trigger(attrs)}
		<button class="dots" aria-label="{todo.title} actions" {...attrs}>
			<Ellipsis size={16} strokeWidth={1.75} />
		</button>
	{/snippet}
	<Menu.Item onselect={() => goto(`/todos/${todo.id}`)}>Open</Menu.Item>
	{#if onrename}<Menu.Item disabled={deleting} onselect={onrename}>Rename</Menu.Item>{/if}
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
	{@render children?.()}
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
