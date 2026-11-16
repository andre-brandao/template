<!--
	The back office of the feedback drawer: every submission, newest first. State and tag live
	in the URL so a narrowed list can be linked and reloaded.
-->
<script lang="ts">
	import { z } from 'zod';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Feedback } from '@template/core/feedback';
	import { Combobox, Empty, Issue, Skeleton, Tabs } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import { query } from '#lib/utils/params.ts';
	import { issues } from '../api/feedback.query';
	import Line from '../components/Line.svelte';
	import Lines from '../components/Lines.svelte';
	import Mark from '../components/Mark.svelte';
	import { tags, urgencies } from '../labels';

	const kinds = ['bug', 'feature', 'support'] as const satisfies readonly Feedback.Row['tag'][];

	const params = query(
		z.object({
			state: z.enum(['open', 'closed', 'all']).default('open'),
			// Repeated params: `?tag=bug&tag=support`.
			tag: z.array(z.enum(kinds)).default([])
		})
	);
	const views = [
		{ value: 'open', label: 'Open' },
		{ value: 'closed', label: 'Resolved' },
		{ value: 'all', label: 'All' }
	] as const;

	// One list, split here by state and type, so every count stays free.
	const list = createQuery(() => issues({}));
	const typed = $derived(
		list.data?.filter((one) => !params.tag.length || params.tag.includes(one.tag))
	);
	const open = $derived(typed?.filter((one) => one.state === 'open').length);
	const viewed = $derived(
		list.data?.filter((one) => params.state === 'all' || one.state === params.state) ?? []
	);
	const shown = $derived(
		viewed.filter((one) => !params.tag.length || params.tag.includes(one.tag))
	);
	const count = (tag: string) => viewed.filter((one) => one.tag === tag).length;
</script>

<Header.Root title="Feedback">
	<Header.Item label="Open">{open ?? '–'}</Header.Item>
	<Header.Item label="Resolved">{typed ? typed.length - (open ?? 0) : '–'}</Header.Item>
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
		<Header.Group label="Type">
			<Combobox
				items={[...kinds]}
				key={(one) => one}
				text={(one) => tags[one].label}
				multiple
				bind:values={
					() => params.tag,
					(next) => params.update({ tag: kinds.filter((one) => next.includes(one)) })
				}
				label="Type"
				placeholder="Filter types"
			>
				{#snippet trigger()}<span class="any">All types</span>{/snippet}
				{#snippet chip(one)}
					{tags[one].label}<span class="count">{count(one)}</span>
				{/snippet}
				{#snippet item(one, row)}
					{@const tag = tags[one]}
					<span class="tone" style:--tone="var(--{tag.tone})"
						><tag.icon size={13} strokeWidth={2} aria-hidden="true" /></span
					>
					<span class="name">{@render row.marked(tag.label)}</span>
					<span class="count">{count(one)}</span>
				{/snippet}
			</Combobox>
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
			<Line {row} href="/settings/feedback/{row.id}">
				<Mark label={urgencies[row.urgency]} />
				<span class="from">{row.from ?? 'No sender'}</span>
			</Line>
		{/each}
	</Lines>
{/if}

<style>
	.any {
		color: var(--muted);
	}

	.tone {
		display: grid;
		color: var(--tone);
	}

	.name {
		flex: 1;
	}

	.count {
		color: var(--dim);
		font-variant-numeric: tabular-nums;
	}

	.from {
		flex: none;
		max-width: 14em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.85em;
		color: var(--muted);
	}
</style>
