<!-- One chat message: the user's turn, or the agent's markdown and tool calls in order. -->
<script lang="ts">
	import type { UIMessage } from '@tanstack/ai-svelte';
	import { Issue, Markdown } from '@template/ui';
	import type { ResultPart } from '../views';
	import Tool from './Tool.svelte';

	let {
		message,
		loading,
		writing = false
	}: { message: UIMessage; loading: boolean; writing?: boolean } = $props();

	const user = $derived(message.role === 'user');

	type Card = Extract<UIMessage['parts'][number], { type: 'subagent' }>;

	// Server tools answer with a separate tool-result part instead of completing the call.
	const collect = (parts: UIMessage['parts']) =>
		new Map(
			parts
				.filter((part): part is ResultPart => part.type === 'tool-result')
				.map((part) => [part.toolCallId, part])
		);
	const results = $derived(collect(message.parts));
</script>

<!-- What a subagent did, under the tool call that started it; a reload keeps only the call. -->
{#snippet steps(part: Card)}
	{@const busy = loading && part.subagent.status === 'running'}
	<details class="steps" open={busy}>
		<summary>{part.subagent.name}{busy ? '' : ` · ${part.subagent.status}`}</summary>
		{#each part.subagent.messages as item (item.id)}
			{@const found = collect(item.parts)}
			{#each item.parts as one, j (j)}
				{#if one.type === 'text'}
					<div class="text"><Markdown value={one.content} /></div>
				{:else if one.type === 'tool-call'}
					<Tool part={one} result={found.get(one.id)} loading={busy} />
				{:else if one.type === 'subagent'}
					{@render steps(one)}
				{/if}
			{/each}
		{/each}
	</details>
	{#if part.subagent.error}<Issue>{part.subagent.error.message}</Issue>{/if}
{/snippet}

<!-- No mark per message: the header's is the one that shows activity. -->
<li>
	<div class="body">
		{#each message.parts as part, i (i)}
			{#if part.type === 'text' && user}
				<p class="turn">{part.content}</p>
			{:else if part.type === 'text'}
				<div class="text">
					<Markdown value={part.content} caret={writing && i === message.parts.length - 1} />
				</div>
			{:else if part.type === 'tool-call'}
				<Tool {part} result={results.get(part.id)} {loading} />
			{:else if part.type === 'subagent'}
				{@render steps(part)}
			{/if}
		{/each}
	</div>
</li>

<style>
	li {
		min-width: 0;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		min-width: 0;
	}

	.text {
		min-width: 0;
		overflow-x: auto;
		overflow-wrap: anywhere;
	}

	.steps {
		display: grid;
		gap: 0.5em;
		min-width: 0;
		padding-left: 0.75em;
		border-left: 1px solid var(--border);
	}

	.steps summary {
		color: var(--muted);
		font-size: 0.8em;
		cursor: pointer;
	}

	/* The reader's own turn: muted and ruled, left like everything else. */
	.turn {
		margin: 0;
		padding: 0.1em 0 0.1em 0.75em;
		border-left: 2px solid var(--border);
		color: var(--muted);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
</style>
