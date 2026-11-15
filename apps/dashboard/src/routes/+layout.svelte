<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { navigating, page } from '$app/state';
	import PreLoadingIndicator from './PreLoadingIndicator.svelte';
	import ViewTransitions from './ViewTransitions.svelte';
	import { Modals, Toaster } from '@template/ui';
	import Shell from '$lib/components/layout/Shell.svelte';
	import ShellProvider from '$lib/components/layout/ShellProvider.svelte';
	import { createAgent } from '$lib/features/agent/agent.svelte';
	import Dock from '$lib/features/agent/components/Dock.svelte';
	import Toggle from '$lib/features/agent/components/Toggle.svelte';
	import Feedback from '$lib/features/feedback/components/Feedback.svelte';
	import ThemeToggle from '$lib/features/settings/components/ThemeToggle.svelte';

	let { data, children } = $props();

	// Here rather than in the Shell, so the conversation survives a move between sections.
	// Shared components can't import a slice, so slices reach the Shell as snippets.
	createAgent();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#snippet feedback(slim: boolean)}<Feedback {slim} />{/snippet}

<ShellProvider {data}>
	<ViewTransitions />
	<Toaster />
	<Modals />

	{#if navigating.complete}
		<PreLoadingIndicator />
	{/if}

	<!-- One Shell for the whole app, so a navigation between sections leaves the sidebar
	     standing. A section opts in by returning `nav`; `/`, auth and every error don't. -->
	<div class="shell">
		{#if page.data.nav && !page.error}
			<Shell nav={page.data.nav} foot={data.user && data.feedback ? feedback : undefined}>
				{#snippet tools()}
					{#if data.user && data.agent}<Toggle />{/if}
				{/snippet}
				{#snippet account()}<ThemeToggle />{/snippet}
				{#snippet side()}
					<!-- No LLM env, no dock: its model list would throw on every page. -->
					{#if data.user && data.agent}<Dock />{/if}
				{/snippet}
				{@render children()}
			</Shell>
		{:else}
			{@render children()}
		{/if}
	</div>
</ShellProvider>

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
