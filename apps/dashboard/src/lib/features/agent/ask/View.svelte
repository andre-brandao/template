<!--
	The `ask` tool's view: a hint while the spec streams, the form while the call waits
	(folded to a bar while the user talks about it), then a compact summary of the answers.
-->
<script lang="ts">
	import { parsePartialJSON } from '@tanstack/ai/client';
	import { Issue } from '@template/ui';
	import Busy from '../components/Busy.svelte';
	import Message from '@lucide/svelte/icons/message-square-text';
	import type { ViewProps } from '../views';
	import { clean } from '../panel/spec';
	import type { Output } from './catalog';
	import { talking, waiting } from './pending';
	import Host from './Host.svelte';
	import Summary from './Summary.svelte';

	let { part, output }: ViewProps = $props();

	const raw = $derived(part.input ?? parsePartialJSON(String(part.arguments ?? '')));
	const spec = $derived(clean(raw));
	const heading = $derived(String(spec?.elements[spec.root]?.props.title || 'Form'));
	const out = $derived.by(() => {
		const value = output as Output | null | undefined;
		return typeof value?.answered === 'boolean' ? value : undefined;
	});
</script>

<div class="view">
	{#if waiting.has(part.id) && spec}
		{#if talking.has(part.id)}
			<div class="bar">
				<Message size={14} strokeWidth={1.75} />
				<span>Discussing <strong>{heading}</strong> · answer below</span>
				<button type="button" onclick={() => talking.delete(part.id)}>Back to the form</button>
			</div>
		{/if}
		<div hidden={talking.has(part.id)}><Host {spec} id={part.id} /></div>
	{:else if out?.answered}
		<Summary {heading} answers={out.answers} chat={false} />
	{:else if out?.reason.startsWith('Invalid form')}
		<Issue>{out.reason}</Issue>
	{:else if out}
		<Summary {heading} answers={out.partial ?? []} chat />
	{:else}
		<Busy label="preparing questions…" />
	{/if}
</div>

<style>
	.view {
		min-width: 0;
	}

	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 0.7em;
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		color: var(--muted);
		font-size: 0.82em;
	}

	button {
		margin-left: auto;
		border: none;
		background: none;
		color: var(--accent);
		font: inherit;
		cursor: pointer;
	}
</style>
