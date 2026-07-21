<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { navigating } from '$app/state';
	import PreLoadingIndicator from './PreLoadingIndicator.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { provide } from '$lib/features/auth/context';
	import { provide as provideOrg } from '$lib/features/org/context';

	let { data, children } = $props();

	const me = provide({
		get current() {
			return data.user;
		}
	});

	provideOrg({
		get current() {
			return data.org;
		},
		get orgs() {
			return data.orgs;
		},
		get permissions() {
			return data.permissions;
		},
		can(perm) {
			const perms: string[] = data.permissions;
			return perms.includes('*') || perms.includes(perm);
		},
		path(to) {
			return data.org ? `/${data.org.id}${to}` : to;
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if navigating.complete}
	<PreLoadingIndicator />
{/if}

<div class="shell">
	<Topbar user={me.current} />
	<div class="body">
		{#if me.current}
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
