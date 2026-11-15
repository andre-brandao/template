<script lang="ts">
	import type { Key } from '@template/core/key';
	import ClockAlert from '@lucide/svelte/icons/clock-alert';
	import CircleOff from '@lucide/svelte/icons/circle-off';
	import { Menu, Status, Tooltip, modal } from '@template/ui';
	import { fmt } from '$lib/utils/fmt';
	import { retire, revoke } from '../../api/developers.query';
	import Row from '../Row.svelte';

	// With `app` the key is the App's, revoked through its own route.
	let { key, app }: { key: Key.Info; app?: string } = $props();

	const f = fmt();
	const own = revoke();
	const its = retire();
	const drop = $derived(app ? its : own);

	// The mask is all there is: the row keeps a hash, so nothing here can be revealed.
	const left = $derived(key.expiresAt ? new Date(key.expiresAt).getTime() - Date.now() : Infinity);

	async function ask() {
		const ok = await modal.confirm({ title: 'Revoke key', action: 'Revoke', body: warn });
		if (!ok) return;
		if (app) return its.mutate({ path: { id: app, key: key.id } });
		own.mutate({ path: { id: key.id } });
	}
</script>

{#snippet warn()}
	Anything signing in with <b>{key.name}</b> stops working at once.
{/snippet}

<Row label="Actions for {key.name}" muted={drop.isPending}>
	<span class="name">{key.name}</span>
	<code>{key.display}</code>
	<span class="meta">{key.timeUsed ? `used ${f.ago(key.timeUsed)}` : 'never used'}</span>
	<span class="meta">{key.expiresAt ? `until ${f.date(key.expiresAt)}` : 'no expiry'}</span>
	<span class="state">
		{#if drop.isPending || drop.error}
			<Status state={drop.isPending ? 'pending' : 'failed'} message={drop.error?.message} />
		{:else if left <= 0}
			<Tooltip tip="Expired"><span class="bad"><CircleOff size={14} /></span></Tooltip>
		{:else if left < 7 * 86_400_000}
			<Tooltip tip="Expires within a week"><span class="soon"><ClockAlert size={14} /></span></Tooltip>
		{/if}
	</span>

	{#snippet menu()}
		<Menu.Item onselect={() => navigator.clipboard.writeText(key.id)}>Copy ID</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger disabled={drop.isPending} onselect={ask}>Revoke</Menu.Item>
	{/snippet}
</Row>

<style>
	.name {
		flex: 0 1 12em;
		min-width: 6em;
		overflow: hidden;
		font-weight: 550;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	code {
		flex: 1 1 14em;
		min-width: 0;
		overflow: hidden;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.8em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		flex: 0 0 8.5em;
		color: var(--dim);
		font-size: 0.8em;
		white-space: nowrap;
	}

	.state {
		display: grid;
		place-items: center;
		flex: 0 0 1.2em;
	}

	.soon {
		color: var(--progress);
	}

	.bad {
		color: var(--danger);
	}
</style>
