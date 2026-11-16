<script lang="ts">
	import ProjectPage from '#lib/features/projects/pages/ProjectPage.svelte';
	import Stages from '#lib/features/todos/components/Stages.svelte';
	import Recent from '#lib/features/todos/components/Recent.svelte';
	import Summary from '#lib/features/todos/components/Summary.svelte';

	let { params } = $props();
</script>

<!-- `params` is empty mid-navigation, and the page would query with an undefined id. -->
{#if params.id}
	{@const scope = { source: 'project', sourceID: params.id }}
	{#snippet facts()}
		<Summary {scope} />
	{/snippet}
	{#snippet stages()}
		<Stages {scope} base="/projects/{params.id}/todos" />
	{/snippet}
	{#snippet todos()}
		<Recent {scope} />
	{/snippet}
	<ProjectPage
		id={params.id}
		{facts}
		widgets={{
			main: { title: 'Stages', body: stages },
			side: [{ title: 'Recent todos', body: todos }]
		}}
	/>
{/if}
