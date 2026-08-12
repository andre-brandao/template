<script lang="ts">
	let {
		label,
		value,
		note
	}: { label: string; value: string | number; note?: string } = $props();
</script>

<div class="stat">
	<span class="label">{label}</span>
	<span class="value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
	{#if note}<span class="note">{note}</span>{/if}
</div>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		padding: 0.75em 0.9em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.label {
		font-size: 0.8em;
		color: var(--muted);
	}

	.value {
		font-size: 1.3em;
		font-variant-numeric: tabular-nums;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.note {
		font-size: 0.78em;
		color: var(--dim);
	}
</style>
