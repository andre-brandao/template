<!-- What the viewer filed, newest first; a row links out when the tracker has a page for it. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty, Issue, Skeleton } from '@template/ui';
	import { mine } from '../api/feedback.query';
	import Line from './Line.svelte';
	import Lines from './Lines.svelte';

	const list = createQuery(() => mine());
</script>

{#if list.isPending}
	<Skeleton h="8em" />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if list.data.length === 0}
	<Empty>Nothing sent yet.</Empty>
{:else}
	<Lines>
		{#each list.data as row (row.id)}
			<Line {row} href={row.url} external />
		{/each}
	</Lines>
{/if}
