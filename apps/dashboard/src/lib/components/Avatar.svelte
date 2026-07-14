<script lang="ts">
	let {
		name,
		image,
		size = 28
	}: { name: string; image: string | null; size?: number } = $props();

	const initial = $derived(name.trim().charAt(0).toUpperCase() || '?');
</script>

{#if image}
	<img src={image} alt="" style="--size: {size}px" />
{:else}
	<span class="fallback" style="--size: {size}px" aria-hidden="true">{initial}</span>
{/if}

<style>
	img,
	.fallback {
		flex-shrink: 0;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		object-fit: cover;
	}

	.fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		font-size: calc(var(--size) * 0.42);
		font-weight: 600;
		color: var(--ink);
		background: var(--surface-2);
		border: 1px solid var(--border);
	}
</style>
