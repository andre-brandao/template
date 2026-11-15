<script lang="ts">
	import type { Event } from '@template/core/event';
	import { Empty } from '@template/ui';
	import { fmt } from '$lib/utils/fmt';

	let { events }: { events: Event.Info[] } = $props();

	const f = fmt();

	// Inbound posts carry the App's own type inside `data`; everything else is a core event.
	const label = (event: Event.Info) =>
		event.type === 'app.received' ? `received ${String(event.data.type)}` : event.type;
</script>

{#if events.length === 0}
	<Empty>Nothing yet.</Empty>
{:else}
	<ol>
		{#each events as event (event.id)}
			<li>
				<code>{label(event)}</code>
				{#if event.identity && 'credential' in event.identity.properties && event.identity.properties.credential}
					<span class="via">via {event.identity.properties.credential}</span>
				{/if}
				<time datetime={event.timeCreated}>{f.date(event.timeCreated)}</time>
			</li>
		{/each}
	</ol>
{/if}

<style>
	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	li {
		display: flex;
		align-items: baseline;
		gap: 0.8em;
		padding: 0.45em 0;
		border-bottom: 1px solid var(--border);
		font-size: 0.85em;
	}

	code {
		font-family: var(--font-mono);
	}

	.via {
		color: var(--dim);
		font-size: 0.9em;
	}

	time {
		margin-left: auto;
		color: var(--dim);
	}
</style>
