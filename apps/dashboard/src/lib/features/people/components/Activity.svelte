<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import type { Event } from '@template/sdk/query';
	import { Empty, Issue, Skeleton } from '@template/ui';
	import Pulse from '@lucide/svelte/icons/activity';
	import Inbox from '@lucide/svelte/icons/inbox';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { fmt } from '$lib/utils/fmt';
	import { history } from '../api/people.query';

	let { id }: { id: string } = $props();

	const f = fmt();
	const events = createQuery(() => history(id));

	const icons: Record<string, typeof Pulse> = {
		created: Plus,
		updated: Pencil,
		removed: Trash,
		received: Inbox
	};

	const verb = (event: Event) => event.type.split('.').at(-1) ?? '';

	// Inbound posts carry the App's own type inside `data`; everything else is a core event.
	const label = (event: Event) =>
		event.type === 'app.received'
			? `received ${String(event.data.type)}`
			: `${verb(event)} ${event.source ?? event.type.split('.')[0]}`;

	const subject = (event: Event) => {
		const value = event.data.title ?? event.data.name;
		return typeof value === 'string' ? value : null;
	};

	const via = (event: Event) =>
		event.identity && 'credential' in event.identity.properties
			? event.identity.properties.credential
			: null;
</script>

{#if events.isPending}
	<div class="rows" aria-busy="true">
		{#each { length: 5 }, i (i)}
			<Skeleton h="2.25em" />
		{/each}
	</div>
{:else if events.isError}
	<Issue>{events.error.message}</Issue>
{:else if events.data.length === 0}
	<Empty>Nothing yet. Changes this account makes show up here.</Empty>
{:else}
	<ol class="rows">
		{#each events.data as event (event.id)}
			{@const Icon = icons[verb(event)] ?? Pulse}
			<li title={event.type}>
				<Icon size={14} aria-hidden="true" />
				<span class="what">
					<span>{label(event)}</span>
					{#if subject(event)}<span class="subject">{subject(event)}</span>{/if}
				</span>
				<span class="meta">
					{#if via(event)}<code>{via(event)}</code>{/if}
					<time datetime={event.timeCreated} title={f.stamp(event.timeCreated)}>
						{f.ago(event.timeCreated)}
					</time>
				</span>
			</li>
		{/each}
	</ol>
{/if}

<style>
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	li {
		display: grid;
		grid-template-columns: 1.25em minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.75em;
		min-height: 2.25em;
		padding: 0 0.5em;
		border-radius: var(--radius-sm);
		font-size: 0.85em;
		color: var(--muted);
		transition: background 140ms ease;
	}

	li:hover {
		background: var(--hover);
	}

	.what {
		display: flex;
		align-items: baseline;
		gap: 0.5em;
		min-width: 0;
		white-space: nowrap;
	}

	.subject {
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--ink);
		font-weight: 500;
	}

	.meta {
		display: flex;
		align-items: baseline;
		gap: 0.75em;
		color: var(--dim);
		font-size: 0.9em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	code {
		font-family: var(--font-mono);
	}

	@media (prefers-reduced-motion: reduce) {
		li {
			transition: none;
		}
	}
</style>
