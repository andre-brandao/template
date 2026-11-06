<!--
	The agent's drawer: header, conversation or history, and the composer. Declares the page
	tools: navigate and refresh, ask, and for admins panel.
-->
<script lang="ts">
	import { Scroll } from '@template/ui';
	import { user } from '$lib/utils/context';
	import { agent, pageTools } from '../agent.svelte';
	import { ask } from '../ask/tool';
	import AskView from '../ask/View.svelte';
	import { builtins } from '../page';
	import { panel } from '../panel/tool';
	import PanelView from '../panel/View.svelte';
	import Composer from './Composer.svelte';
	import Header from './Header.svelte';
	import HistoryList from './History.svelte';
	import Thread from './Thread.svelte';

	const ctx = agent();

	pageTools(builtins());
	pageTools([ask()], { ask: AskView });
	if (user().can({ admin: ['read'] })) pageTools([panel()], { panel: PanelView });
</script>

<section class={['root', { full: ctx.full }]}>
	<Header />
	{#if ctx.tab === 'history'}
		<Scroll fill><HistoryList /></Scroll>
	{:else}
		{#if ctx.chat.messages.length}
			<Thread />
		{:else}
			<div class="empty">
				<h2>How can I help?</h2>
				<p>Ask about your projects and todos, or about what is on this page.</p>
			</div>
		{/if}
		<Composer />
	{/if}
</section>

<style>
	.root {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		min-width: 0;
		background: var(--surface);
		color: var(--ink);
	}

	/* Fullscreen keeps a readable centred column; children pad by it. */
	.full {
		--gutter: max(1em, calc((100% - 48rem) / 2));
	}

	.empty {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		padding: 1.5em 1.25em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 1.25em;
	}

	p {
		margin: 0;
		color: var(--muted);
		font-size: 0.9em;
	}
</style>
