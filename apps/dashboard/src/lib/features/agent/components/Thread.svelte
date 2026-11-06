<!-- The open conversation: its messages, what the agent is doing, and the last error. -->
<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { Scroll } from '@template/ui';
	import { agent } from '../agent.svelte';
	import Avatar from './Avatar.svelte';
	import Message from './Message.svelte';

	const ctx = agent();
	const activity = $derived(ctx.activity);

	// Re-runs on every streamed chunk, keeping the newest content in view.
	const follow: Attachment<HTMLElement> = (el) => {
		if (!ctx.chat.messages.length && !ctx.chat.error) return;
		el.scrollIntoView({ block: 'nearest' });
	};
</script>

<Scroll fill>
	<ol>
		{#each ctx.chat.messages as item, i (item.id)}
			<Message
				message={item}
				loading={ctx.chat.isLoading}
				writing={activity.state === 'writing' && i === ctx.chat.messages.length - 1}
			/>
		{/each}
		{#if activity.state === 'thinking'}
			<li class="thinking">
				<Avatar size={24} state="thinking" />
				{activity.tool ? `Running ${activity.tool}…` : 'Thinking…'}
			</li>
		{/if}
	</ol>
	{#if ctx.chat.error}
		<p class="error">{ctx.chat.error.message}</p>
	{/if}
	<div {@attach follow}></div>
</Scroll>

<style>
	ol {
		display: flex;
		flex-direction: column;
		gap: 1em;
		min-width: 0;
		margin: 0;
		padding: 1em var(--gutter, 1em);
		list-style: none;
		font-size: 0.9em;
	}

	.thinking {
		display: inline-flex;
		align-items: center;
		gap: 0.65em;
		color: var(--muted);
		font-size: 0.85em;
	}

	.error {
		margin: 0 1em 1em;
		color: var(--danger);
		font-size: 0.85em;
	}
</style>
