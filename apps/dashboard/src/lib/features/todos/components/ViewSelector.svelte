<script module lang="ts">
	export type View = 'list' | 'board' | 'table' | 'timeline';
</script>

<script lang="ts">
	let { view = 'table', onchange }: { view?: View; onchange: (view: View) => void } = $props();
</script>

<div class="tabs">
	{#each ['table', 'board', 'timeline',  'list'] as const as v (v)}
		<button class="tab" class:active={view === v} onclick={() => onchange(v)}>{v}</button>
	{/each}
</div>

<style>
	.tab {
		text-transform: capitalize;
	}
</style>
