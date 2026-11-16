<!--
	One submission read back: the sender's text as written, the files they attached, then the
	replies under it on the tracker.
-->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { Empty, Markdown, Skeleton } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import { fmt } from '#lib/utils/fmt.ts';
	import { issue } from '../api/feedback.query';
	import Image from '../components/Image.svelte';
	import Mark from '../components/Mark.svelte';
	import { states, tags, urgencies } from '../labels';

	let { id }: { id: number } = $props();

	const one = createQuery(() => issue(id));
	const f = fmt();
</script>

{#snippet back()}<a href="/settings/feedback">Feedback</a>{/snippet}

{#if one.isPending}
	<Header.Root title="Feedback" eyebrow={back} />
	<Skeleton h="24em" />
{:else if one.isError}
	<Header.Root title="Feedback" eyebrow={back} />
	<Empty>
		{one.error.message}
		{#snippet action()}<a class="return" href="/settings/feedback">Back to feedback</a>{/snippet}
	</Empty>
{:else}
	{@const row = one.data}
	<Header.Root title={row.title} eyebrow={back}>
		{#snippet actions()}
			{#if row.url}
				<a class="open" href={row.url} target="_blank" rel="noreferrer">
					<ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" /> Open on tracker
				</a>
			{/if}
		{/snippet}
		<Header.Item label="Type">
			<Mark label={tags[row.tag]} />
		</Header.Item>
		<Header.Item label="Urgency">
			<Mark label={urgencies[row.urgency]} />
		</Header.Item>
		<Header.Item label="State">
			<Mark label={states[row.state]} />
		</Header.Item>
		<Header.Item label="From">{row.from ?? 'No sender'}</Header.Item>
		<Header.Item label="Opened">
			<span title={f.stamp(row.time)}>{f.ago(row.time)}</span>
		</Header.Item>
	</Header.Root>

	<div class="column">
		<!-- The attachments ride inside the body as markdown links and images. -->
		<section class="block">
			<h2>Description</h2>
			<Markdown value={row.text} components={{ img: Image }} />
		</section>

		<section class="block">
			<h2>Replies</h2>
			{#if row.replies.length === 0}
				<Empty>No replies.</Empty>
			{:else}
				<ol class="replies">
					{#each row.replies as reply (reply.id)}
						<li>
							<p class="when" title={f.stamp(reply.time)}>{f.ago(reply.time)}</p>
							<Markdown value={reply.body} components={{ img: Image }} />
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	</div>
{/if}

<style>
	/* An `<a>` in the shape of a secondary button: `Button` has no href. */
	.open {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		min-height: 2em;
		padding: 0.3em 0.75em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		font-size: 0.9em;
		font-weight: 500;
		text-decoration: none;
		white-space: nowrap;
	}

	.open:hover {
		background: var(--hover);
	}

	.column {
		display: grid;
		gap: 1em;
		max-width: 56em;
	}

	.block {
		min-width: 0;
		padding: 1em 1.15em;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0 0 0.8em;
		font-size: 0.9em;
		font-weight: 600;
	}

	.replies {
		display: grid;
		gap: 1em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.replies li {
		min-width: 0;
		padding-top: 1em;
		border-top: 1px solid var(--border);
	}

	.replies li:first-child {
		padding-top: 0;
		border-top: none;
	}

	.when {
		margin: 0 0 0.4em;
		font-size: 0.78em;
		color: var(--dim);
	}

	.return {
		color: var(--accent);
		font-size: 0.9em;
	}
</style>
