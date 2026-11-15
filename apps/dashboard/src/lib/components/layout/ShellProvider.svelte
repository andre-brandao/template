<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { dev } from '$app/environment';
	import { QueryClientProvider, type QueryClient } from '@tanstack/svelte-query';
	import { HotkeysProvider, type HotkeyPlatform } from '@tanstack/svelte-hotkeys';
	import { TanStackDevtools } from '@tanstack/svelte-devtools';
	import { hotkeysDevtoolsPlugin } from '@tanstack/svelte-hotkeys-devtools';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import type { Prefs } from '@template/core/user/prefs';
	import { createUser } from '$lib/utils/context';
	import { createRail } from './rail.svelte';
	import QueryPanel from './QueryPanel.svelte';

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

	// A small accent dot in place of the logo, inside a 28px hit area so it's easy to click.
	// Core reruns this on theme change.
	function trigger(el: HTMLElement) {
		const hit = document.createElement('span');
		hit.style.cssText = 'display:grid;place-items:center;width:28px;height:28px;opacity:0.7';
		const dot = document.createElement('span');
		dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:var(--accent)';
		hit.replaceChildren(dot);
		el.replaceChildren(hit);
	}
</script>

<QueryClientProvider client={data.queryClient}>
	<!-- The request's platform, so server-rendered Kbd labels already read ⌘ or Ctrl. -->
	<HotkeysProvider defaultOptions={{ platform: data.platform }}>
		{@render children()}
		<!-- Dev only: `dev` is a build-time constant, so prod drops these imports. -->
		{#if dev}
			<!-- Ctrl+~ opens it. Config only seeds localStorage; clear it to pick up changes. -->
			<TanStackDevtools
				config={{
					triggerMode: 'fixed',
					position: 'bottom-right',
					openHotkey: ['Control', '~'],
					customTrigger: trigger
				}}
				plugins={[
					{ name: 'Query', component: QueryPanel, props: { client: data.queryClient } },
					hotkeysDevtoolsPlugin()
				]}
			/>
		{/if}
	</HotkeysProvider>
</QueryClientProvider>
