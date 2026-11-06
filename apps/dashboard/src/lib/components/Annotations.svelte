<script lang="ts">
	/** Backstage-style annotations, read-only. The caller owns the heading. */
	let { annotations }: { annotations: Record<string, string> } = $props();
</script>

<dl>
	{#each Object.entries(annotations) as [key, value] (key)}
		<div>
			<dt>{key}</dt>
			<dd>{value}</dd>
		</div>
	{/each}
</dl>

<style>
	dl {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		font-family: var(--font-mono);
		font-size: 0.78em;
	}

	dt {
		color: var(--dim);
	}

	dd {
		margin: 0.1em 0 0;
		color: var(--muted);
		word-break: break-all;
	}
</style>
