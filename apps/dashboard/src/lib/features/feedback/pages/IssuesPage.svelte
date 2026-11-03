<!--
	The back office of the feedback drawer: every submission, newest first. State and tag live
	in the URL so a narrowed list can be linked and reloaded.
-->
<script lang="ts">
	import { z } from 'zod';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { Badge, Card, Empty, Select, Skeleton, Tabs } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { fmt } from '$lib/utils/fmt';
	import { query } from '$lib/utils/params';
	import { getIssues } from '../api/feedback.remote';
	import { states, tags, urgencies } from '../labels';

	const params = query(
		z.object({
			state: z.enum(['open', 'closed', 'all']).default('open'),
			tag: z.enum(['', 'bug', 'feature', 'support']).default('')
		})
	);

	const f = fmt();
	const kinds = [
		{ value: '', label: 'All types' },
		...Object.entries(tags).map(([value, one]) => ({ value, label: one.label }))
	];
	// The tag filters on the server; state splits the same list here, so the counts stay free.
	const filter = $derived(params.tag ? { tag: params.tag } : {});

	// `open` is the default, so it leaves the URL rather than being spelled out.
	const pick = (state: typeof params.state) =>
		params.update({ state: state === 'open' ? undefined : state });
</script>

<Header.Root title="Feedback">
	<svelte:boundary>
		{@const issues = await getIssues(filter)}
		{@const open = issues.filter((one) => one.state === 'open').length}
		<Header.Item label="Open"><b class="num">{open}</b></Header.Item>
		<Header.Item label="Closed"><b class="num">{issues.length - open}</b></Header.Item>
		{#snippet pending()}
			<Header.Item label="Open"><Skeleton h="1.2em" w="2em" /></Header.Item>
			<Header.Item label="Closed"><Skeleton h="1.2em" w="2em" /></Header.Item>
		{/snippet}
	</svelte:boundary>
	{#snippet strip()}
		<Header.Group>
			<Tabs.Root>
				<Tabs.Item active={params.state === 'open'} onclick={() => pick('open')}>Open</Tabs.Item>
				<Tabs.Item active={params.state === 'closed'} onclick={() => pick('closed')}>Closed</Tabs.Item>
				<Tabs.Item active={params.state === 'all'} onclick={() => pick('all')}>All</Tabs.Item>
			</Tabs.Root>
		</Header.Group>
		<Header.Group>
			<Select
				aria-label="Type"
				options={kinds}
				value={params.tag}
				onchange={(e) => params.update({ tag: e.currentTarget.value as typeof params.tag })}
				style="width: 12em"
			/>
		</Header.Group>
	{/snippet}
</Header.Root>

<svelte:boundary>
	{@const issues = await getIssues(filter)}
	{@const list = issues.filter((one) => params.state === 'all' || one.state === params.state)}
	{#if list.length === 0}
		<Empty>No feedback here.</Empty>
	{:else}
		<ul class="list">
			{#each list as row (row.id)}
				<li>
					<Card href="/admin/feedback/{row.id}" interactive dense>
						<div class="top">
							<span class="title">{row.title}</span>
							<span class="count" title="Comments">
								<MessageSquare size={12} strokeWidth={1.75} aria-hidden="true" />{row.comments}
							</span>
						</div>
						<div class="meta">
							<Badge tone={tags[row.tag].tone}>{tags[row.tag].label}</Badge>
							<Badge tone={states[row.state].tone}>{states[row.state].label}</Badge>
							<Badge tone={urgencies[row.urgency].tone}>{urgencies[row.urgency].label}</Badge>
							<span>{row.from ?? 'No sender'}</span>
							<span class="sep" aria-hidden="true">·</span>
							<span title={f.stamp(row.time)}>{f.ago(row.time)}</span>
						</div>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}

	{#snippet pending()}
		<div class="list">
			<Skeleton h="4.2em" />
			<Skeleton h="4.2em" />
			<Skeleton h="4.2em" />
		</div>
	{/snippet}
</svelte:boundary>

<style>
	.num {
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		margin: 0;
		padding: 0;
		list-style: none;
		max-width: 56em;
	}

	.top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75em;
	}

	.title {
		min-width: 0;
		font-weight: 500;
	}

	.count {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		font-size: 0.8em;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em 0.5em;
		margin-top: 0.45em;
		font-size: 0.8em;
		color: var(--muted);
	}

	.sep {
		color: var(--dim);
	}
</style>
