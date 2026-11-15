<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { dev } from '$app/environment';
	import { QueryClientProvider, type QueryClient } from '@tanstack/svelte-query';
	import { HotkeysProvider, type HotkeyPlatform } from '@tanstack/svelte-hotkeys';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import type { Prefs } from '@template/core/user/prefs';
	import { createUser } from '$lib/utils/context';
	import { createRail } from './rail.svelte';
	import DevToolsProvider from './DevToolsProvider.svelte';

	let {
		data,
		children
	}: {
		data: {
			queryClient: QueryClient;
			rail: boolean;
			user: User.Info | null;
			prefs: Prefs;
			platform: HotkeyPlatform;
		};
		children: Snippet;
	} = $props();

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

<QueryClientProvider client={data.queryClient}>
	<!-- The request's platform, so server-rendered Kbd labels already read ⌘ or Ctrl. -->
	<HotkeysProvider defaultOptions={{ platform: data.platform }}>
		{@render children()}
		<!-- `dev` is a build-time constant, so prod compiles the devtools out entirely. -->
		{#if dev}<DevToolsProvider client={data.queryClient} />{/if}
	</HotkeysProvider>
</QueryClientProvider>
