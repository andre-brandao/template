<script lang="ts">
	import ProjectPage from '$lib/features/projects/pages/ProjectPage.svelte';

	let { params } = $props();
</script>

<ProjectPage id={params.id} />
