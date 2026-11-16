<!-- The record's ⋯ menu beside its primary action; destructive things live here, not in the body. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { IconButton, Menu } from '@template/ui';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Delete from '../Delete.svelte';

	let { todo, onremove }: { todo: Todo.Info; onremove: () => void } = $props();
</script>

<Delete id={todo.id} title={todo.title} ondone={onremove}>
	{#snippet children(ask, deleting)}
		<Menu.Root label="More actions" align="end">
			{#snippet trigger(attrs)}
				<IconButton label="More actions" variant="secondary" disabled={deleting} {...attrs}>
					<Ellipsis size={16} strokeWidth={1.75} />
				</IconButton>
			{/snippet}
			<Menu.Item danger onselect={ask}>Delete todo</Menu.Item>
		</Menu.Root>
	{/snippet}
</Delete>
