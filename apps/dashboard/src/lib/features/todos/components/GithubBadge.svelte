<script lang="ts">
	import { Badge } from '@template/ui';
	import GithubMark from '$lib/components/GithubMark.svelte';
	import { issue } from '../github';

	let { annotations }: { annotations: Record<string, string> } = $props();

	const gh = $derived(issue(annotations));
</script>

{#if gh}
	<a href={gh.url} target="_blank" rel="noopener noreferrer" title="Open on GitHub">
		<Badge>
			<GithubMark />
			{gh.label}
		</Badge>
	</a>
{/if}

<style>
	a {
		display: inline-flex;
		text-decoration: none;
		flex: none;
	}

	a:hover {
		filter: brightness(1.25);
	}
</style>
