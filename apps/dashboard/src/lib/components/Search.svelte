<script lang="ts">
	import { debounce } from '$lib/utils/debounce';

	let {
		value,
		placeholder,
		onchange
	}: { value: string; placeholder: string; onchange: (value: string) => void } = $props();

	// Writable derived: typing overrides it, external changes (back/forward, reload) resnap it.
	let input = $derived(value);
	const commit = debounce((next: string) => onchange(next), 300);
</script>

<input
	class="search"
	type="search"
	{placeholder}
	value={input}
	oninput={(e) => {
		input = e.currentTarget.value;
		commit(e.currentTarget.value);
	}}
/>

<style>
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
</style>
