<script lang="ts">
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
		<p class="error">No story named <code>{slug}</code>.</p>
	{/if}
{/if}
