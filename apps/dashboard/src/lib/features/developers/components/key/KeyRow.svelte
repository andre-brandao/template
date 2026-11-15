<script lang="ts">
	import type { Key } from '@template/core/key';
	import ClockAlert from '@lucide/svelte/icons/clock-alert';
	import CircleOff from '@lucide/svelte/icons/circle-off';
	import { List, Menu, Tooltip } from '@template/ui';
	import { ask } from '$lib/ask';
	import { copy } from '$lib/utils/copy';
	import { fmt } from '$lib/utils/fmt';
	import { revoke } from '../../api/apps.query';
	import { remove } from '../../api/keys.query';

	// With `app` the key is the App's, revoked through its own route.
	let { key, app }: { key: Key.Info; app?: string } = $props();

	const f = fmt();
	const own = remove();
	const its = revoke();
	const drop = $derived(app ? its : own);

	// The mask is all there is: the row keeps a hash, so nothing here can be revealed.
	const left = $derived(key.expiresAt ? new Date(key.expiresAt).getTime() - Date.now() : Infinity);

	async function del() {
		const ok = await ask({
			title: 'Revoke API key',
			action: 'Revoke',
			name: key.name,
			warn: 'Anything signing in with {name} stops working at once.'
		});
		if (!ok) return;
		if (app) return its.mutate({ app, id: key.id });
		own.mutate({ path: { id: key.id } });
	}
</script>

<List.Row
	title={key.name}
	label="{key.name} actions"
	muted={drop.isPending}
	state={drop.isPending ? 'pending' : drop.error ? 'failed' : 'idle'}
	message={drop.error?.message}
>
	<code>{key.display}</code>
	{#snippet meta()}
		<span>{key.timeUsed ? `used ${f.ago(key.timeUsed)}` : 'never used'}</span>
		<span>{key.expiresAt ? `until ${f.date(key.expiresAt)}` : 'no expiry'}</span>
	{/snippet}
	{#snippet actions()}
		{#if left <= 0}
			<Tooltip tip="Expired"><span class="bad"><CircleOff size={14} /></span></Tooltip>
		{:else if left < 7 * 86_400_000}
			<Tooltip tip="Expires within a week"><span class="soon"><ClockAlert size={14} /></span></Tooltip>
		{/if}
	{/snippet}
	{#snippet menu()}
		<Menu.Item onselect={() => copy(key.id)}>Copy ID</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger onselect={del}>Revoke</Menu.Item>
	{/snippet}
</List.Row>

<style>
	code {
		font-family: var(--font-mono);
	}

	.soon,
	.bad {
		display: grid;
	}

	.soon {
		color: var(--progress);
	}

	.bad {
		color: var(--danger);
	}
</style>
