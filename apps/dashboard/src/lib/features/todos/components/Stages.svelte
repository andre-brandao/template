<!-- The list chrome matches Recent's: the rows differ, and each card staying
     self-contained beats extracting presentation coincidence. -->
<!-- fallow-ignore-file code-duplication -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty, Inline, Issue, Skeleton } from '@template/ui';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { rename, stages } from '../api/todos.query';
	import { fmt } from '$lib/utils/fmt';

	let { scope, base }: { scope: { source: string; sourceID: string }; base: string } = $props();

	const f = fmt();
	const query = createQuery(() => stages(scope));
	const save = rename();
	// The stage being renamed; Inline owns the draft and its Status dot.
	let editing = $state<string>();

	const span = (stage: { start: string | null; end: string | null }) =>
		[stage.start && f.date(stage.start), stage.end && f.date(stage.end)].filter(Boolean).join(' → ');
</script>

{#if query.isPending}
	<Skeleton h="128px" />
{:else if query.isError}
	<Issue>{query.error.message}</Issue>
{:else if query.data.length === 0}
	<Empty>No stages yet — give a todo a stage label to start one.</Empty>
{:else}
	<ul>
		{#each query.data as stage (stage.name)}
			<li>
				{#if editing === stage.name}
					<div class="edit" onfocusout={() => (editing = undefined)} {@attach (el) => el.querySelector('button')?.focus()}>
						<Inline
							label="Stage name"
							value={stage.name}
							onsave={(to) => save.mutateAsync({ body: { from: stage.name, to, ...scope } })}
						/>
					</div>
				{:else}
					<span class="name">
						<a href="{base}?stage={encodeURIComponent(stage.name)}">{stage.name}</a>
						<button
							class="rename"
							type="button"
							aria-label="Rename {stage.name}"
							disabled={save.isPending}
							onclick={() => (editing = stage.name)}><Pencil size={12} strokeWidth={1.75} /></button
						>
					</span>
				{/if}
				<span class="when">{span(stage) || 'undated'}</span>
				<span class="count">{stage.done}/{stage.total}</span>
				<span class="track">
					<span class="fill" style:width="{(stage.done / stage.total) * 100}%"></span>
				</span>
			</li>
		{/each}
	</ul>
{/if}

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

	.name {
		display: flex;
		align-items: center;
		gap: 0.4em;
		min-width: 0;
	}

	.edit {
		margin: -0.2em -0.4em;
	}

	.rename {
		display: grid;
		place-items: center;
		padding: 0.2em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--dim);
		cursor: pointer;
		opacity: 0;
		transition: opacity 140ms ease;
	}

	li:hover .rename,
	.rename:focus-visible {
		opacity: 1;
	}

	.rename:hover {
		color: var(--ink);
	}

	@media (hover: none) {
		.rename {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rename {
			transition: none;
		}
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
