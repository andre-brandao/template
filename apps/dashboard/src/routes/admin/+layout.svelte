<script lang="ts">
	import Gauge from '@lucide/svelte/icons/gauge';
	import HardDrive from '@lucide/svelte/icons/hard-drive';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import Webhook from '@lucide/svelte/icons/webhook';
	import Shell from '$lib/components/layout/Shell.svelte';
	import { origin } from '$lib/components/layout/back.svelte';

	let { children } = $props();

	const from = origin('/admin', '/todos');

	const sections = [
		{
			title: 'Instance',
			items: [
				// `exact`, or prefix matching keeps Overview lit on every screen below it.
				{ href: '/admin', label: 'Overview', icon: Gauge, exact: true },
				{ href: '/admin/users', label: 'Users', icon: UsersRound },
				{ href: '/admin/logs', label: 'Logs', icon: ScrollText },
				{ href: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
				{ href: '/admin/database', label: 'Database', icon: HardDrive }
			]
		}
	];
	const crumbs = [
		{ href: '/', label: 'Home' },
		{ href: '/admin', label: 'Admin' }
	];
</script>

<Shell back={{ href: from.href, label: 'Back' }} {sections} {crumbs}>{@render children()}</Shell>
