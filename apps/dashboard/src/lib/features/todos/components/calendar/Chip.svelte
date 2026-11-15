<!-- One todo on the calendar: a chip, a bar run or an hour block. A press that travels drags it. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Status, type State } from '@template/ui';
	import { color } from '../../status';
	import type { Kind } from './drag.svelte';

	let {
		todo,
		time = '',
		head = true,
		tail = true,
		edge,
		link = false,
		state = 'idle',
		message,
		block = false,
		style = '',
		grab,
		open
	}: {
		todo: Todo.Info;
		time?: string;
		/** This run holds the real start, or the real due; the other ends run on square. */
		head?: boolean;
		tail?: boolean;
		/** Where the due handle sits, if it can be resized. */
		edge?: 'right' | 'bottom';
		/** An anchor where the chip may hold one; inside a day button it stays a span. */
		link?: boolean;
		state?: State;
		message?: string;
		/** Tall hour-grid block: the time sits above the title. */
		block?: boolean;
		style?: string;
		grab: (e: PointerEvent, todo: Todo.Info, kind?: Kind) => void;
		open: (id: string) => void;
	} = $props();

	function click(e: MouseEvent) {
		e.stopPropagation();
		if (e.metaKey || e.ctrlKey || e.shiftKey) return;
		e.preventDefault();
		open(todo.id);
	}
</script>

<svelte:element
	this={link ? 'a' : 'span'}
	href={link ? `/todos/${todo.id}` : undefined}
	draggable="false"
	class={['chip', { head, tail, block, done: todo.status === 'done' }]}
	style:--c={color(todo.status)}
	{style}
	title={todo.title}
	role={link ? undefined : 'presentation'}
	onpointerdown={(e: PointerEvent) => grab(e, todo)}
	onclick={click}
>
	{#if state !== 'idle'}<Status {state} {message} />{/if}
	{#if time}<span class="time">{time}</span>{/if}
	<span class="name">{todo.title}</span>
	{#if edge && tail}
		<span class={['edge', edge]} aria-hidden="true" onpointerdown={(e) => grab(e, todo, 'resize')}
		></span>
	{/if}
</svelte:element>

<style>
	.chip {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.35em;
		min-width: 0;
		height: 1.45em;
		padding: 0 0.4em;
		overflow: hidden;
		border-radius: 0;
		background: color-mix(in oklab, var(--c) 16%, var(--surface));
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--c) 28%, transparent);
		color: var(--ink);
		font-size: 0.78rem;
		line-height: 1;
		text-align: left;
		text-decoration: none;
		white-space: nowrap;
		cursor: grab;
		user-select: none;
		touch-action: none;
	}

	.chip:hover {
		background: color-mix(in oklab, var(--c) 26%, var(--surface));
	}

	.chip:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	/* The status colour rides the leading edge of the run that starts it. */
	.head {
		border-top-left-radius: 4px;
		border-bottom-left-radius: 4px;
		box-shadow:
			inset 2px 0 0 var(--c),
			inset 0 0 0 1px color-mix(in oklab, var(--c) 28%, transparent);
	}

	.tail {
		border-top-right-radius: 4px;
		border-bottom-right-radius: 4px;
	}

	.block {
		flex-direction: column;
		align-items: stretch;
		justify-content: flex-start;
		gap: 0.15em;
		height: 100%;
		padding: 0.25em 0.4em;
		border-radius: 4px;
	}

	.done .name {
		color: var(--dim);
		text-decoration: line-through;
	}

	.time {
		flex: none;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.9em;
		font-variant-numeric: tabular-nums;
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.edge {
		position: absolute;
		z-index: 1;
	}

	.edge.right {
		top: 0;
		right: 0;
		bottom: 0;
		width: 6px;
		cursor: ew-resize;
	}

	.edge.bottom {
		left: 0;
		right: 0;
		bottom: 0;
		height: 6px;
		cursor: ns-resize;
	}

	.edge:hover {
		background: color-mix(in oklab, var(--c) 45%, transparent);
	}
</style>
