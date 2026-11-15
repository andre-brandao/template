<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import TagList from '../TagList.svelte';
	import StatusPicker from '../StatusPicker.svelte';
	import Assignee from '../Assignee.svelte';
	import Day from '../Day.svelte';
	import Title from '../Title.svelte';
	import Actions from '../Actions.svelte';
	import Delete from '../Delete.svelte';
	import { color } from '../../status';

	let { todo }: { todo: Todo.Info } = $props();

	let renaming = $state(false);
	let actions: Actions | undefined = $state();
</script>

<Delete id={todo.id} title={todo.title}>
	{#snippet children(ask, deleting)}
		<article
			class={['card', { deleting }]}
			aria-busy={deleting}
			style:--c={color(todo.status)}
			oncontextmenu={(e) => actions?.at(e)}
		>
			<div class="head">
				<div class="main"><Title {todo} bind:renaming busy={deleting} /></div>
				<Actions bind:this={actions} {todo} {deleting} {ask} onrename={() => (renaming = true)} />
			</div>
			{#if todo.stage || todo.tags.length}
				<div class="tags">
					{#if todo.stage}<span class="stage">{todo.stage}</span>{/if}
					<TagList tags={todo.tags} />
				</div>
			{/if}
			<div class="meta">
				<StatusPicker {todo} compact />
				<span class="end">
					<Day {todo} />
					<Assignee {todo} />
				</span>
			</div>
		</article>
	{/snippet}
</Delete>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.45em;
		padding: 0.55em 0.6em 0.45em 0.75em;
		border: 1px solid var(--border);
		border-left: 2px solid var(--c);
		border-radius: var(--radius-sm);
		background: var(--surface);
		transition:
			border-color 140ms ease,
			opacity 140ms ease;
	}

	.card:hover,
	.card:focus-within {
		--dots: 1;
		border-color: var(--border-bright);
		border-left-color: var(--c);
	}

	.deleting {
		opacity: 0.55;
		pointer-events: none;
	}

	.head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.4em;
		margin-right: -0.3em;
	}

	.main {
		min-width: 0;
	}

	.tags {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4em;
	}

	.stage {
		border: 1px solid var(--border-bright);
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-size: 0.72em;
		padding: 0.1em 0.45em;
	}

	.meta,
	.end {
		display: flex;
		align-items: center;
	}

	.meta {
		justify-content: space-between;
		margin-left: -0.35em;
		font-size: 0.82em;
	}

	.end {
		gap: 0.4em;
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			transition: none;
		}
	}
</style>
