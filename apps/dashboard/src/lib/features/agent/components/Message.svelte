<!-- One chat message: the user's bubble, or the agent's markdown and tool calls in order. -->
<script lang="ts">
	import type { UIMessage } from '@tanstack/ai-svelte';
	import { Markdown } from '@template/ui';
	import type { ResultPart } from '../views';
	import Avatar from './Avatar.svelte';
	import Tool from './Tool.svelte';

	let {
		message,
		loading,
		writing = false
	}: { message: UIMessage; loading: boolean; writing?: boolean } = $props();

	const user = $derived(message.role === 'user');

	// Server tools answer with a separate tool-result part instead of completing the call.
	const results = $derived(
		new Map(
			message.parts
				.filter((part): part is ResultPart => part.type === 'tool-result')
				.map((part) => [part.toolCallId, part])
		)
	);

	// The caret rides in the text, so it lands after the last word; it blinks by swapping for
	// a same-width space.
	let lit = $state(true);
	const blink = () => {
		const timer = setInterval(() => (lit = !lit), 530);
		return () => clearInterval(timer);
	};
	const say = (i: number, content: string) =>
		writing && i === message.parts.length - 1 ? `${content}${lit ? ' ▍' : '  '}` : content;
</script>

<li class={{ user }} {@attach writing ? blink : undefined}>
	{#if !user}
		<span class="avatar"><Avatar size={24} state={writing ? 'writing' : 'idle'} /></span>
	{/if}
	<div class="body">
		{#each message.parts as part, i (i)}
			{#if part.type === 'text' && user}
				<p class="bubble">{part.content}</p>
			{:else if part.type === 'text'}
				<div class="text"><Markdown value={say(i, part.content)} /></div>
			{:else if part.type === 'tool-call'}
				<Tool {part} result={results.get(part.id)} {loading} />
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
