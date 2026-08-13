<script lang="ts">
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Shell from '$lib/components/layout/Shell.svelte';
	import { origin } from '$lib/components/layout/back.svelte';

	let { children } = $props();

	const from = origin('/settings', '/todos');

	const sections = [
		{
			title: 'User',
			items: [
				{ href: '/settings/profile', label: 'Profile', icon: UserRound },
				{ href: '/settings/experience', label: 'Experience', icon: Sparkles }
			]
		},
		{
			title: 'Workspace',
			items: [{ href: '/settings/keys', label: 'API keys', icon: KeyRound }]
		}
	];
	const crumbs = [
		{ href: '/', label: 'Home' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<Shell back={{ href: from.href, label: 'Back' }} {sections} {crumbs}>{@render children()}</Shell>
