<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { navigating } from '$app/state';
	import PreLoadingIndicator from './PreLoadingIndicator.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';

	let { data, children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if navigating.complete}
	<PreLoadingIndicator />
{/if}

<div class="shell">
	<Topbar loggedIn={data.loggedIn} />
	<div class="body">
		{#if data.loggedIn}
			<Sidebar />
		{/if}
		<main>
			{@render children()}
		</main>
	</div>
</div>

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.body {
		display: flex;
		flex: 1;
	}

	main {
		flex: 1;
		max-width: 960px;
		margin: 0 auto;
		padding: 1.75em 1.25em 3em;
	}
</style>
