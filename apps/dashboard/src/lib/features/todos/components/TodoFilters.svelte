<script module lang="ts">
	export type Filters = { state: 'all' | 'open' | 'closed'; search: string };
</script>

<script lang="ts">
	import Search from '$lib/components/Search.svelte';

	let { filters, onchange }: { filters: Filters; onchange: (next: Filters) => void } = $props();
</script>

<div class="row">
	<Search
		value={filters.search}
		placeholder="Search todos…"
		onchange={(search) => onchange({ ...filters, search })}
	/>
	<div class="filters">
		<button class="tab" class:active={filters.state === 'all'} onclick={() => onchange({ ...filters, state: 'all' })}>
			All
		</button>
		<button class="tab" class:active={filters.state === 'open'} onclick={() => onchange({ ...filters, state: 'open' })}>
			Open
		</button>
		<button
			class="tab"
			class:active={filters.state === 'closed'}
			onclick={() => onchange({ ...filters, state: 'closed' })}
		>
			Closed
		</button>
	</div>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
	}

	.filters {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 2px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 2px;
	}
</style>
