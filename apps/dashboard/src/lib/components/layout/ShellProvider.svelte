<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { QueryClientProvider, type QueryClient } from '@tanstack/svelte-query';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import type { Prefs } from '@template/core/user/prefs';
	import { createUser } from '$lib/utils/context';
	import { createRail } from './rail.svelte';

	let {
		data,
		children
	}: {
		data: { queryClient: QueryClient; rail: boolean; user: User.Info | null; prefs: Prefs };
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
	{@render children()}
</QueryClientProvider>
