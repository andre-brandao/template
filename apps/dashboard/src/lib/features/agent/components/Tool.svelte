<!-- A tool call: its page view when one is registered, else a chip that opens on its I/O. -->
<script lang="ts">
	import { Code, Spinner } from '@template/ui';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Chevron from '@lucide/svelte/icons/chevron-right';
	import { views } from '../agent.svelte';
	import type { CallPart, ResultPart } from '../views';

	let { part, result, loading }: { part: CallPart; result?: ResultPart; loading: boolean } =
		$props();

	const View = $derived(views.get(part.name));
	const done = $derived(
		!loading || !!result || part.state === 'complete' || part.state === 'error'
	);

	// Server tools send JSON strings; anything that doesn't parse passes through.
	function parse(value: unknown) {
		if (typeof value !== 'string') return value;
		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	}

	const output = $derived(result ? parse(result.content) : part.output);
	const input = $derived(part.input !== undefined ? part.input : parse(part.arguments));

	const text = (value: unknown) =>
		typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? '');
</script>

{#snippet block(title: string, value: unknown, empty: string)}
	<div class="block">
		<span class="label">{title}</span>
		{#if value === undefined}
			<span class="label">{empty}</span>
		{:else}
			<Code value={text(value)} lang="json" />
		{/if}
	</div>
{/snippet}

{#if View}
	<View {part} {result} {done} {output} />
{:else}
	<details class="tool">
		<summary class="chip">
			{#if done}<Wrench size={12} strokeWidth={1.75} />{:else}<Spinner />{/if}
			{part.name}
			<span class="chevron"><Chevron size={12} strokeWidth={1.75} /></span>
		</summary>
		<div class="body">
			{@render block('Input', input, '—')}
			{@render block('Output', output, done ? '—' : 'waiting…')}
		</div>
	</details>
{/if}

<style>
	.tool {
		min-width: 0;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.2em 0.6em;
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.8em;
		list-style: none;
		cursor: pointer;
	}

	.chip::-webkit-details-marker {
		display: none;
	}

	.chip:hover {
		color: var(--ink);
	}

	.chevron {
		display: inline-flex;
		transition: transform 120ms ease;
	}

	.tool[open] .chevron {
		transform: rotate(90deg);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		margin-top: 0.5em;
		max-height: 20rem;
		overflow: auto;
		font-size: 0.8em;
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		min-width: 0;
	}

	.label {
		color: var(--muted);
		font-size: 0.9em;
	}
</style>
