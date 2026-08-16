<script lang="ts">
	import { Issue } from '@template/ui';
	import { page } from '$app/state';
	import { stories } from '@template/ui/story';
	import Stage from '../Stage.svelte';

	// `params` is briefly empty mid-navigation, so read it behind the guard.
	const slug = $derived(page.params.name);
	const entry = $derived(stories.find((one) => one.slug === slug));
</script>

{#if slug}
	{#if entry}
		{#key entry.slug}
			<Stage {entry} />
		{/key}
	{:else}
		<Issue>No story named <code>{slug}</code>.</Issue>
	{/if}
{/if}
