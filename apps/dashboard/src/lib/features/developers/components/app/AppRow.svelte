<script lang="ts">
	import type { App } from '@template/core/app';
	import { goto } from '$app/navigation';
	import ArrowDownToLine from '@lucide/svelte/icons/arrow-down-to-line';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { Inline, Menu, Status, Tooltip, modal } from '@template/ui';
	import { fmt } from '$lib/utils/fmt';
	import { remove, rename, rotate } from '../../api/apps.query';
	import KeyForm from '../key/KeyForm.svelte';
	import Reveal from '../Reveal.svelte';
	import Row from '../Row.svelte';

	let { app }: { app: App.Info } = $props();

	const f = fmt();
	const save = rename();
	const drop = remove();
	// The row outlives the reveal, so reset drops the secret from the mutation's data.
	const spin = rotate({
		onSuccess: (data) => {
			spin.reset();
			modal(Reveal, { title: `Inbound secret for ${app.name}`, secret: data.secret });
		}
	});
	const busy = $derived(drop.isPending || spin.isPending);
	const error = $derived(drop.error ?? spin.error);

	// Rotating breaks whatever signs with the current secret, so only a held one asks first.
	async function cycle() {
		if (app.inbound && !(await modal.confirm({ title: 'Rotate secret', action: 'Rotate', body: cut })))
			return;
		spin.mutate(app.id);
	}

	async function ask() {
		const ok = await modal.confirm({
			title: 'Delete app',
			action: 'Delete app',
			body: warn,
			verify: app.name
		});
		if (ok) drop.mutate(app.id);
	}
</script>

{#snippet cut()}
	The current inbound secret for <b>{app.name}</b> stops working at once.
{/snippet}

{#snippet warn()}
	Its keys, inbound secret and webhooks stop working immediately.
{/snippet}

<Row label="Actions for {app.name}" muted={drop.isPending}>
	<span class="name">
		<Inline
			label="App name"
			value={app.name}
			onsave={(name) => save.mutateAsync({ id: app.id, name })}
		/>
	</span>
	<a href="/u/{app.id}" class="open" aria-label="Open {app.name}"><ArrowUpRight size={14} /></a>
	<span class="meta owner">{app.owner?.name ?? 'no owner'}</span>
	<span class="meta">{f.date(app.timeCreated)}</span>
	<span class="state">
		{#if busy || error}
			<Status state={busy ? 'pending' : 'failed'} message={error?.message} />
		{:else}
			<Tooltip tip={app.inbound ? 'Inbound on' : 'No inbound secret'}>
				<span class={['inbound', { on: app.inbound }]}><ArrowDownToLine size={14} /></span>
			</Tooltip>
		{/if}
	</span>

	{#snippet menu()}
		<Menu.Item onselect={() => goto(`/u/${app.id}`)}>Open</Menu.Item>
		<Menu.Item onselect={() => modal(KeyForm, { app: app.id })}>New API key</Menu.Item>
		<Menu.Item disabled={spin.isPending} onselect={cycle}>
			{app.inbound ? 'Rotate inbound secret' : 'Generate inbound secret'}
		</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger disabled={drop.isPending} onselect={ask}>Delete</Menu.Item>
	{/snippet}
</Row>

<style>
	.name {
		flex: 0 1 16em;
		min-width: 6em;
		margin-left: -0.4em;
		font-weight: 550;
	}

	.open {
		display: grid;
		place-items: center;
		color: var(--dim);
		transition: color 140ms ease;
	}

	.open:hover,
	.open:focus-visible {
		color: var(--ink);
	}

	.meta {
		flex: 0 0 8em;
		color: var(--dim);
		font-size: 0.8em;
		white-space: nowrap;
	}

	.owner {
		flex: 1 1 10em;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state {
		display: grid;
		place-items: center;
		flex: 0 0 1.2em;
	}

	.inbound {
		display: grid;
		color: var(--dim);
		opacity: 0.5;
	}

	.inbound.on {
		color: var(--accent);
		opacity: 1;
	}
</style>
