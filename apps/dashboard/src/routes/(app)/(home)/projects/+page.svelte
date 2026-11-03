<script lang="ts">
	import ProjectsPage from '$lib/features/projects/pages/ProjectsPage.svelte';
	import Import from '$lib/features/github/components/Import.svelte';
</script>

<ProjectsPage />

<div class="github">
	<Import />
</div>

<style>
	.github {
		margin-top: 2em;
	}
</style>
