<!--
	The `show` tool's view: the spec drawn while the model streams it, each data block
	fetching its own rows. Once done it can be saved for the admin panels list.
-->
<script lang="ts">
	import { parsePartialJSON } from '@tanstack/ai/client';
	import type { Spec } from '@json-render/svelte';
	import { Button, Issue, Status } from '@template/ui';
	import Busy from '../components/Busy.svelte';
	import Save from '@lucide/svelte/icons/save';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { save } from '../api/panel.query';
	import type { ViewProps } from '../views';
	import Render from './Render.svelte';
	import { clean, title } from '../render/spec';

	let { part, result, done, output }: ViewProps = $props();

	const raw = $derived(
		part.input !== undefined
			? part.input
			: typeof part.arguments === 'string'
				? parsePartialJSON(part.arguments)
				: undefined
	);
	const spec = $derived(clean(raw));

	const problem = $derived.by(() => {
		if (result?.state === 'error' || result?.error)
			return result.error || 'The panel could not be built.';
		const out = output as { ok?: unknown; error?: unknown } | null | undefined;
		if (out?.ok === false && typeof out.error === 'string') return out.error;
		return undefined;
	});

	// The saved panel's id: saving again overwrites it.
	let saved = $state<string>();
	const store = save({ onSuccess: (info) => (saved = info.id) });

	const keep = (panel: Spec) => store.mutate({ id: saved, title: title(panel), spec: panel });
</script>

<div class="view">
	{#if spec}
		<Render spec={raw} loading={!done} />
	{:else}
		<Busy label="building panel…" />
	{/if}

	{#if problem}<Issue>{problem}</Issue>{/if}

	{#if done && spec}
		<div class="actions">
			{#if saved}
				<a class="saved" href="/settings/panels/{saved}">
					<ExternalLink size={14} strokeWidth={1.75} />
					Saved · open
				</a>
			{/if}
			<Button variant="ghost" pending={store.isPending} onclick={() => keep(spec)}>
				<Save size={14} strokeWidth={1.75} />
				{saved ? 'Save again' : 'Save panel'}
			</Button>
			{#if store.isError}<Status of={store} />{/if}
		</div>
	{/if}
</div>

<style>
	.view {
		display: grid;
		gap: 0.5em;
		min-width: 0;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25em;
		font-size: 0.85em;
	}

	.saved {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.35em 0.6em;
		color: var(--accent);
		text-decoration: none;
	}
</style>
