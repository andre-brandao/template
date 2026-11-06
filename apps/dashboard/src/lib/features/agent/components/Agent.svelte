<!--
	The agent's drawer: header, conversation or history, and the composer. Declares the page
	tools: navigate and refresh, ask, and for admins panel.
-->
<script lang="ts">
	import { Scroll } from '@template/ui';
	import FolderKanban from '@lucide/svelte/icons/folder-kanban';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import Help from '@lucide/svelte/icons/circle-question-mark';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import History from '@lucide/svelte/icons/history';
	import { user } from '$lib/utils/context';
	import { agent, pageTools } from '../agent.svelte';
	import { ask } from '../ask/tool';
	import AskView from '../ask/View.svelte';
	import { builtins } from '../page';
	import { panel } from '../panel/tool';
	import PanelView from '../panel/View.svelte';
	import Avatar from './Avatar.svelte';
	import Composer from './Composer.svelte';
	import Header from './Header.svelte';
	import HistoryList from './History.svelte';
	import Thread from './Thread.svelte';

	const ctx = agent();
	const admin = user().can({ admin: ['read'] });

	pageTools(builtins());
	pageTools([ask()], { ask: AskView });
	if (admin) pageTools([panel()], { panel: PanelView });

	// Starters for an empty thread; a click sends the text as is.
	const cards = [
		{
			icon: FolderKanban,
			title: 'Projects in progress',
			sub: 'Status and progress of active projects',
			text: 'Which projects are in progress, and how far along is each?'
		},
		{
			icon: ListChecks,
			title: 'My open todos',
			sub: 'What is on my plate, by due date',
			text: 'What are my open todos, ordered by due date?'
		},
		{
			icon: Help,
			title: 'What can I do here?',
			sub: 'Actions available on this page',
			text: 'What can you do on this page?'
		},
		...(admin
			? [
					{
						icon: ChartColumn,
						title: 'Build a panel',
						sub: 'Interviews you and proposes metrics',
						text: 'I want to build a panel from the data in the system. Help me pick the metrics.'
					}
				]
			: [])
	];
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
				<span class="mark"><Avatar size={56} state={ctx.activity.state} /></span>
				<h2>How can I help?</h2>
				<p>Ask about your projects and todos, or about what is on this page.</p>
				<div class="cards">
					{#each cards as item (item.title)}
						<button class="card" type="button" onclick={() => ctx.send(item.text)}>
							<item.icon size={17} strokeWidth={1.75} />
							<span>
								<strong>{item.title}</strong>
								<small>{item.sub}</small>
							</span>
						</button>
					{/each}
				</div>
				<button class="past" type="button" onclick={() => (ctx.tab = 'history')}>
					<History size={15} strokeWidth={1.75} />
					Past conversations
				</button>
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

	/* `safe` centring and no shrinking: in a short dock it scrolls instead of overlapping. */
	.empty {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: safe center;
		min-height: 0;
		padding: 1.5em var(--gutter, 1.25em);
		overflow-y: auto;
	}

	.empty > * {
		flex-shrink: 0;
	}

	.mark {
		display: flex;
		margin-bottom: 0.9em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 1.25em;
	}

	p {
		margin: 0 0 1.25em;
		color: var(--muted);
		font-size: 0.9em;
		line-height: 1.45;
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.card {
		display: flex;
		align-items: flex-start;
		gap: 0.75em;
		min-width: 0;
		padding: 0.75em 0.85em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: none;
		color: var(--muted);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.card:hover {
		background: var(--hover);
		color: var(--ink);
	}

	.card span {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 0;
	}

	.card strong {
		color: var(--ink);
		font-size: 0.9em;
		font-weight: 500;
	}

	.card small {
		font-size: 0.8em;
	}

	.past {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		margin-top: 1em;
		padding: 0.55em 0.75em;
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		background: none;
		color: var(--muted);
		font: inherit;
		font-size: 0.82em;
		cursor: pointer;
	}

	.past:hover {
		border-style: solid;
		background: var(--hover);
		color: var(--ink);
	}

	.card:focus-visible,
	.past:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
