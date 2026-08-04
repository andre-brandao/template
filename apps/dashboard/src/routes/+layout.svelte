<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { navigating } from '$app/state';
	import PreLoadingIndicator from './PreLoadingIndicator.svelte';
	import { provide } from '$lib/utils/context';

	let { data, children } = $props();

	provide({
		get current() {
			return data.user;
		},
		get prefs() {
			return data.prefs;
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if navigating.complete}
	<PreLoadingIndicator />
{/if}

<div class="shell">
	{@render children()}
</div>

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
