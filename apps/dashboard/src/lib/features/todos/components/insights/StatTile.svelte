<script lang="ts">
	let {
		label,
		value,
		hint,
		tone = 'default'
	}: { label: string; value: string; hint?: string; tone?: 'default' | 'danger' } = $props();
</script>

<div class="tile">
	<span class="label">{label}</span>
	<span class="value" class:danger={tone === 'danger'}>{value}</span>
	{#if hint}<span class="hint">{hint}</span>{/if}
</div>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		padding: 1em 1.1em;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.label {
		font-family: var(--font-mono);
		font-size: 0.72em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.value {
		font-size: 1.7em;
		font-weight: 600;
		line-height: 1.1;
	}

	.value.danger {
		color: var(--danger);
	}

	.hint {
		font-size: 0.8em;
		color: var(--dim);
	}
</style>
