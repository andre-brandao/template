<script lang="ts">
	import { page } from '$app/state';
	import InvitePage from '$lib/features/org/pages/InvitePage.svelte';
</script>

<InvitePage token={page.params.token!} />
