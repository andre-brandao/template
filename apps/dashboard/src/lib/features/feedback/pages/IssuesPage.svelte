<!--
	The back office of the feedback drawer: every submission, newest first. State and tag live
	in the URL so a narrowed list can be linked and reloaded.
-->
<script lang="ts">
	import { z } from 'zod';
	import { createQuery } from '@tanstack/svelte-query';
	import { Badge, Empty, Issue, Select, Skeleton, Tabs } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { query } from '$lib/utils/params';
	import { issues } from '../api/feedback.query';
	import Line from '../components/Line.svelte';
	import Lines from '../components/Lines.svelte';
	import { tags, urgencies } from '../labels';

	const params = query(
		z.object({
			state: z.enum(['open', 'closed', 'all']).default('open'),
			tag: z.enum(['', 'bug', 'feature', 'support']).default('')
		})
	);

	const kinds = [
		{ value: '', label: 'All types' },
		...Object.entries(tags).map(([value, one]) => ({ value, label: one.label }))
	];
	const views = [
		{ value: 'open', label: 'Open' },
		{ value: 'closed', label: 'Resolved' },
		{ value: 'all', label: 'All' }
	] as const;

	// The tag filters on the server; state splits the same list here, so the counts stay free.
	const list = createQuery(() => issues(params.tag ? { tag: params.tag } : {}));
	const open = $derived(list.data?.filter((one) => one.state === 'open').length);
	const shown = $derived(
		list.data?.filter((one) => params.state === 'all' || one.state === params.state) ?? []
	);
</script>

<Header.Root title="Feedback">
	<Header.Item label="Open">{open ?? '–'}</Header.Item>
	<Header.Item label="Resolved">{list.data ? list.data.length - (open ?? 0) : '–'}</Header.Item>
	{#snippet strip()}
		<Header.Group>
			<Tabs.Root>
				{#each views as one (one.value)}
					<Tabs.Item
						active={params.state === one.value}
						onclick={() => params.update({ state: one.value === 'open' ? undefined : one.value })}
					>
						{one.label}
					</Tabs.Item>
				{/each}
			</Tabs.Root>
		</Header.Group>
		<Header.Group>
			<Select
				aria-label="Type"
				options={kinds}
				value={params.tag}
				onchange={(e) => params.update({ tag: e.currentTarget.value as typeof params.tag })}
			/>
		</Header.Group>
	{/snippet}
</Header.Root>

{#if list.isPending}
	<Skeleton h="12em" />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if shown.length === 0}
	<Empty>No feedback here.</Empty>
{:else}
	<Lines>
		{#each shown as row (row.id)}
			<Line {row} href="/admin/feedback/{row.id}">
				<Badge tone={urgencies[row.urgency].tone}>{urgencies[row.urgency].label}</Badge>
				<span class="from">{row.from ?? 'No sender'}</span>
			</Line>
		{/each}
	</Lines>
{/if}

<style>
	.from {
		flex: none;
		max-width: 14em;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.85em;
		color: var(--muted, #666);
	}
</style>
