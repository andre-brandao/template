<script lang="ts">
	import type { App } from '@template/core/app';
	import { goto } from '$app/navigation';
	import ArrowDownToLine from '@lucide/svelte/icons/arrow-down-to-line';
	import { List, Menu, Tooltip, modal } from '@template/ui';
	import Rename from '#lib/components/Rename.svelte';
	import { ask } from '#lib/ask.ts';
	import { fmt } from '#lib/utils/fmt.ts';
	import { remove, rename } from '../../api/apps.query';
	import KeyForm from '../key/KeyForm.svelte';
	import { secret } from './secret';

	let { app }: { app: App.Info } = $props();

	const f = fmt();
	const save = rename();
	const drop = remove();
	const inbound = secret();
	const href = $derived(`/u/${app.id}`);

	let renaming = $state(false);
	const busy = $derived(drop.isPending || inbound.spin.isPending);
	// While renaming, Inline shows its own failure.
	const fail = $derived(drop.error ?? inbound.spin.error ?? (renaming ? null : save.error));

	async function del() {
		const ok = await ask({
			title: 'Delete app',
			name: app.name,
			warn: "{name}'s keys, inbound secret and webhooks stop working immediately.",
			verify: true
		});
		if (ok) drop.mutate(app.id);
	}
</script>

{#snippet edit()}
	<Rename
		label="App name"
		value={app.name}
		save={(name) => save.mutateAsync({ id: app.id, name })}
		done={() => (renaming = false)}
	/>
{/snippet}

<List.Row
	title={renaming ? edit : app.name}
	href={renaming ? undefined : href}
	label="{app.name} actions"
	muted={drop.isPending}
	state={busy ? 'pending' : fail ? 'failed' : 'idle'}
	message={fail?.message}
>
	{app.owner ? `Owned by ${app.owner.name}` : 'No owner'}
	{#snippet meta()}<span>{f.date(app.timeCreated)}</span>{/snippet}
	{#snippet actions()}
		<Tooltip tip={app.inbound ? 'Inbound on' : 'No inbound secret'}>
			<span class={['inbound', { on: app.inbound }]}><ArrowDownToLine size={14} /></span>
		</Tooltip>
	{/snippet}
	{#snippet menu()}
		<Menu.Item onselect={() => goto(href)}>Open</Menu.Item>
		<Menu.Item disabled={save.isPending} onselect={() => (renaming = true)}>Rename</Menu.Item>
		<Menu.Item onselect={() => modal(KeyForm, { app: app.id })}>New API key</Menu.Item>
		<Menu.Item disabled={inbound.spin.isPending} onselect={() => inbound.run(app)}>
			{app.inbound ? 'Rotate inbound secret' : 'Generate inbound secret'}
		</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger onselect={del}>Delete</Menu.Item>
	{/snippet}
</List.Row>

<style>
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
