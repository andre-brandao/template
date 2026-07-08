<script lang="ts">
	import { onMount } from 'svelte';

	let p = $state(0);

	onMount(() => {
		const handles: ReturnType<typeof setTimeout>[] = [];

		function next() {
			p += 0.1;
			const remaining = 1 - p;
			if (remaining > 0.15) handles.push(setTimeout(next, 500 / remaining));
		}

		handles.push(setTimeout(next, 250));

		return () => handles.forEach(clearTimeout);
	});
</script>

<div class="progress-container">
	<div class="progress" style="width: {p * 100}%"></div>
</div>

{#if p >= 0.4}
	<div class="fade"></div>
{/if}

<style>
	.progress-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 4px;
		z-index: 999;
	}

	.progress {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		background-color: var(--accent);
		transition: width 0.4s;
	}

	.fade {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.12);
		pointer-events: none;
		z-index: 998;
		animation: fade 0.4s;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
