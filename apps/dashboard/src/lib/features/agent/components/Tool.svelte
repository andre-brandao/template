<!-- A tool call: its page view when one is registered, else a chip that opens on its I/O. -->
<script lang="ts">
	import { Code, Spinner } from '@template/ui';
	import Wrench from '@lucide/svelte/icons/wrench';
	import { views } from '../agent.svelte';
	import type { CallPart, ResultPart } from '../views';

	let { calls, done }: { calls: { part: CallPart; result?: ResultPart }[]; done: boolean } =
		$props();

	// Custom views are never grouped, so they always get the first call.
	const first = $derived(calls[0]!);
	const View = $derived(views.get(first.part.name));

	// Server tools send JSON strings; anything that doesn't parse passes through.
	function parse(value: unknown) {
		if (typeof value !== 'string') return value;
		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	}

	const output = (call: (typeof calls)[number]) =>
		call.result ? parse(call.result.content) : call.part.output;

	const input = (part: CallPart) => (part.input !== undefined ? part.input : parse(part.arguments));

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
	<View part={first.part} result={first.result} {done} output={output(first)} />
{:else}
	<details class="tool">
		<summary class="chip">
			{#if done}<Wrench size={12} strokeWidth={1.75} />{:else}<Spinner />{/if}
			{first.part.name}
			{#if calls.length > 1}<span class="count">×{calls.length}</span>{/if}
		</summary>
		<div class="body">
			{#each calls as call (call.part.id)}
				{@render block('Input', input(call.part), '—')}
				{@render block('Output', output(call), done ? '—' : 'waiting…')}
			{/each}
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

	.count {
		opacity: 0.7;
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
