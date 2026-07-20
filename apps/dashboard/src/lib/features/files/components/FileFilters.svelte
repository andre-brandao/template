<script module lang="ts">
	export type Filters = { search: string; tag: string };
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
		placeholder="Search files…"
		value={input}
		oninput={(e) => onInput(e.currentTarget.value)}
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
