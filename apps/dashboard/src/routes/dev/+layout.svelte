<script lang="ts">
	import Braces from '@lucide/svelte/icons/braces';
	import Component from '@lucide/svelte/icons/component';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import Plug from '@lucide/svelte/icons/plug';
	import Shell from '$lib/components/layout/Shell.svelte';
	import { origin } from '$lib/components/layout/back.svelte';

	let { children } = $props();

	const from = origin('/dev', '/todos');

	const sections = [
		{
			title: 'Tools',
			items: [
				// `exact`, or prefix matching keeps Overview lit on every screen below it.
				{ href: '/dev', label: 'Overview', icon: FlaskConical, exact: true },
				{ href: '/dev/story', label: 'Storybook', icon: Component },
				{ href: '/dev/api', label: 'API explorer', icon: Braces },
				{ href: '/dev/mcp', label: 'MCP explorer', icon: Plug }
			]
		}
	];
	const crumbs = [
		{ href: '/', label: 'Home' },
		{ href: '/dev', label: 'Dev' }
	];
</script>

<Shell back={{ href: from.href, label: 'Back' }} {sections} {crumbs}>{@render children()}</Shell>
