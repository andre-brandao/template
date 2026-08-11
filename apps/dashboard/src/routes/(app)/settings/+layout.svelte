<script lang="ts">
	import Shell from '$lib/components/layout/Shell.svelte';

	let { children } = $props();

	const sections = [
		{
			title: 'User',
			items: [
				{ href: '/settings/profile', label: 'Profile' },
				{ href: '/settings/experience', label: 'Experience' }
			]
		},
		{ title: 'Workspace', items: [{ href: '/settings/keys', label: 'API keys' }] }
	];
	const crumbs = [
		{ href: '/', label: 'Home' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<Shell back={{ href: '/todos', label: 'Back' }} {sections} {crumbs}>{@render children()}</Shell>
