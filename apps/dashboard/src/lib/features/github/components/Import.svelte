<script lang="ts">
	import { Button, Drawer } from '@template/ui';
	import ImportBoard from './ImportBoard.svelte';
	import Mark from '$lib/components/GithubMark.svelte';

	let open = $state(false);
</script>

<Button variant="secondary" onclick={() => (open = true)}><Mark /> Import GitHub project</Button>

<Drawer bind:open>
	<ImportBoard onsuccess={() => (open = false)} />
</Drawer>
