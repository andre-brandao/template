<script module lang="ts">
	export type Range = { start: string; end: string };

	const DAY = 86_400_000;
	const iso = (time: number) => new Date(time).toISOString().slice(0, 10);

	/** Range covering the last `days` days, ending today. */
	export function last(days: number): Range {
		const now = Date.now();
		return { start: iso(now - (days - 1) * DAY), end: iso(now) };
	}

	const span = (range: Range) => Math.round((Date.parse(range.end) - Date.parse(range.start)) / DAY) + 1;

	/** Mirrors the server's `Insights.Range` refinements. */
	export function valid(range: Range) {
		return range.start <= range.end && span(range) <= 366;
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';

	let {
		range = $bindable(last(30)),
		presets = [7, 30, 90],
		onchange
	}: { range?: Range; presets?: number[]; onchange?: (range: Range) => void } = $props();

	const active = (days: number) => {
		const preset = last(days);
		return range.start === preset.start && range.end === preset.end;
	};

	// Paint the picker itself before notifying, so consumers whose async work is
	// synchronized on the new range don't hold back the control's own feedback.
	const set = async (next: Range) => {
		range = next;
		await tick();
		onchange?.(next);
	};

	const move = (edge: keyof Range) => (event: Event & { currentTarget: HTMLInputElement }) => {
		const next = { ...range, [edge]: event.currentTarget.value };
		if (event.currentTarget.value && valid(next)) set(next);
	};
</script>

<div class="picker">
	<div class="tabs">
		{#each presets as days (days)}
			<button class="tab" class:active={active(days)} onclick={() => set(last(days))}>
				{days}d
			</button>
		{/each}
	</div>
	<input type="date" value={range.start} max={range.end} onchange={move('start')} />
	<span class="arrow">→</span>
	<input type="date" value={range.end} min={range.start} max={iso(Date.now())} onchange={move('end')} />
</div>

<style>
	.picker {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
	}

	.tabs {
		display: inline-flex;
		gap: 2px;
		background: var(--surface-2, #eee);
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		padding: 2px;
	}

	.tab {
		font-family: var(--font-mono, monospace);
		font-size: 0.78em;
		padding: 0.4em 0.9em;
		border-radius: 4px;
		border: none;
		background: none;
		color: var(--dim, #888);
		cursor: pointer;
	}

	.tab:hover {
		color: var(--muted, #666);
	}

	.tab.active {
		background: var(--surface, #fff);
		color: var(--ink, #111);
	}

	input {
		font-family: var(--font-mono, monospace);
		font-size: 0.78em;
		padding: 0.4em 0.6em;
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		background: var(--surface-2, #eee);
		color: var(--muted, #666);
	}

	input:focus-visible {
		border-color: var(--accent, #4fa98f);
		outline: none;
	}

	.arrow {
		color: var(--dim, #888);
		font-size: 0.8em;
	}
</style>
