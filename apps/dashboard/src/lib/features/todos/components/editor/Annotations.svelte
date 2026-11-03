<script lang="ts">
	let { annotations }: { annotations: Record<string, string> } = $props();

	const entries = $derived(Object.entries(annotations));
</script>

{#if entries.length}
	<section>
		<h2>Annotations</h2>
		<dl>
			{#each entries as [key, value] (key)}
				<div>
					<dt>{key}</dt>
					<dd>{value}</dd>
				</div>
			{/each}
		</dl>
	</section>
{/if}

<style>
	section {
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid var(--border);
	}

	h2 {
		margin: 0 0 0.6em;
		font-family: var(--font-mono);
		font-size: 0.68em;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dim);
	}

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
