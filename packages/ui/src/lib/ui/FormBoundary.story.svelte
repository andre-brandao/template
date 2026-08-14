<script module lang="ts">
	import type { Story } from '../story';
	import FormBoundary from './FormBoundary.svelte';
	import Button from '../input/Button.svelte';

	export const story: Story = {
		title: 'FormBoundary',
		blurb: 'Catches a render error and offers a reset. Break the child to see the failed state.',
		of: FormBoundary
	};
</script>

<script lang="ts">
	let broken = $state(false);

	function boom(): never {
		throw new Error('Story crash');
	}
</script>

<div class="row">
	<Button variant="danger" onclick={() => (broken = true)} disabled={broken}>Break the child</Button>
	<Button variant="ghost" onclick={() => (broken = false)}>Repair</Button>
</div>

<FormBoundary>
	{#if broken}
		{boom()}
	{:else}
		<p>The child renders normally.</p>
	{/if}
</FormBoundary>

<p class="note">Repair first, then "Try again" — reset re-renders the same child.</p>

<style>
	.row {
		display: flex;
		gap: 0.6em;
		margin-bottom: 1em;
	}

	.note {
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
