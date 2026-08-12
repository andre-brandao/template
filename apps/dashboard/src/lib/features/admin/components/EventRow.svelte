<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { Event } from '@template/core/event';
	import Avatar from '$lib/components/Avatar.svelte';
	import { fmt } from '$lib/utils/fmt';

	let { row, onuser }: { row: Event.Info; onuser: (id: string) => void } = $props();

	const f = fmt();

	// `data` is free-form jsonb and every type carries a different shape, so it is shown
	// verbatim rather than guessed at. Everything else about the entry is already a column.
	const raw = $derived(JSON.stringify(row.data, null, 2));
	const empty = $derived(Object.keys(row.data).length === 0);

	// `actor:*` is what the who column already renders, so showing it again is noise.
	const tags = $derived(row.tags.filter((tag) => !tag.startsWith('actor:')));

	// The actor is a filter, not a disclosure — cancel the click so it doesn't also toggle
	// the row it happens to sit inside.
	function filter(event: MouseEvent, id: string) {
		event.preventDefault();
		event.stopPropagation();
		onuser(id);
	}
</script>

<li>
	<details>
		<summary>
			<ChevronRight class="mark" size={14} strokeWidth={2} />
			<span class="type">{row.type}</span>

			<span class="who">
				{#if row.user}
					<button type="button" onclick={(e) => filter(e, row.user!.id)} title="Filter to this user">
						<Avatar name={row.user.name} image={row.user.image} size={20} />
						{row.user.name}
					</button>
				{:else}
					<!-- No user means a system or public actor; the tag on the row says which. -->
					<span class="none">{row.tags.find((tag) => tag.startsWith('actor:')) ?? 'system'}</span>
				{/if}
			</span>

			<span class="tags">
				{#each tags as tag (tag)}
					<span class="tag">{tag}</span>
				{/each}
			</span>

			<span class="ref">
				{#if row.sourceID}{row.source} · {row.sourceID}{/if}
			</span>

			<time datetime={row.timeCreated} title={f.stamp(row.timeCreated)}>
				{f.ago(row.timeCreated)}
			</time>
		</summary>

		{#if empty}
			<p class="none data">This entry carries no data.</p>
		{:else}
			<pre>{raw}</pre>
		{/if}
	</details>
</li>

<style>
	li {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: 0.88em;
	}

	summary {
		display: grid;
		grid-template-columns: auto 11em 11em minmax(0, 1fr) minmax(0, 1fr) auto;
		align-items: center;
		gap: 1em;
		padding: 0.55em 0.9em;
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary:hover {
		background: var(--surface-2);
		border-radius: var(--radius);
	}

	:global(.mark) {
		color: var(--dim);
		transition: transform 120ms ease;
	}

	details[open] :global(.mark) {
		transform: rotate(90deg);
	}

	details[open] summary {
		border-bottom: 1px solid var(--border);
		border-radius: var(--radius) var(--radius) 0 0;
	}

	.type {
		font-family: var(--font-mono);
		font-size: 0.9em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.who button {
		display: flex;
		align-items: center;
		gap: 0.45em;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.who button:hover {
		text-decoration: underline;
	}

	.none,
	.ref {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--dim);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Clipped rather than wrapped — a row with a dozen tags must not be taller than its
	   neighbours; the expanded JSON carries the full list. */
	.tags {
		display: flex;
		gap: 0.3em;
		min-width: 0;
		overflow: hidden;
	}

	.tag {
		padding: 0.1em 0.5em;
		border-radius: 999px;
		background: var(--surface-2);
		font-size: 0.8em;
		color: var(--muted);
		white-space: nowrap;
	}

	time {
		color: var(--dim);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.data {
		margin: 0;
		padding: 0.9em;
	}

	pre {
		margin: 0;
		padding: 0.9em;
		max-height: 22em;
		overflow: auto;
		font-family: var(--font-mono);
		font-size: 0.8em;
		line-height: 1.5;
		color: var(--muted);
		tab-size: 2;
	}

	@media (max-width: 70em) {
		summary {
			grid-template-columns: auto 11em 11em minmax(0, 1fr) auto;
		}

		.ref {
			display: none;
		}
	}

	@media (max-width: 55em) {
		summary {
			grid-template-columns: auto 1fr auto;
		}

		.tags {
			display: none;
		}
	}
</style>
