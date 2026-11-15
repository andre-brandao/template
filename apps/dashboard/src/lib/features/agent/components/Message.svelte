<!-- One chat message: the user's bubble, or the agent's markdown and tool calls in order. -->
<script lang="ts">
	import type { UIMessage } from '@tanstack/ai-svelte';
	import { Issue, Markdown } from '@template/ui';
	import type { ResultPart } from '../views';
	import Avatar from './Avatar.svelte';
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

<li class={{ user }}>
	<!-- Still: the header's mark is the one that shows activity. -->
	{#if !user}
		<span class="avatar"><Avatar size={24} /></span>
	{/if}
	<div class="body">
		{#each message.parts as part, i (i)}
			{#if part.type === 'text' && user}
				<p class="bubble">{part.content}</p>
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
		display: flex;
		gap: 0.65em;
		min-width: 0;
	}

	.body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.5em;
		min-width: 0;
	}

	li.user .body {
		align-items: flex-end;
	}

	/* Lines the mark up with the first line of text. */
	.avatar {
		display: inline-flex;
		flex: none;
		margin-top: 0.05em;
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

	.bubble {
		max-width: 85%;
		margin: 0;
		padding: 0.55em 0.8em;
		border-radius: var(--radius);
		background: var(--surface-2);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
</style>
