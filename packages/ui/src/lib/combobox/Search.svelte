<script lang="ts">
	import Input from '../input/Input.svelte';
	import { combobox } from './ctx.svelte';

	let { placeholder = 'Search' }: { placeholder?: string } = $props();

	const ctx = combobox();
</script>

<div class="search">
	<Input
		type="search"
		value={ctx.query}
		aria-label={placeholder}
		{placeholder}
		oninput={(e) => ctx.search(e.currentTarget.value)}
		{@attach (el) => el.focus()}
	/>
</div>

<style>
	.search {
		display: flex;
		padding: 0.15em 0.15em 0.45em;
	}

	.search :global(input) {
		font-family: var(--font-mono, monospace);
		font-size: 0.8em;
	}
</style>
