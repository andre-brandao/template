<!--
	One submission read back: the sender's text as written, the files they attached, then the
	replies under it on the tracker.
-->
<script lang="ts">
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { Badge, Empty, Markdown, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { fmt } from '$lib/utils/fmt';
	import { getIssue } from '../api/feedback.remote';
	import Image from '../components/Image.svelte';
	import { states, tags, urgencies } from '../labels';

	let { id }: { id: number } = $props();

	const f = fmt();
</script>

{#snippet back()}<a href="/admin/feedback">Feedback</a>{/snippet}

<svelte:boundary>
	{@const issue = await getIssue(id)}
	<Header.Root title={issue.title} eyebrow={back}>
		{#snippet actions()}
			{#if issue.url}
				<a class="open" href={issue.url} target="_blank" rel="noreferrer">
					<ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" /> Open on tracker
				</a>
			{/if}
		{/snippet}
		<Header.Item label="Type">
			<Badge tone={tags[issue.tag].tone}>{tags[issue.tag].label}</Badge>
		</Header.Item>
		<Header.Item label="Urgency">
			<Badge tone={urgencies[issue.urgency].tone}>{urgencies[issue.urgency].label}</Badge>
		</Header.Item>
		<Header.Item label="State">
			<Badge tone={states[issue.state].tone}>{states[issue.state].label}</Badge>
		</Header.Item>
		<Header.Item label="From"><b>{issue.from ?? 'No sender'}</b></Header.Item>
		<Header.Item label="Opened">
			<span title={f.stamp(issue.time)}>{f.ago(issue.time)}</span>
		</Header.Item>
		<Header.Item label="Comments"><b class="num">{issue.comments}</b></Header.Item>
	</Header.Root>

	<div class="column">
		<!-- The attachments ride inside the body as markdown links and images. -->
		<section class="block">
			<h2>Description</h2>
			<Markdown value={issue.text} components={{ img: Image }} />
		</section>

		<section class="block">
			<h2>Replies</h2>
			{#if issue.replies.length === 0}
				<Empty>No replies.</Empty>
			{:else}
				<ol class="replies">
					{#each issue.replies as one (one.id)}
						<li>
							<p class="when" title={f.stamp(one.time)}>{f.ago(one.time)}</p>
							<Markdown value={one.body} components={{ img: Image }} />
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	</div>

	{#snippet pending()}
		<Header.Root title="Feedback" eyebrow={back} />
		<Skeleton h="480px" />
	{/snippet}

	{#snippet failed()}
		<Header.Root title="Feedback" eyebrow={back} />
		<Empty>
			Feedback not found.
			{#snippet action()}<a class="return" href="/admin/feedback">Back to feedback</a>{/snippet}
		</Empty>
	{/snippet}
</svelte:boundary>

<style>
	.num {
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}

	/* An `<a>` in the shape of a secondary button: `Button` has no href. */
	.open {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		min-height: 2.25em;
		padding: 0.35em 0.85em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		box-shadow: var(--shadow-1);
		color: var(--ink);
		font-size: 0.93em;
		font-weight: 500;
		text-decoration: none;
		white-space: nowrap;
	}

	.open:hover {
		background: var(--surface-2);
	}

	.column {
		display: grid;
		gap: 1em;
		max-width: 56em;
	}

	.block {
		min-width: 0;
		padding: 1.1em 1.25em 1.25em;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0 0 0.9em;
		font-size: 0.92em;
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
