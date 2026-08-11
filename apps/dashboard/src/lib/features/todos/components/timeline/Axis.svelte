<script lang="ts">
	let {
		ticks,
		pct,
		today,
		count,
		days
	}: {
		ticks: { at: number; text: string; major: boolean; off: boolean }[];
		pct: (at: number) => number;
		today: number;
		count: number;
		days: number;
	} = $props();
</script>

<!-- One ruling for the whole chart, so the calendar reads through the group gaps. -->
<div class="field" aria-hidden="true">
	{#each ticks as tick (tick.at)}
		{#if tick.off}
			<span class="off" style:left="{pct(tick.at)}%" style:width="{100 / days}%"></span>
		{/if}
		<span class="line" class:major={tick.major} style:left="{pct(tick.at)}%"></span>
	{/each}
</div>

<div class="axis">
	<div class="corner">{count} todos</div>
	<div class="scale">
		{#each ticks as tick (tick.at)}
			{#if tick.major}
				<span class="tick" style:left="{pct(tick.at)}%">{tick.text}</span>
			{/if}
		{/each}
		<span class="cap" style:left="{today}%"><span></span></span>
	</div>
</div>

<style>
	/* Overlays and the scale all start where the track starts, so a percent means the
	   same instant in every layer. */
	.field {
		position: absolute;
		inset: 0 0 0 calc(var(--lane) + var(--name));
		pointer-events: none;
	}

	.line {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}

	.line.major {
		border-left-color: var(--border);
	}

	.off {
		position: absolute;
		top: 0;
		bottom: 0;
		background: color-mix(in srgb, var(--ink) 3.5%, transparent);
	}

	.axis {
		position: sticky;
		top: 0;
		z-index: 4;
		display: flex;
		align-items: stretch;
		height: 2.4rem;
		background: var(--surface-2);
		border-bottom: 1px solid var(--border-bright);
	}

	.corner {
		position: sticky;
		left: 0;
		z-index: 5;
		flex: 0 0 calc(var(--lane) + var(--name));
		display: flex;
		align-items: center;
		padding: 0 0.85rem;
		background: var(--surface-2);
		box-shadow: inset -1px 0 0 var(--border-bright);
		font-family: var(--font-mono);
		font-size: 0.7em;
		letter-spacing: 0.04em;
		color: var(--dim);
	}

	.scale {
		position: relative;
		flex: 1;
	}

	.tick {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		padding-left: 0.4em;
		border-left: 1px solid var(--border-bright);
		font-family: var(--font-mono);
		font-size: 0.68em;
		color: var(--muted);
		white-space: nowrap;
	}

	.cap {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px solid var(--accent);
	}

	.cap span {
		position: absolute;
		bottom: -3px;
		left: -3px;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent);
	}
</style>
