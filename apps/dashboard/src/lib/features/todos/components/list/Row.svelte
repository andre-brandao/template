<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import TagList from '../TagList.svelte';
	import StatusPicker from '../StatusPicker.svelte';
	import Assignee from '../Assignee.svelte';
	import Day from '../Day.svelte';
	import Title from '../Title.svelte';
	import Actions from '../Actions.svelte';
	import Delete from '../Delete.svelte';

	let { todo, depth = 0 }: { todo: Todo.Info; depth?: number } = $props();

	let renaming = $state(false);
	let actions: Actions | undefined = $state();
</script>

<Delete id={todo.id} title={todo.title}>
	{#snippet children(ask, deleting)}
		<li
			class={['row', { deleting }]}
			aria-busy={deleting}
			style:--depth={depth}
			oncontextmenu={(e) => actions?.at(e)}
		>
			<StatusPicker {todo} compact />
			<div class="main">
				<Title {todo} bind:renaming busy={deleting} />
			</div>
			<span class="meta">
				{#if todo.stage}<span class="stage">{todo.stage}</span>{/if}
				<TagList tags={todo.tags} />
				<Day {todo} />
				<Assignee {todo} />
			</span>
			<Actions bind:this={actions} {todo} {deleting} {ask} onrename={() => (renaming = true)} />
		</li>
	{/snippet}
</Delete>

<style>
	.row {
		position: relative;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.6em;
		min-height: 2.6em;
		padding: 0.2em 0.4em 0.2em calc(0.5em + var(--depth) * 1.5em);
		border-bottom: 1px solid var(--border);
		transition:
			background 140ms ease,
			opacity 140ms ease;
	}

	.row:hover,
	.row:focus-within {
		--dots: 1;
		background: var(--hover);
	}

	.deleting {
		opacity: 0.55;
		pointer-events: none;
	}

	.main {
		min-width: 0;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.6em;
		color: var(--dim);
		font-size: 0.82em;
		white-space: nowrap;
	}

	.stage {
		border: 1px solid var(--border-bright);
		border-radius: var(--radius-sm);
		color: var(--muted);
		padding: 0.05em 0.45em;
	}

	@media (max-width: 600px) {
		.stage,
		.meta :global(.tags) {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row {
			transition: none;
		}
	}
</style>
