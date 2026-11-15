<!-- Owns the confirm and the write; the caller renders whatever control calls `ask`. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { modal, toast } from '@template/ui';
	import { remove } from '../../api/apps.query';

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
		const ok = await modal.confirm({ title: 'Delete app', action: 'Delete app', body: warn, verify: name });
		if (!ok) return;
		drop.mutate(id, { onError: (err) => toast.error(err.message || 'Could not delete the app') });
	}
</script>

{#snippet warn()}
	<b>{name}</b>'s keys, inbound secret and webhooks stop working immediately.
{/snippet}

{@render children(ask, drop.isPending)}
