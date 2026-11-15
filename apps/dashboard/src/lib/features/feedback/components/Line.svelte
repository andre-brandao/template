<!-- One dense submission row: state dot, title, type, then `children` and the counts. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Feedback } from '@template/core/feedback';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { Badge } from '@template/ui';
	import { fmt } from '$lib/utils/fmt';
	import { states, tags } from '../labels';

	let {
		row,
		href,
		external = false,
		children
	}: { row: Feedback.Row; href?: string; external?: boolean; children?: Snippet } = $props();

	const f = fmt();
</script>

<li>
	<svelte:element
		this={href ? 'a' : 'div'}
		class="line"
		{href}
		target={external ? '_blank' : undefined}
		rel={external ? 'noreferrer' : undefined}
	>
		<span class={['dot', row.state]} title={states[row.state].label}></span>
		<span class="title">{row.title}</span>
		<Badge tone={tags[row.tag].tone}>{tags[row.tag].label}</Badge>
		{@render children?.()}
		<span class="meta count" title="Comments">
			<MessageSquare size={12} strokeWidth={1.75} aria-hidden="true" />{row.comments}
		</span>
		<span class="meta when" title={f.stamp(row.time)}>{f.ago(row.time)}</span>
	</svelte:element>
</li>

<style>
	li {
		border-bottom: 1px solid var(--border, #ddd);
	}

	li:last-child {
		border-bottom: 0;
	}

	.line {
		display: flex;
		align-items: center;
		gap: 0.7em;
		min-height: 2.75em;
		padding: 0.3em 0.8em;
		color: var(--ink, #111);
		font-size: 0.9em;
		text-decoration: none;
	}

	a.line:hover,
	a.line:focus-visible {
		background: var(--hover, #f2f2f2);
	}

	/* Open is in flight, resolved is done: the board's own stage colours. */
	.dot {
		flex: none;
		width: 0.5em;
		height: 0.5em;
		border-radius: 50%;
		background: var(--progress, #3b82f6);
	}

	.dot.closed {
		background: var(--done, #3fa66b);
	}

	.title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
	}

	.meta {
		flex: none;
		font-size: 0.85em;
		font-variant-numeric: tabular-nums;
		color: var(--muted, #666);
	}

	.count {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}

	.when {
		min-width: 4.5em;
		text-align: right;
	}
</style>
