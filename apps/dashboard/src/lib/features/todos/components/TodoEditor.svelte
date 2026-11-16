<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Inline, Issue, Skeleton } from '@template/ui';
	import type { Event } from '@template/core/event';
	import { get, link, unlink, update } from '../api/todos.query';
	import Timeline from '#lib/features/events/components/Timeline.svelte';
	import Widgets, { type Widget } from '#lib/components/Widgets.svelte';
	import Links from '#lib/components/Links.svelte';
	import Annotations from '#lib/components/Annotations.svelte';
	import StatusPicker from './StatusPicker.svelte';
	import TagList from './TagList.svelte';
	import Head from './editor/Head.svelte';
	import Description from './editor/Description.svelte';
	import More from './editor/More.svelte';
	import Plan from './editor/Plan.svelte';
	import SubIssues from './editor/SubIssues.svelte';

	let {
		id,
		page = false,
		onremove
	}: {
		id: string;
		/** On its own route: the record header carries every fact, so the body only adds to it. */
		page?: boolean;
		onremove: () => void;
	} = $props();

	const query = createQuery(() => get(id));
	const save = update();
	const attach = link();
	const detach = unlink();

	const labels: Record<string, string> = {
		'todo.created': 'Created',
		'todo.updated': 'Updated',
		'todo.status': 'Status',
		'todo.assigned': 'Assigned',
		'todo.removed': 'Removed'
	};

	function describe(event: Event.Info) {
		const base = labels[event.type] ?? event.type;
		if (event.type === 'todo.status')
			return `${base} → ${event.data.to}${event.data.reason ? ` (${event.data.reason})` : ''}`;
		return base;
	}

	// The drawer has no header, so its facts come back as a Details card.
	const side = $derived.by(() => {
		const notes = Object.keys(query.data?.metadata.annotations ?? {}).length > 0;
		return [
			...(page ? [] : [{ title: 'Details', body: details }]),
			{ title: 'Sub-issues', body: subs },
			{ title: 'Links', body: links },
			...(notes ? [{ title: 'Annotations', body: annotations }] : []),
			{ title: 'History', body: history, fill: true }
		] satisfies Widget[];
	});
</script>

{#snippet description()}
	{#if query.data}
		{#if query.data.tags.length}
			<div class="tags"><TagList tags={query.data.tags} /></div>
		{/if}
		{#if save.error}<Issue>{save.error.message}</Issue>{/if}
		<Description
			todo={query.data}
			pending={save.isPending}
			onsave={(body) => save.mutateAsync({ path: { id }, body: { body: body || null } })}
		/>
	{/if}
{/snippet}

{#snippet details()}
	{#if query.data}<Plan todo={query.data} />{/if}
{/snippet}

{#snippet subs()}
	{#if query.data}<SubIssues todo={query.data} />{/if}
{/snippet}

{#snippet links()}
	{#if query.data}
		<Links
			links={query.data.metadata.links}
			add={(next) => attach.mutateAsync({ path: { id }, body: next })}
			drop={(url) => detach.mutateAsync({ path: { id }, query: { url } })}
		/>
	{/if}
{/snippet}

{#snippet annotations()}
	{#if query.data}<Annotations annotations={query.data.metadata.annotations} />{/if}
{/snippet}

{#snippet history()}
	<Timeline source="todo" sourceID={id}>
		{#snippet label(event)}
			{describe(event)}
		{/snippet}
	</Timeline>
{/snippet}

{#if query.isPending}
	<Skeleton h="320px" />
{:else if query.isError}
	<Issue>{query.error.message}</Issue>
{:else}
	{@const todo = query.data}
	{#if page}
		<Head {todo} {onremove} />
	{:else}
		<!-- Flat, like a page header: the title is the hierarchy, a hairline closes it. -->
		<header class="head">
			<h1>
				<Inline
					label="Todo title"
					required
					value={todo.title}
					onsave={(next) => save.mutateAsync({ path: { id }, body: { title: next } })}
				/>
			</h1>
			<div class="actions">
				<StatusPicker {todo} />
				<More {todo} {onremove} />
			</div>
		</header>
	{/if}

	<Widgets main={{ title: 'Description', body: description }} {side} />
{/if}

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6em 0.9em;
		margin-bottom: 1em;
		padding-bottom: 1em;
		border-bottom: 1px solid var(--border);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex: none;
	}

	/* The drawer is narrow: the title takes its own line, status and ⋯ sit under it. */
	h1 {
		flex: 1 1 100%;
		min-width: 0;
		margin: 0;
		font-size: 1.4em;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.tags {
		margin-bottom: 0.75em;
	}
</style>
