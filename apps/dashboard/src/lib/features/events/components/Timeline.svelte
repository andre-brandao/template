<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Event } from '@template/core/event';
	import { Empty } from '@template/ui';
	import { getEvents } from '../api/events.remote';
	import { fmt } from '$lib/utils/fmt';

	let {
		source,
		sourceID,
		label,
		title,
		empty = 'No logs yet.'
	}: {
		source: string;
		sourceID: string;
		label: Snippet<[Event.Info]>;
		title?: string;
		empty?: string;
	} = $props();

	const f = fmt();
	const events = $derived((await getEvents({ source, sourceID })).data);
</script>

<div class="timeline">
	{#if title}
		<h2>{title}</h2>
	{/if}

	{#if events.length === 0}
		<Empty>{empty}</Empty>
	{:else}
		<ol>
			{#each events as event (event.id)}
				<li>
					<span class="dot"></span>
					<div class="row">
						<span class="label">{@render label(event)}</span>
						<time class="time" datetime={event.timeCreated}>{f.ago(event.timeCreated)}</time>
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	h2 {
		margin: 0 0 0.75em;
		font-size: 1em;
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		position: relative;
		padding: 0 0 1em 1.1em;
	}

	li:last-child {
		padding-bottom: 0;
	}

	li::before {
		content: '';
		position: absolute;
		left: 3px;
		top: 0.35em;
		bottom: -0.15em;
		width: 1px;
		background: var(--border);
	}

	li:last-child::before {
		display: none;
	}

	.dot {
		position: absolute;
		left: 0;
		top: 0.3em;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px var(--surface);
	}

	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75em;
	}

	.label {
		font-size: 0.9em;
	}

	.time {
		flex: 0 0 auto;
		color: var(--muted);
		font-size: 0.78em;
		font-family: var(--font-mono);
		white-space: nowrap;
	}
</style>
