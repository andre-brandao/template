<!-- The list chrome matches Recent's: the rows differ, and each card staying
     self-contained beats extracting presentation coincidence. -->
<!-- fallow-ignore-file code-duplication -->
<script lang="ts">
	import { Empty, Skeleton } from '@template/ui';
	import { getStages } from '../api/todos.remote';
	import { fmt } from '$lib/utils/fmt';

	let { scope, base }: { scope: { source: string; sourceID: string }; base: string } = $props();

	const f = fmt();

	const span = (stage: { start: string | null; end: string | null }) =>
		[stage.start && f.date(stage.start), stage.end && f.date(stage.end)].filter(Boolean).join(' → ');
</script>

<svelte:boundary>
	{#snippet pending()}<Skeleton h="128px" />{/snippet}
	{@const stages = await getStages(scope)}
	{#if stages.length === 0}
		<Empty>No stages yet — give a todo a stage label to start one.</Empty>
	{:else}
		<ul>
			{#each stages as stage (stage.name)}
				<li>
					<a href="{base}?stage={encodeURIComponent(stage.name)}">{stage.name}</a>
					<span class="when">{span(stage) || 'undated'}</span>
					<span class="count">{stage.done}/{stage.total}</span>
					<span class="track">
						<span class="fill" style:width="{(stage.done / stage.total) * 100}%"></span>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</svelte:boundary>

<style>
	/* Shared list chrome with Recent.svelte — the row layouts differ, and keeping
	   each card self-contained is worth the duplicated base rules. */
	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.1em;
		padding: 0;
		margin: 0;
	}

	li {
		display: grid;
		align-items: center;
		grid-template-columns: 1fr auto auto 5em;
		gap: 0.75em;
		padding: 0.6em 0;
		border-top: 1px solid var(--border);
	}

	li:first-child {
		border-top: 0;
	}

	a {
		color: var(--ink);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	a:hover {
		color: var(--accent);
	}

	.when,
	.count {
		font-family: var(--font-mono);
		font-size: 0.72em;
		color: var(--dim);
		white-space: nowrap;
	}

	.track {
		height: 0.5em;
		border-radius: 999px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--done);
	}
</style>
