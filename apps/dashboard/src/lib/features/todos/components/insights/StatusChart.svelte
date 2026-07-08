<script lang="ts">
	import { color, label } from '../../status';

	let { counts }: { counts: Record<string, number> } = $props();

	const entries = $derived(Object.entries(counts));
	const max = $derived(Math.max(1, ...entries.map(([, total]) => total)));
</script>

<!-- Plain HTML bars: layerchart's Bars mark infinite-loops on client render (2.0.0-next.66). -->
<div class="bars">
	{#each entries as [status, total] (status)}
		<span class="name">{label(status)}</span>
		<span class="track">
			<span class="bar" style:width="{(total / max) * 100}%" style:background={color(status)}></span>
		</span>
		<span class="count">{total}</span>
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
