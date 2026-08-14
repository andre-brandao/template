<script lang="ts">
	let { method }: { method: string } = $props();
</script>

<span data-method={method}>{method}</span>

<style>
	span {
		color: var(--accent);
	}

	span[data-method='POST'],
	span[data-method='PATCH'] {
		color: var(--progress);
	}

	span[data-method='DELETE'] {
		color: var(--danger);
	}
</style>
