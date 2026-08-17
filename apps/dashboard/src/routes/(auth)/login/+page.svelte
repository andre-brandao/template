<script lang="ts">
	import LoginPage from '$lib/features/auth/pages/LoginPage.svelte';

	let { data } = $props();
</script>

<LoginPage oauth={data.oauth} />
