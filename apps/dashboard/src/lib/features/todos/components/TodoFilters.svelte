<script module lang="ts">
	export type Filters = { state: 'all' | 'open' | 'closed'; search: string };
</script>

<script lang="ts">
	import { debounce } from '$lib/utils/debounce';

	let { filters, onchange }: { filters: Filters; onchange: (next: Filters) => void } = $props();

	// Writable derived: typing overrides it, external changes (back/forward, reload) resnap it.
	let input = $derived(filters.search);
	const commit = debounce((value: string) => onchange({ ...filters, search: value }), 300);

	function onInput(value: string) {
		input = value;
		commit(value);
	}
</script>

<div class="row">
	<input
		class="search"
		type="search"
		placeholder="Search todos…"
		value={input}
		oninput={(e) => onInput(e.currentTarget.value)}
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

	.search {
		font: inherit;
		padding: 0.45em 0.7em;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
		color: var(--ink);
		min-width: 12em;
	}

	.search:focus-visible {
		border-color: var(--accent);
		outline: none;
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
