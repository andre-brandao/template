<script lang="ts">
	import HardDrive from '@lucide/svelte/icons/hard-drive';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import Shell from '$lib/components/layout/Shell.svelte';

	let { children } = $props();

	const sections = [
		{
			title: 'Instance',
			items: [
				{ href: '/admin/users', label: 'Users', icon: UsersRound },
				{ href: '/admin/logs', label: 'Logs', icon: ScrollText },
				{ href: '/admin/database', label: 'Database', icon: HardDrive }
			]
		}
	];
	const crumbs = [
		{ href: '/', label: 'Home' },
		{ href: '/admin', label: 'Admin' }
	];
</script>

<Shell back={{ href: '/todos', label: 'Back' }} {sections} {crumbs}>{@render children()}</Shell>
