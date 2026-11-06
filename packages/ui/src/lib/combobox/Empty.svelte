<script lang="ts">
	import type { Snippet } from 'svelte';
	import { combobox } from './ctx.svelte';

	let { children }: { children: Snippet } = $props();

	const ctx = combobox();
</script>

{#if ctx.count === 0}
	<p class="empty">{@render children()}</p>
{/if}

<style>
	.empty {
		margin: 0;
		padding: 0.9em 0.55em;
		font-size: 0.9em;
		text-align: center;
		color: var(--dim, #888);
	}
</style>
