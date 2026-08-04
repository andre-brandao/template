<script lang="ts">
	import SettingsNav from '$lib/features/settings/components/SettingsNav.svelte';

	let { children } = $props();
</script>

<div class="settings">
	<SettingsNav />
	<section>{@render children()}</section>
</div>

<style>
	.settings {
		display: flex;
		align-items: start;
		gap: 2.5em;
	}

	section {
		flex: 1;
		min-width: 0;
		max-width: 46em;
	}

	@media (max-width: 700px) {
		.settings {
			flex-direction: column;
			gap: 1.5em;
		}
	}
</style>
