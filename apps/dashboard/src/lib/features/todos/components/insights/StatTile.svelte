<script lang="ts">
	let {
		label,
		value,
		hint,
		delta,
		unit = '%',
		tone = 'default'
	}: {
		label: string;
		value: string;
		hint?: string;
		delta?: number;
		unit?: string;
		tone?: 'default' | 'danger';
	} = $props();
</script>

<div class="tile">
	<span class="label">{label}</span>
	<span class="value" class:danger={tone === 'danger'}>{value}</span>
	<div class="foot">
		{#if hint}<span class="hint">{hint}</span>{/if}
		{#if delta !== undefined}
			<span
				class="delta"
				aria-label="{delta > 0 ? 'Increased' : delta < 0 ? 'Decreased' : 'Unchanged'} by {Math.abs(
					delta
				)}{unit} compared with the selected period"
			>
				{delta > 0 ? '↑' : delta < 0 ? '↓' : '→'}
				{Math.abs(delta)}{unit}
			</span>
		{/if}
	</div>
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
		font-size: 0.86em;
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

	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		min-height: 1em;
	}

	.delta {
		color: var(--muted);
		font-size: 0.78em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
