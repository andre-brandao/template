<script lang="ts">
	import { color, label } from '../../status';

	let { rows }: { rows: { status: string; total: number; pct: number }[] } = $props();
</script>

<!-- Plain HTML bars: layerchart's Bars mark infinite-loops on client render (2.0.0-next.66). -->
<div class="bars">
	{#each rows as row (row.status)}
		<span class="name">{label(row.status)}</span>
		<span class="track">
			<span class="bar" style:width="{row.pct}%" style:background={color(row.status)}></span>
		</span>
		<span class="count">{row.total}</span>
	{/each}
</div>

<style>
	.bars {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.6em 0.9em;
	}

	.name {
		font-size: 0.85em;
		color: var(--muted);
	}

	.track {
		height: 1.4em;
		background: var(--surface-2);
		border-radius: 4px;
		overflow: hidden;
	}

	.bar {
		display: block;
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--muted);
		min-width: 2ch;
		text-align: right;
	}
</style>
