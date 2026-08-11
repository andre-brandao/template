<script lang="ts">
	import Shell from '$lib/components/layout/Shell.svelte';

	let { children } = $props();

	const sections = [
		{
			items: [
				{ href: '/projects', label: 'Projects' },
				{ href: '/todos', label: 'Todos' },
				{ href: '/files', label: 'Files' },
				{ href: '/insights', label: 'Insights' },
			]
		}
	];
</script>

<Shell {sections}>{@render children()}</Shell>
