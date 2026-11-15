<!-- Owns the confirm and the write; the caller renders whatever control calls `ask`. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { modal, toast } from '@template/ui';
	import { remove } from '../api/projects.query';

	let {
		id,
		name,
		ondone,
		children
	}: {
		id: string;
		name: string;
		ondone?: () => void;
		children: Snippet<[ask: () => void, pending: boolean]>;
	} = $props();

	const drop = remove({ onSuccess: () => ondone?.() });

	async function ask() {
		const ok = await modal.confirm({
			title: 'Delete project',
			action: 'Delete project',
			body: warn,
			verify: name
		});
		if (!ok) return;
		drop.mutate(
			{ path: { id } },
			{ onError: (err) => toast.error(err.message ?? 'Could not delete project') }
		);
	}
</script>

{#snippet warn()}
	This removes <b>{name}</b> along with its stages and its insights. Todos filed under it are kept
	and stay in the Todos list.
{/snippet}

{@render children(ask, drop.isPending)}
