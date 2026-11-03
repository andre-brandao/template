<!-- What the viewer filed, newest first; a row links out when the tracker has a page for it. -->
<script lang="ts">
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { Badge, Empty } from '@template/ui';
	import { fmt } from '$lib/utils/fmt';
	import { getMine } from '../api/feedback.remote';
	import { states, tags } from '../labels';

	const f = fmt();
</script>

{#snippet row(item: Awaited<ReturnType<typeof getMine>>[number])}
	<span class="title">{item.title}</span>
	<span class="meta">
		<Badge tone={tags[item.tag].tone}>{tags[item.tag].label}</Badge>
		<Badge tone={states[item.state].tone}>{states[item.state].label}</Badge>
		<span>{f.ago(item.time)}</span>
		<span class="count"><MessageSquare size={12} strokeWidth={1.75} />{item.comments}</span>
	</span>
{/snippet}

<svelte:boundary>
	{@const items = await getMine()}
	{#if items.length === 0}
		<Empty>Nothing sent yet.</Empty>
	{:else}
		<ul>
			{#each items as item (item.id)}
				<li>
					{#if item.url}
						<a class="row" href={item.url} target="_blank" rel="noreferrer">{@render row(item)}</a>
					{:else}
						<div class="row">{@render row(item)}</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#snippet pending()}
		<p class="loading">Loading…</p>
	{/snippet}
</svelte:boundary>

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		padding: 0.6em 0.7em;
		border-radius: var(--radius);
		color: var(--ink);
		text-decoration: none;
	}

	a.row:hover {
		background: var(--surface-2);
	}

	.title {
		font-size: 0.9em;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;
		font-size: 0.78em;
		color: var(--muted);
	}

	.count {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
	}

	.loading {
		margin: 0;
		font-size: 0.85em;
		color: var(--muted);
	}
</style>
