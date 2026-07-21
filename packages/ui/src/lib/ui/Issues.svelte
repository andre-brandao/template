<script lang="ts">
	let { of }: { of?: readonly { readonly message: string }[] } = $props();
</script>

{#each of ?? [] as issue, i (i)}
	<p>{issue.message}</p>
{/each}

<style>
	p {
		margin: 0 0 0.5em;
		color: var(--danger, crimson);
		font-size: 0.85em;
	}
</style>
