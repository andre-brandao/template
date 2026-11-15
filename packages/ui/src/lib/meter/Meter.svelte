<script lang="ts">
	let {
		value,
		max = 1,
		tone = 'accent',
		label
	}: {
		value: number;
		max?: number;
		tone?: 'accent' | 'danger';
		/** Names the bar for screen readers; without it the bar is decoration beside its number. */
		label?: string;
	} = $props();

	const pct = $derived(Math.min(1, Math.max(0, value / Math.max(max, Number.EPSILON))) * 100);
</script>

<span
	class={['meter', tone]}
	role={label ? 'meter' : undefined}
	aria-label={label}
	aria-valuenow={label ? value : undefined}
	aria-valuemin={label ? 0 : undefined}
	aria-valuemax={label ? max : undefined}
	aria-hidden={label ? undefined : 'true'}
>
	<span class="fill" style:width="{pct}%"></span>
</span>

<style>
	/* A thin track sized by its container: a share of a whole, next to the number it draws. */
	.meter {
		display: block;
		min-width: 3em;
		height: 0.4em;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
	}

	.danger .fill {
		background: var(--danger);
	}
</style>
