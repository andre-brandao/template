<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { untrack } from 'svelte';
	import { navigating } from '$app/state';
	import PreLoadingIndicator from './PreLoadingIndicator.svelte';
	import ViewTransitions from './ViewTransitions.svelte';
	import { Toaster } from '@template/ui';
	import { Permission } from '@template/core/permission';
	import { createRail } from '$lib/components/layout/rail.svelte';
	import { createUser } from '$lib/utils/context';

	let { data, children } = $props();

	// Here rather than in the Shell so the rail survives a navigation between route groups.
	// Read once: the cookie only seeds it, and the toggle owns it from then on.
	createRail(untrack(() => data.rail));

	createUser({
		get current() {
			return data.user;
		},
		get prefs() {
			return data.prefs;
		},
		can: (grants, owned) => Permission.can(data.user?.role, grants, owned)
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ViewTransitions />
<Toaster />

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
