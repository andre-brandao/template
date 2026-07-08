<script lang="ts">
	let { height }: { height: string } = $props();
</script>

<div class="skeleton" style:height={height}></div>

<style>
	.skeleton {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		animation: pulse 1.2s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.45;
		}
	}
</style>
