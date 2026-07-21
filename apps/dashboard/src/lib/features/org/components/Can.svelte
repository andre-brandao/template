<script lang="ts">
	import type { Snippet } from 'svelte';
	import { org } from '../context';
	import type { permissions } from '../permissions';

	let {
		perm,
		children,
		otherwise
	}: {
		perm: (typeof permissions)[number];
		children: Snippet;
		otherwise?: Snippet;
	} = $props();

	const ctx = org();
</script>

{#if ctx.can(perm)}
	{@render children()}
{:else if otherwise}
	{@render otherwise()}
{/if}
