<!-- Owns the confirm and the write; the caller renders whatever control calls `ask`. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { modal, toast } from '@template/ui';
	import { remove } from '../api/todos.query';

	let {
		id,
		title,
		ondone,
		children
	}: {
		id: string;
		title: string;
		ondone?: () => void;
		children: Snippet<[ask: () => void, pending: boolean]>;
	} = $props();

	const drop = remove({ onSuccess: () => ondone?.() });

	async function ask() {
		const ok = await modal.confirm({ title: 'Delete todo', action: 'Delete todo', body: warn });
		if (!ok) return;
		drop.mutate(
			{ path: { id } },
			{ onError: (err) => toast.error(err.message ?? 'Could not delete todo') }
		);
	}
</script>

{#snippet warn()}
	This removes <b>{title}</b> and its history. Its sub-issues move up a level.
{/snippet}

{@render children(ask, drop.isPending)}
