<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import Power from '@lucide/svelte/icons/power';
	import { Inline, Menu, Status, Tooltip, modal } from '@template/ui';
	import type { Webhook } from '@template/core/webhook';
	import { fmt } from '$lib/utils/fmt';
	import { unsubscribe, update } from '../../api/developers.query';
	import Row from '../Row.svelte';

	let { row }: { row: Webhook.Info } = $props();

	const f = fmt();
	const flip = update();
	const edit = update();
	const drop = unsubscribe();

	// The switch leads the request with the user's choice, and falls back to the row's if it fails.
	let on = $derived(row.enabled);
	const state = $derived(
		flip.isPending ? 'pending' : flip.isError ? 'failed' : flip.isSuccess ? 'saved' : 'idle'
	);

	function power() {
		on = !on;
		flip.mutate(
			{ path: { id: row.id }, body: { enabled: on } },
			{ onError: () => (on = row.enabled) }
		);
	}

	// `timeDelivered` only moves on success, so it pairs with a clean status.
	const health = $derived.by(() => {
		if (!row.lastStatus) return { tone: 'idle', tip: 'No deliveries yet' };
		if (row.failures)
			return { tone: 'bad', tip: `${row.lastStatus}, ${row.failures} failed in a row` };
		const at = row.timeDelivered ? `, delivered ${f.ago(row.timeDelivered)}` : '';
		return { tone: 'ok', tip: `${row.lastStatus}${at}` };
	});

	async function ask() {
		const ok = await modal.confirm({ title: 'Delete webhook', action: 'Delete webhook', body: warn });
		if (ok) drop.mutate({ path: { id: row.id } });
	}
</script>

{#snippet warn()}
	Deliveries to <b>{row.url}</b> stop at once, including any retries still in flight. Its signing
	secret goes with it.
{/snippet}

<Row label="Actions for {row.url}" muted={!on || drop.isPending}>
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
	<span class="url">
		<Inline
			label="Endpoint URL"
			value={row.url}
			onsave={(url) => edit.mutateAsync({ path: { id: row.id }, body: { url } })}
		/>
	</span>
	<span class="meta">{row.types.length ? `${row.types.length} events` : 'all events'}</span>
	<code>{row.display}</code>
	<span class="state">
		{#if drop.isPending || drop.error}
			<Status state={drop.isPending ? 'pending' : 'failed'} message={drop.error?.message} />
		{:else}
			<Status {state} message={flip.error?.message} />
		{/if}
	</span>
	<Tooltip tip={on ? 'Disable' : 'Enable'}>
		<button
			type="button"
			class={['power', { on }]}
			aria-label={on ? 'Disable webhook' : 'Enable webhook'}
			aria-pressed={on}
			disabled={flip.isPending}
			onclick={power}
		>
			<Power size={14} />
		</button>
	</Tooltip>

	{#snippet menu()}
		<Menu.Item disabled={flip.isPending} onselect={power}>{on ? 'Disable' : 'Enable'}</Menu.Item>
		<Menu.Item onselect={() => navigator.clipboard.writeText(row.secret)}>Copy signing secret</Menu.Item>
		<Menu.Item onselect={() => navigator.clipboard.writeText(row.url)}>Copy URL</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger disabled={drop.isPending} onselect={ask}>Delete</Menu.Item>
	{/snippet}
</Row>

<style>
	.health {
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

	.url {
		flex: 1 1 16em;
		min-width: 8em;
		margin-left: -0.4em;
		font-weight: 550;
	}

	.meta {
		flex: 0 0 6.5em;
		color: var(--dim);
		font-size: 0.8em;
		white-space: nowrap;
	}

	code {
		flex: 0 1 11em;
		min-width: 0;
		overflow: hidden;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.8em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.state {
		display: grid;
		place-items: center;
		flex: 0 0 0.8em;
	}

	.power {
		display: grid;
		place-items: center;
		width: 1.9em;
		height: 1.9em;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--dim);
		cursor: pointer;
		transition:
			color 140ms ease,
			border-color 140ms ease;
	}

	.power.on {
		border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
		color: var(--accent);
	}

	.power:hover:not(:disabled) {
		border-color: var(--border-bright);
	}

	.power:disabled {
		cursor: default;
	}
</style>
