<!--
	One dense submission row: state icon, title, type, then `children` and the counts. In a
	narrow list (the drawer) the badges and counts wrap under the title.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Feedback } from '@template/core/feedback';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { fmt } from '#lib/utils/fmt.ts';
	import { states, tags } from '../labels';
	import Mark from './Mark.svelte';

	let {
		row,
		href,
		external = false,
		children
	}: { row: Feedback.Row; href?: string; external?: boolean; children?: Snippet } = $props();

	const f = fmt();
	const state = $derived(states[row.state]);
</script>

<li>
	<svelte:element
		this={href ? 'a' : 'div'}
		class="line"
		{href}
		target={external ? '_blank' : undefined}
		rel={external ? 'noreferrer' : undefined}
	>
		<span
			class="state"
			style:--tone="var(--{state.tone})"
			title={state.label}
			role="img"
			aria-label={state.label}
		>
			<state.icon size={14} strokeWidth={2} aria-hidden="true" />
		</span>
		<span class="title">{row.title}</span>
		<span class="meta">
			<Mark label={tags[row.tag]} />
			{@render children?.()}
			<span class="count" title="Comments">
				<MessageSquare size={12} strokeWidth={1.75} aria-hidden="true" />{row.comments}
			</span>
			<span class="when" title={f.stamp(row.time)}>{f.ago(row.time)}</span>
		</span>
	</svelte:element>
</li>

<style>
	li {
		border-bottom: 1px solid var(--border);
	}

	li:last-child {
		border-bottom: 0;
	}

	.line {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		column-gap: 0.7em;
		row-gap: 0.3em;
		min-height: 2.75em;
		padding: 0.4em 0.8em;
		color: var(--ink);
		font-size: 0.9em;
		text-decoration: none;
	}

	a.line:hover,
	a.line:focus-visible {
		background: var(--hover);
	}

	.state {
		flex: none;
		display: grid;
		color: var(--tone);
	}

	.title {
		flex: 1 1 0;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
	}

	.meta {
		flex: none;
		display: flex;
		align-items: center;
		gap: 0.6em;
		font-size: 0.85em;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
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

	/* Too narrow for one line: the title takes the row, the meta drops under it, aligned. */
	@container (width < 34em) {
		.title {
			flex-basis: calc(100% - 2em);
			white-space: normal;
		}

		.meta {
			flex: 1;
			flex-wrap: wrap;
			padding-left: calc(14px + 0.7em);
		}

		.when {
			min-width: 0;
			margin-left: auto;
		}
	}
</style>
