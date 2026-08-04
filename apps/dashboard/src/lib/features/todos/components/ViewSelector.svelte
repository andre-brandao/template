<script module lang="ts">
	export type View = 'list' | 'board' | 'table' | 'timeline';
</script>

<script lang="ts">
	let { view = 'list', onchange }: { view?: View; onchange: (view: View) => void } = $props();
</script>

<div class="tabs">
	{#each ['list', 'board', 'table', 'timeline'] as const as v (v)}
		<button class="tab" class:active={view === v} onclick={() => onchange(v)}>{v}</button>
	{/each}
</div>

<style>
	.tab {
		text-transform: capitalize;
	}
</style>
