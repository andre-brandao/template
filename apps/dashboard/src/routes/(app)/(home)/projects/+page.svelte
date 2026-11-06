<script lang="ts">
	import ProjectsPage from '$lib/features/projects/pages/ProjectsPage.svelte';
	import Import from '$lib/features/github/components/Import.svelte';
</script>

<ProjectsPage>
	{#snippet extra()}<Import />{/snippet}
</ProjectsPage>
