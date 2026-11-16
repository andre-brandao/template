<!-- What the viewer filed, newest first; a row links out when the tracker has a page for it. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Empty, Issue, Skeleton } from '@template/ui';
	import { mine } from '../api/feedback.query';
	import { states } from '../labels';
	import Line from './Line.svelte';
	import Lines from './Lines.svelte';
	import Mark from './Mark.svelte';

	let { onnew }: { onnew: () => void } = $props();

	const list = createQuery(() => mine());
	const open = $derived(list.data?.filter((row) => row.state === 'open').length ?? 0);
</script>

{#if list.isPending}
	<Skeleton h="8em" />
{:else if list.isError}
	<Issue retry={list.refetch}>{list.error.message}</Issue>
{:else if list.data.length === 0}
	<Empty>
		Nothing sent yet. Bugs, ideas and help requests you send show up here, with their status.
		{#snippet action()}<Button onclick={onnew}>Send feedback</Button>{/snippet}
	</Empty>
{:else}
	<p class="sum">
		{open} open, {list.data.length - open} resolved. Replies land on each ticket.
	</p>
	<Lines>
		{#each list.data as row (row.id)}
			<Line {row} href={row.url} external>
				<Mark label={states[row.state]} />
			</Line>
		{/each}
	</Lines>
{/if}

<style>
	.sum {
		margin: 0 0 0.6em;
		font-size: 0.8em;
		color: var(--dim);
	}
</style>
