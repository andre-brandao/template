<!--
	The sidebar's top strip: the app's mark, and the project switcher where a route supplies
	one. `--topbar` tall with a bottom border, so its rule and the content header's draw one
	line across the divider — the same trick the two footers use with `--footer`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Brand from './Brand.svelte';

	let { head, slim = false }: { head?: Snippet<[boolean]>; slim?: boolean } = $props();
</script>

<div class="rail" class:slim>
	<!-- Collapsed the corner has room for one mark. The project's says more than the app's,
	     and the sidebar's home link covers what the brand was for. -->
	{#if !(slim && head)}<Brand word={!head && !slim} />{/if}
	{@render head?.(slim)}
</div>

<style>
	.rail {
		display: flex;
		align-items: center;
		gap: 0.55em;
		min-width: 0;
		flex-shrink: 0;
		height: var(--topbar);
		padding-inline: 0.75em;
		border-bottom: 1px solid var(--border);
	}

	.slim {
		justify-content: center;
		padding-inline: 0.5em;
	}
</style>
