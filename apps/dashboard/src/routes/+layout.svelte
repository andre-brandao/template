<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { untrack } from 'svelte';
	import { navigating, page } from '$app/state';
	import PreLoadingIndicator from './PreLoadingIndicator.svelte';
	import ViewTransitions from './ViewTransitions.svelte';
	import { Modals, Toaster } from '@template/ui';
	import { Permission } from '@template/core/permission';
	import Shell from '$lib/components/layout/Shell.svelte';
	import { createRail } from '$lib/components/layout/rail.svelte';
	import { createUser } from '$lib/utils/context';

	let { data, children } = $props();

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

	// TODO: use to reload app when new version comes out
	// import { beforeNavigate } from '$app/navigation';

	// beforeNavigate(({ willUnload, to }) => {
	// 	if (updated.current && !willUnload && to?.url) {
	// 		location.href = to.url.href;
	// 	}
	// });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ViewTransitions />
<Toaster />
<Modals />

{#if navigating.complete}
	<PreLoadingIndicator />
{/if}

<!-- One Shell for the whole app, so a navigation between sections swaps the content and
     leaves the sidebar standing. A section opts in by returning `nav` from its `+layout.ts`;
     the routes that want no chrome — `/`, auth, errors — simply don't. -->
<div class="shell">
	{#if page.data.nav}
		<Shell nav={page.data.nav}>{@render children()}</Shell>
	{:else}
		{@render children()}
	{/if}
</div>

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
