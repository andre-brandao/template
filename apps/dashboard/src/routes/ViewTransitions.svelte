<script lang="ts">
	import { onNavigate } from '$app/navigation';

	// Progressive enhancement: browsers without the API (or users who opted out
	// of motion) just get the instant swap.
	onNavigate((nav) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await nav.complete;
			});
		});
	});
</script>
