<!-- The open conversation: its messages, what the agent is doing, and the last error. -->
<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { Button, Issue, Scroll, Spinner } from '@template/ui';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { agent } from '../agent.svelte';
	import Message from './Message.svelte';

	const ctx = agent();
	const activity = $derived(ctx.activity);

	// What a running tool reads as; anything else shows its own name.
	const labels: Record<string, string> = {
		sql: 'Querying the database',
		sql_tables: 'Reading the schema',
		ask: 'Preparing questions',
		panel: 'Building a panel',
		draft: 'Checking the panel',
		show: 'Drawing the panel',
		navigate: 'Opening the page',
		refresh: 'Refreshing the page'
	};

	// Gateway errors lead with their status; the known ones read as what the user can do.
	function plain(text: string) {
		if (/^40[13]\b/.test(text))
			return "The assistant isn't configured: the model gateway refused its key.";
		if (/^(429|5\d\d)\b/.test(text))
			return 'The model is busy or unavailable. Try again in a moment.';
		return text;
	}

	// Follows the stream only while the reader sits at the bottom; scrolling up lets them read.
	// Resize runs before intersection in a frame, so growth scrolls before `pinned` can flip.
	const follow: Attachment<HTMLElement> = (el) => {
		const end = el.lastElementChild as HTMLElement;
		let pinned = true;
		const seen = new IntersectionObserver(([one]) => (pinned = one.isIntersecting), {
			rootMargin: '0px 0px 48px 0px'
		});
		const grown = new ResizeObserver(() => pinned && end.scrollIntoView({ block: 'nearest' }));
		seen.observe(end);
		grown.observe(el);
		return () => {
			seen.disconnect();
			grown.disconnect();
		};
	};
</script>

<Scroll fill>
	<div {@attach follow}>
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
					<Spinner />
					{activity.tool ? `${labels[activity.tool] ?? activity.tool}…` : 'Thinking…'}
				</li>
			{/if}
		</ol>
		{#if ctx.chat.error}
			<div class="error" role="alert">
				<Issue>{plain(ctx.chat.error.message)}</Issue>
				<Button variant="ghost" onclick={() => ctx.chat.reload()}>
					<RotateCcw size={14} strokeWidth={1.75} />
					Retry
				</Button>
			</div>
		{/if}
		<div class="end"></div>
	</div>
</Scroll>

<style>
	ol {
		display: flex;
		flex-direction: column;
		gap: 0.85em;
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
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;
		margin: 0 var(--gutter, 1em) 1em;
	}

	.end {
		height: 1px;
	}
</style>
