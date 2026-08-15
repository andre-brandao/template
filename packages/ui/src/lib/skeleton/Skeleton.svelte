<script lang="ts">
	let {
		h,
		w,
		round = false
	}: {
		/** Any CSS length — the shape stands in for content that has not arrived. */
		h: string;
		w?: string;
		/** For the avatar-shaped slots. */
		round?: boolean;
	} = $props();
</script>

<span class="skeleton" class:round style:height={h} style:width={w}></span>

<style>
	.skeleton {
		display: block;
		flex: 1;
		min-width: 0;
		border-radius: var(--radius, 8px);
		background: var(--surface-2, #eee);
		animation: pulse 1.2s ease-in-out infinite;
	}

	.round {
		flex: none;
		border-radius: 50%;
	}

	@keyframes pulse {
		50% {
			opacity: 0.45;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
		}
	}
</style>
