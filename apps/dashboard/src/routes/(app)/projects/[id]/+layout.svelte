<script lang="ts">
	import ChartLine from '@lucide/svelte/icons/chart-line';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import Settings from '@lucide/svelte/icons/settings';
	import Shell from '$lib/components/layout/Shell.svelte';
	import ProjectNav from '$lib/features/projects/components/ProjectNav.svelte';
	import { getProject } from '$lib/features/projects/api/projects.remote';
	import type { LayoutProps } from './$types';

	let { params, children }: LayoutProps = $props();

	const project = $derived(params.id ? await getProject(params.id) : undefined);
	const crumbs = $derived([
		{ href: '/', label: 'Home' },
		{ href: '/projects', label: 'Projects' },
		{ href: `/projects/${params.id}`, label: project?.name ?? 'Project' }
	]);
	const sections = $derived([
		{
			items: [
				{ href: `/projects/${params.id}`, label: 'Overview', exact: true, icon: LayoutDashboard },
				{ href: `/projects/${params.id}/todos`, label: 'Todos', icon: ListTodo },
				{ href: `/projects/${params.id}/insights`, label: 'Insights', icon: ChartLine }
			]
		},
		{
			bottom: true,
			items: [{ href: `/projects/${params.id}/settings`, label: 'Settings', icon: Settings }]
		}
	]);
</script>

<Shell back={{ href: '/projects', label: 'Projects' }} {sections} {crumbs}>
	{#snippet head(tight: boolean)}
		{#if params.id}
			<svelte:boundary>
				<ProjectNav id={params.id} {tight} />
				{#snippet pending()}<span class="ph" class:tight></span>{/snippet}
			</svelte:boundary>
		{/if}
	{/snippet}
	{@render children()}
</Shell>

<style>
	.ph {
		display: block;
		flex: 1;
		min-width: 0;
		height: 2em;
		border-radius: var(--radius);
		background: var(--surface-2);
	}

	/* Matches the collapsed switcher's footprint so the corner doesn't jump. */
	.tight {
		flex: 0 0 2em;
		border-radius: 50%;
	}
</style>
