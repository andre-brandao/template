<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { dev } from '$app/env';
	import { DEVTOOLS } from '$app/env/public';
	import { QueryClientProvider, type QueryClient } from '@tanstack/svelte-query';
	import { HotkeysProvider, type HotkeyPlatform } from '@tanstack/svelte-hotkeys';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import { zone, type Prefs } from '@template/core/user/prefs';
	import { setDates } from '@template/ui';
	import { hotkeys } from '#lib/hotkeys.ts';
	import { createUser } from '#lib/utils/context.ts';
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

	// Getters, so a prefs change reaches every picker without a reload.
	setDates({
		get locale() {
			return data.prefs.locale;
		},
		get zone() {
			return zone(data.prefs);
		},
		format: { year: 'numeric', month: 'short', day: 'numeric' }
	});
</script>

<QueryClientProvider client={data.queryClient}>
	<!-- The request's platform, so server-rendered Kbd labels already read ⌘ or Ctrl. -->
	<HotkeysProvider appHotkeys={hotkeys} defaultOptions={{ platform: data.platform }}>
		{@render children()}
		<!-- Both are build-time constants, so prod compiles the devtools out. Opt in: DEVTOOLS=1. -->
		{#if dev && DEVTOOLS}<DevToolsProvider client={data.queryClient} />{/if}
	</HotkeysProvider>
</QueryClientProvider>
