<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { dev } from '$app/environment';
	import { QueryClientProvider, type QueryClient } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { HotkeysProvider, type HotkeyPlatform } from '@tanstack/svelte-hotkeys';
	import { TanStackDevtools } from '@tanstack/svelte-devtools';
	import { hotkeysDevtoolsPlugin } from '@tanstack/svelte-hotkeys-devtools';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import type { Prefs } from '@template/core/user/prefs';
	import { createUser } from '$lib/utils/context';
	import { createRail } from './rail.svelte';

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
		<!-- Dev only: `dev` is a build-time constant, so prod drops these imports. -->
		{#if dev}
			<TanStackDevtools plugins={[hotkeysDevtoolsPlugin()]} />
			<SvelteQueryDevtools buttonPosition="bottom-left" />
		{/if}
	</HotkeysProvider>
</QueryClientProvider>
