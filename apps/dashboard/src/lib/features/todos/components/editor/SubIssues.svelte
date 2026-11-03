<script lang="ts">
	import Issues from '$lib/components/Issues.svelte';
	import { resets } from '$lib/utils/form';
	import { Button, Card, Input } from '@template/ui';
	import type { Todo } from '@template/core/todo';
	import { createTodo, getTodo, getTodos } from '../../api/todos.remote';
	import StatusPicker from '../StatusPicker.svelte';
	import { peek } from '$lib/utils/peek';

	let { todo }: { todo: Todo.Info } = $props();

	const add = $derived(createTodo.for(`${todo.id}:sub`));
	const kids = $derived(getTodos({ parentID: todo.id, sort: ['position'] }));
</script>

<Card>
	{#if todo.parentID}
		{@const parent = await getTodo(todo.parentID)}
		<p class="parent">
			Sub-issue of <a href="/todos/{parent.id}">{parent.title}</a>
		</p>
	{/if}

	{@const list = await kids}
	<div class="head">
		<h2>Sub-issues</h2>
		{#if list.length}
			<span class="count">
				{list.filter((kid) => kid.status === 'done').length}/{list.length}
			</span>
		{/if}
	</div>

	<ul>
		{#each list as kid (kid.id)}
			<li>
				<StatusPicker todo={kid} compact />
				<a href="/todos/{kid.id}" onclick={peek({ selected: kid.id })}>{kid.title}</a>
			</li>
		{/each}
	</ul>

	<Issues issues={add.fields.allIssues()} />

	<form
		class="add"
		{...add.enhance(resets(() => kids.refresh()))}
	>
		<input {...add.fields.parentID.as('hidden', todo.id)} />
		<Input placeholder="Add a sub-issue" {...add.fields.title.as('text')} />
		<Button type="submit" variant="secondary" pending={!!add.pending}>Add</Button>
	</form>
</Card>

<style>
	.parent {
		margin: 0 0 0.75em;
		font-size: 0.85em;
		color: var(--muted);
	}

	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	h2 {
		margin: 0;
		font-size: 1em;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.8em;
		color: var(--muted);
	}

	ul {
		list-style: none;
		margin: 0.6em 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.6em;
	}

	li a {
		color: var(--ink);
		text-decoration: none;
	}

	li a:hover {
		color: var(--accent);
	}

	.add {
		display: flex;
		gap: 0.5em;
	}
</style>
