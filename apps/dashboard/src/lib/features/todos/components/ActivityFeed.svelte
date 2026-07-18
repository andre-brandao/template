<script lang="ts">
	import type { Event } from '@template/core/event';

	let { events }: { events: Event.Info[] } = $props();

	const labels: Record<string, string> = {
		'todo.created': 'Created',
		'todo.updated': 'Updated',
		'todo.closed': 'Closed',
		'todo.reopened': 'Reopened',
		'todo.removed': 'Removed'
	};

	function label(event: Event.Info) {
		const base = labels[event.type] ?? event.type;
		if (event.type !== 'todo.closed') return base;
		const reason = event.data.reason;
		if (reason === 'completed') return `${base} as completed`;
		if (reason === 'not_planned') return `${base} as not planned`;
		return base;
	}

	function time(event: Event.Info) {
		return new Date(event.timeCreated).toLocaleString();
	}
</script>

<div class="feed">
	<h2>Activity</h2>
	{#if events.length === 0}
		<p class="empty">No activity yet.</p>
	{:else}
		<ul>
			{#each events as event (event.id)}
				<li>
					<span class="label">{label(event)}</span>
					<span class="time">{time(event)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	h2 {
		margin: 0 0 0.6em;
		font-size: 1em;
	}

	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 0;
		margin: 0;
	}

	li {
		display: flex;
		justify-content: space-between;
		gap: 0.75em;
		padding: 0.6em 0;
		border-top: 1px solid var(--border);
	}

	li:first-child {
		border-top: 0;
		padding-top: 0;
	}

	.time {
		color: var(--muted);
		font-size: 0.9em;
	}

	.empty {
		margin: 0;
		color: var(--muted);
	}
</style>
