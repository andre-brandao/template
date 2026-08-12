<script lang="ts">
	import ChartLine from '@lucide/svelte/icons/chart-line';
	import Files from '@lucide/svelte/icons/files';
	import FolderKanban from '@lucide/svelte/icons/folder-kanban';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import Shell from '$lib/components/layout/Shell.svelte';

	let { children } = $props();

	const sections = [
		{
			items: [
				{ href: '/projects', label: 'Projects', icon: FolderKanban },
				{ href: '/todos', label: 'Todos', icon: ListTodo },
				{ href: '/files', label: 'Files', icon: Files },
				{ href: '/insights', label: 'Insights', icon: ChartLine }
			]
		}
	];
</script>

<Shell {sections}>{@render children()}</Shell>
