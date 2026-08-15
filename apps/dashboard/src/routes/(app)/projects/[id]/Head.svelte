<script lang="ts">
	import { page } from '$app/state';
	import ProjectNav from '$lib/features/projects/components/ProjectNav.svelte';

	let { tight }: { tight: boolean } = $props();

	// Empty mid-navigation, and the switcher would fire its query with an undefined id.
	const id = $derived(page.params.id);
</script>

{#if id}
	<!-- Outside ProjectNav, not in it: the thing that suspends is its own top-level await,
	     and a component can't catch that with a boundary it hosts itself. -->
	<svelte:boundary>
		<ProjectNav {id} {tight} />
		{#snippet pending()}<span class="ph" class:tight></span>{/snippet}
	</svelte:boundary>
{/if}

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
