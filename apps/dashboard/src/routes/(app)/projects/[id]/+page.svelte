<script lang="ts">
	import * as Header from '$lib/components/header';
	import ProjectPage from '$lib/features/projects/pages/ProjectPage.svelte';
	import Stages from '$lib/features/todos/components/Stages.svelte';
	import Recent from '$lib/features/todos/components/Recent.svelte';
	import { getStages, getTodos } from '$lib/features/todos/api/todos.remote';

	let { params } = $props();

	const today = new Date().toISOString().slice(0, 10);
</script>

<!--
	`params` is `page.params`, which swaps to the *next* route's params the moment a
	navigation (or a hover-preload fork) starts — while async Svelte keeps this page
	mounted until that route resolves. Without the guard the page re-queries with
	`id: undefined`, which the remote function rejects on every attempt.
-->
{#if params.id}
	{@const scope = { source: 'project', sourceID: params.id }}
	<ProjectPage id={params.id}>
		{#snippet facts()}
			<!-- The same cached queries Stages and Recent read, so the facts cost no extra trip. -->
			{@const todos = await getTodos(scope)}
			{@const stages = await getStages(scope)}
			{@const stage =
				stages.find((one) => one.start && one.end && one.start.slice(0, 10) <= today && today <= one.end.slice(0, 10)) ??
				stages.find((one) => one.done < one.total)}
			<Header.Item label="Todos">
				{todos.length >= 100 ? '100+' : todos.length}
				<span class="muted">{todos.filter((one) => one.status !== 'done').length} open</span>
			</Header.Item>
			{#if stage}
				<Header.Item label="Stage">
					{stage.name}
					<span class="muted">{stage.done}/{stage.total} done</span>
				</Header.Item>
			{/if}
		{/snippet}
		{#snippet stages()}
			<Stages {scope} base="/projects/{params.id}/todos" />
		{/snippet}
		{#snippet todos()}
			<Recent {scope} />
		{/snippet}
	</ProjectPage>
{/if}

<style>
	.muted {
		font-weight: 400;
		color: var(--muted);
	}
</style>
