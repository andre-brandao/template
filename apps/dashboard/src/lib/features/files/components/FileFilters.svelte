<script module lang="ts">
	export type Filters = { search: string; tag: string };
</script>

<script lang="ts">
	import Search from '$lib/components/Search.svelte';

	let { filters, onchange }: { filters: Filters; onchange: (next: Filters) => void } = $props();
</script>

<div class="row">
	<Search
		value={filters.search}
		placeholder="Search files…"
		onchange={(search) => onchange({ ...filters, search })}
	/>
	{#if filters.tag}
		<button
			class="active"
			type="button"
			onclick={() => onchange({ ...filters, tag: '' })}
			aria-label="Clear tag filter {filters.tag}"
		>
			{filters.tag}
			<span aria-hidden="true">×</span>
		</button>
	{/if}
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
	}

	.active {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		border: 1px solid var(--accent);
		background: var(--surface-2);
		color: var(--ink);
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.78em;
		padding: 0.25em 0.7em;
		cursor: pointer;
	}

	.active:hover {
		border-color: var(--danger, crimson);
		color: var(--danger, crimson);
	}
</style>
