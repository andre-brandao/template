<script lang="ts">
	let { tags }: { tags: string[] } = $props();
</script>

{#if tags.length > 0}
	<span class="tags">
		{#each tags as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</span>
{/if}

<style>
	.tags {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.35em;
	}

	.tag {
		border: 1px solid var(--border);
		background: var(--surface-2);
		color: var(--muted);
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.72em;
		padding: 0.2em 0.55em;
	}
</style>
