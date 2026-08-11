<script lang="ts">
	import HardDrive from '@lucide/svelte/icons/hard-drive';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import Shell from '$lib/components/layout/Shell.svelte';

	let { children } = $props();

	const sections = [
		{
			title: 'Instance',
			items: [
				{ href: '/admin/users', label: 'Users', icon: UsersRound },
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
