<!-- "New todo" at the pointer for an empty calendar spot: a title, due on that day. -->
<script lang="ts">
	import { Button, Input, Popover, Status, format, fromDay, type Day } from '@template/ui';
	import { user } from '$lib/utils/context';
	import { fmt } from '$lib/utils/fmt';
	import { create } from '../../api/todos.query';

	let {
		scope,
		onmore
	}: {
		scope: { source?: string; sourceID?: string };
		/** Hands the day to the full form, for a todo that needs more than a title. */
		onmore: (day: Day) => void;
	} = $props();

	const me = user();
	const f = fmt();
	const save = create({ onSuccess: () => pop?.close() });

	let pop: Popover | undefined = $state();
	let day: Day | undefined = $state();
	let title = $state('');

	export function open(to: Day, at: { x: number; y: number }) {
		day = to;
		title = '';
		save.reset();
		pop?.show(at);
	}

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!day || !title.trim()) return;
		save.mutate({
			body: {
				title: title.trim(),
				dueDate: fromDay(day, f.zone),
				source: scope.source,
				sourceID: scope.sourceID
			}
		});
	}
</script>

<Popover bind:this={pop} label="New todo">
	{#if day}
		{@const on = day}
		<form class="quick" onsubmit={submit}>
			<p>
				New todo · {format(on, me.prefs.locale, { weekday: 'short', month: 'short', day: 'numeric' })}
				<Status
					state={save.isPending ? 'pending' : save.isError ? 'failed' : 'idle'}
					message={save.error?.message}
				/>
			</p>
			<Input name="title" aria-label="Title" placeholder="What needs doing?" autofocus bind:value={title} />
			<div class="foot">
				<Button
					variant="ghost"
					onclick={() => {
						pop?.close();
						onmore(on);
					}}>More options</Button
				>
				<Button variant="primary" type="submit" disabled={!title.trim() || save.isPending}
					>Add</Button
				>
			</div>
		</form>
	{/if}
</Popover>

<style>
	.quick {
		display: grid;
		gap: 0.5rem;
		width: 17rem;
		padding: 0.3rem;
	}

	p {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin: 0;
		color: var(--muted);
		font-size: 0.78rem;
		font-weight: 500;
	}

	.foot {
		display: flex;
		justify-content: space-between;
	}
</style>
