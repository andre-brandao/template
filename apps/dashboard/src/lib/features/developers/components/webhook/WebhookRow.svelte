<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import Power from '@lucide/svelte/icons/power';
	import { IconButton, Inline, List, Menu, Tooltip } from '@template/ui';
	import type { Webhook } from '@template/core/webhook';
	import { ask } from '$lib/ask';
	import { copy } from '$lib/utils/copy';
	import { fmt } from '$lib/utils/fmt';
	import { remove, update } from '../../api/webhooks.query';

	let { row }: { row: Webhook.Info } = $props();

	const f = fmt();
	const flip = update();
	const edit = update();
	const drop = remove();

	// The switch shows the stored state; a flip in flight shows as the row's dot.
	const busy = $derived(flip.isPending || drop.isPending);
	const fail = $derived(drop.error ?? flip.error);

	// `timeDelivered` only moves on success, so it pairs with a clean status.
	const health = $derived.by(() => {
		if (!row.lastStatus) return { tone: 'idle', tip: 'No deliveries yet' };
		if (row.failures)
			return { tone: 'bad', tip: `${row.lastStatus}, ${row.failures} failed in a row` };
		const at = row.timeDelivered ? `, delivered ${f.ago(row.timeDelivered)}` : '';
		return { tone: 'ok', tip: `${row.lastStatus}${at}` };
	});

	async function del() {
		const ok = await ask({
			title: 'Delete webhook',
			name: row.url,
			warn: 'Deliveries to {name} stop at once, including retries in flight. Its signing secret goes with it.'
		});
		if (ok) drop.mutate(row.id);
	}
</script>

{#snippet url()}
	<Inline
		label="Endpoint URL"
		flush
		required
		value={row.url}
		onsave={(next) => edit.mutateAsync({ id: row.id, url: next })}
	/>
{/snippet}

<List.Row
	title={url}
	label="{row.url} actions"
	muted={drop.isPending}
	state={busy ? 'pending' : fail ? 'failed' : 'idle'}
	message={fail?.message}
>
	{#snippet lead()}
		<Tooltip tip={health.tip}>
			<span class="health {health.tone}">
				{#if health.tone === 'ok'}
					<CircleCheck size={14} />
				{:else if health.tone === 'bad'}
					<CircleAlert size={14} />
				{:else}
					<CircleDashed size={14} />
				{/if}
			</span>
		</Tooltip>
	{/snippet}
	{#if !row.enabled}Disabled ·{/if}
	{row.types.length ? `${row.types.length} events` : 'All events'} ·
	<code>{row.display}</code>
	{#snippet actions()}
		<IconButton
			label={row.enabled ? 'Disable webhook' : 'Enable webhook'}
			size="sm"
			pressed={row.enabled}
			disabled={flip.isPending}
			onclick={() => flip.mutate({ id: row.id, enabled: !row.enabled })}
		>
			<span class={['power', { on: row.enabled }]}><Power size={14} /></span>
		</IconButton>
	{/snippet}
	{#snippet menu()}
		<Menu.Item onselect={() => copy(row.secret)}>Copy signing secret</Menu.Item>
		<Menu.Item onselect={() => copy(row.url)}>Copy URL</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger onselect={del}>Delete</Menu.Item>
	{/snippet}
</List.Row>

<style>
	.health,
	.power {
		display: grid;
		place-items: center;
		color: var(--dim);
	}

	.health.ok {
		color: var(--done);
	}

	.health.bad {
		color: var(--danger);
	}

	.power.on {
		color: var(--accent);
	}

	code {
		font-family: var(--font-mono);
	}
</style>
