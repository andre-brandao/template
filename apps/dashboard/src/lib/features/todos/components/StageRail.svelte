<script lang="ts">
	import { color } from '../status';

	let { status }: { status: string } = $props();

	const stages = ['pending', 'in_progress', 'done'];
	const index = $derived(stages.indexOf(status));
</script>

<div class="rail" role="img" aria-label="Stage: {status.replace('_', ' ')}">
	{#each stages as stage, i}
		<span class="segment" style:background={i <= index ? color(stage) : 'var(--border)'}></span>
	{/each}
</div>

<style>
	.rail {
		display: flex;
		gap: 0.2em;
		width: 3em;
	}

	.segment {
		flex: 1;
		height: 4px;
		border-radius: 2px;
		transition: background 0.3s ease;
	}
</style>
