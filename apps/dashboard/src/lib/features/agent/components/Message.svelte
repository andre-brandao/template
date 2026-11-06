<!-- One chat message: the user's bubble, or the agent's markdown and tool calls in order. -->
<script lang="ts">
	import type { UIMessage } from '@tanstack/ai-svelte';
	import { Markdown } from '@template/ui';
	import { views } from '../agent.svelte';
	import { group } from '../transcript';
	import type { CallPart, ResultPart } from '../views';
	import Tool from './Tool.svelte';

	let { message, loading }: { message: UIMessage; loading: boolean } = $props();

	const custom = (name: string) => views.has(name);

	const finished = (call: { part: CallPart; result?: ResultPart }) =>
		!loading || !!call.result || call.part.state === 'complete' || call.part.state === 'error';

	const items = $derived(group(message.parts, custom, finished));
</script>

<li class={message.role}>
	{#each items as item (item.key)}
		{#if item.part.type === 'text' && message.role === 'user'}
			<p class="bubble">{item.part.content}</p>
		{:else if item.part.type === 'text'}
			<div class="text"><Markdown value={item.part.content} /></div>
		{:else if item.part.type === 'tool-call'}
			<Tool calls={item.calls} done={item.done} />
		{/if}
	{/each}
</li>

<style>
	li {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		min-width: 0;
	}

	li.user {
		align-items: flex-end;
	}

	.text {
		min-width: 0;
		overflow-x: auto;
		overflow-wrap: anywhere;
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
