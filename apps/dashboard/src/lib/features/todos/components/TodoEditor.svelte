<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Card, Inline, Issue, Section, Skeleton } from '@template/ui';
	import type { Event } from '@template/core/event';
	import { get, link, unlink, update } from '../api/todos.query';
	import Timeline from '#lib/features/events/components/Timeline.svelte';
	import StatusPill from './StatusPill.svelte';
	import StatusPicker from './StatusPicker.svelte';
	import TagList from './TagList.svelte';
	import Head from './editor/Head.svelte';
	import Facts from './editor/Facts.svelte';
	import Description from './editor/Description.svelte';
	import Delete from './Delete.svelte';
	import Plan from './editor/Plan.svelte';
	import SubIssues from './editor/SubIssues.svelte';
	import Links from '#lib/components/Links.svelte';
	import Annotations from '#lib/components/Annotations.svelte';
	import { color } from '../status';

	let {
		id,
		page = false,
		onremove
	}: {
		id: string;
		/** On its own route: the record header with facts, instead of the drawer's compact head. */
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
</script>

{#if query.isPending}
	<Skeleton h="320px" />
{:else if query.isError}
	<Issue>{query.error.message}</Issue>
{:else}
	{@const todo = query.data}
	{#if page}<Head {todo} />{/if}

	<div class="editor">
		<div class="grid">
			<div class="main">
				{#if !page}
					<!-- Flat, like a page header: the title is the hierarchy, a hairline closes it. -->
					<header class="head">
						<h1>
							<Inline
								label="Title"
								value={todo.title}
								onsave={(next) => save.mutateAsync({ path: { id }, body: { title: next } })}
							/>
						</h1>
						<div class="pills">
							<StatusPill status={todo.status} reason={todo.reason} />
						</div>
					</header>
				{/if}

				<!-- fallow-ignore-next-line code-duplication -->
				<Card accent={color(todo.status)}>
					<TagList tags={todo.tags} />

					{#if save.error}
						<Issue>{save.error.message}</Issue>
					{/if}

					<Description
						{todo}
						pending={save.isPending}
						onsave={(body) => save.mutateAsync({ path: { id }, body: { body: body || null } })}
					/>
				</Card>

				<SubIssues {todo} />
			</div>

			<aside class="side">
				<Card>
					<Facts {todo} />
					<Plan {todo} />

					<div class="actions">
						<StatusPicker {todo} />
						<Delete {id} title={todo.title} ondone={onremove}>
							{#snippet children(ask, deleting)}
								<Button variant="danger" pending={deleting} onclick={ask}>Delete</Button>
							{/snippet}
						</Delete>
					</div>
				</Card>

				<Card>
					<Section wide title="Links">
						<Links
							links={todo.metadata.links}
							add={(next) => attach.mutateAsync({ path: { id }, body: next })}
							drop={(url) => detach.mutateAsync({ path: { id }, query: { url } })}
						/>
					</Section>
					{#if Object.keys(todo.metadata.annotations).length}
						<Section wide divider title="Annotations">
							<Annotations annotations={todo.metadata.annotations} />
						</Section>
					{/if}
				</Card>
			</aside>

			<div class="logs">
				<Timeline source="todo" sourceID={todo.id} title="Logs">
					{#snippet label(event)}
						{describe(event)}
					{/snippet}
				</Timeline>
			</div>
		</div>
	</div>
{/if}

<style>
	/* The editor sizes its columns off its own box, not the viewport, so the same
	   component reads two-column on the detail page and single-column in the drawer. */
	.editor {
		container-type: inline-size;
	}

	.grid {
		display: grid;
		grid-template-areas: 'main' 'side' 'logs';
		gap: 1.25em;
	}

	.main {
		grid-area: main;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25em;
	}

	.side {
		grid-area: side;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25em;
	}

	.logs {
		grid-area: logs;
		min-width: 0;
	}

	/* Golden ratio: prose column to meta rail at φ : 1. */
	@container (min-width: 46rem) {
		.grid {
			grid-template-columns: 1.618fr 1fr;
			grid-template-areas: 'main side' 'logs side';
			align-items: start;
		}
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.9em;
		padding-bottom: 1em;
		border-bottom: 1px solid var(--border);
	}

	.pills {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex: none;
	}

	h1 {
		margin: 0;
		font-size: 1.4em;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid var(--border);
	}
</style>
