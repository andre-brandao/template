<script lang="ts">
	import WelcomePage from '$lib/features/auth/pages/WelcomePage.svelte';

	let { data } = $props();
</script>

<WelcomePage email={data.email} />
