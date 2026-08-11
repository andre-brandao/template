<script lang="ts">
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
				{ href: `/projects/${params.id}`, label: 'Overview', exact: true },
				{ href: `/projects/${params.id}/todos`, label: 'Todos' },
				{ href: `/projects/${params.id}/insights`, label: 'Insights' }
			]
		},
		{
			bottom: true,
			items: [{ href: `/projects/${params.id}/settings`, label: 'Settings' }]
		}
	]);
</script>

<Shell back={{ href: '/projects', label: 'Projects' }} {sections} {crumbs}>
	{#snippet head()}
		{#if params.id}
			<svelte:boundary>
				<ProjectNav id={params.id} />
				{#snippet pending()}<span class="ph"></span>{/snippet}
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
</style>
