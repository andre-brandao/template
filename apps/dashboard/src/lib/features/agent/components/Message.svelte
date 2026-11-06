<!-- One chat message: the user's bubble, or the agent's markdown and tool calls in order. -->
<script lang="ts">
	import type { UIMessage } from '@tanstack/ai-svelte';
	import { Markdown } from '@template/ui';
	import { views } from '../agent.svelte';
	import { group } from '../transcript';
	import type { CallPart, ResultPart } from '../views';
	import Avatar from './Avatar.svelte';
	import Tool from './Tool.svelte';

	let {
		message,
		loading,
		writing = false
	}: { message: UIMessage; loading: boolean; writing?: boolean } = $props();

	const custom = (name: string) => views.has(name);

	const finished = (call: { part: CallPart; result?: ResultPart }) =>
		!loading || !!call.result || call.part.state === 'complete' || call.part.state === 'error';

	const items = $derived(group(message.parts, custom, finished));
	const last = $derived(items.at(-1)?.key);

	// The caret rides in the text, so it lands after the last word; it blinks by swapping for
	// a same-width space.
	let lit = $state(true);
	const blink = () => {
		const timer = setInterval(() => (lit = !lit), 530);
		return () => clearInterval(timer);
	};
</script>

<li class={message.role} {@attach writing ? blink : undefined}>
	{#if message.role !== 'user'}
		<span class="avatar"><Avatar size={24} state={writing ? 'writing' : 'idle'} /></span>
	{/if}
	<div class="body">
		{#each items as item (item.key)}
			{#if item.part.type === 'text' && message.role === 'user'}
				<p class="bubble">{item.part.content}</p>
			{:else if item.part.type === 'text'}
				<div class="text">
					<Markdown
						value={writing && item.key === last
							? `${item.part.content}${lit ? ' ▍' : '  '}`
							: item.part.content}
					/>
				</div>
			{:else if item.part.type === 'tool-call'}
				<Tool calls={item.calls} done={item.done} />
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
