<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { fmt } from '$lib/utils/fmt';
	import { peek } from '$lib/utils/peek';
	import { color, label, late } from '../../status';

	type Bar = { left: number; width: number };

	let { todo, plan, real }: { todo: Todo.Info; plan: Bar | null; real: Bar | null } = $props();

	const f = fmt();

	const when = (at: string | null) => (at ? f.date(at) : '?');

	const titles = $derived({
		plan: `${label(todo.status)} · ${when(todo.startDate)} → ${when(todo.dueDate)}`,
		real: `Started ${when(todo.timeStarted)}${todo.timeDone ? ` · done ${f.date(todo.timeDone)}` : ''}`
	});
</script>

<div class="row">
	<div class="name">
		<a href="/todos/{todo.id}" onclick={peek({ selected: todo.id })}>{todo.title}</a>
		<small>{todo.assignee?.name ?? 'Unassigned'}</small>
	</div>
	<div class="track">
		{#if plan}
			<span
				class="plan"
				class:late={late(todo)}
				style:left="{plan.left}%"
				style:width="{plan.width}%"
				style:--c={color(todo.status)}
				title={titles.plan}
			></span>
		{/if}
		{#if real}
			<span
				class="real"
				style:left="{real.left}%"
				style:width="{real.width}%"
				style:--c={color(todo.status)}
				title={titles.real}
			></span>
		{/if}
		{#if !plan && !real}
			<span class="undated">no dates</span>
		{/if}
	</div>
</div>

<style>
	.row {
		display: flex;
		align-items: stretch;
		height: var(--h);
	}

	.name {
		position: sticky;
		left: var(--lane);
		z-index: 1;
		flex: 0 0 var(--name);
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.15em;
		padding: 0 0.85rem;
		background: var(--surface);
		box-shadow: inset -1px 0 0 var(--border);
		overflow: hidden;
	}

	.row:hover .name {
		background: var(--surface-2);
	}

	.name a {
		color: var(--ink);
		text-decoration: none;
		font-size: 0.88em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.name a:hover {
		color: var(--accent);
	}

	.name small {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.68em;
	}

	.track {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.plan {
		position: absolute;
		top: calc(var(--h) / 2 - 0.85em);
		height: 0.9em;
		border-radius: 3px;
		background: color-mix(in srgb, var(--c) 28%, transparent);
		border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
	}

	.plan.late {
		background: color-mix(in srgb, var(--danger) 28%, transparent);
		border-color: color-mix(in srgb, var(--danger) 60%, transparent);
	}

	.real {
		position: absolute;
		top: calc(var(--h) / 2 + 0.2em);
		height: 0.35em;
		border-radius: 999px;
		background: var(--c);
	}

	.undated {
		position: absolute;
		left: 0.7em;
		top: 50%;
		transform: translateY(-50%);
		font-family: var(--font-mono);
		font-size: 0.66em;
		color: var(--dim);
	}
</style>
