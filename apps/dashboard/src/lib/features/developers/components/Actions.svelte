<script lang="ts">
	import { Button } from '@template/ui';

	let { close, pending }: { close: () => void; pending: boolean } = $props();
</script>

<div class="actions">
	<Button variant="ghost" onclick={close}>Cancel</Button>
	<Button variant="primary" type="submit" {pending}>Create</Button>
</div>

<style>
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.4em;
	}
</style>
