<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		label,
		as = 'label',
		children,
		...rest
	}: {
		/** The caption above the control. A snippet when it carries more than words. */
		label: string | Snippet;
		/** `div` for a control that can't sit inside a label — an editor, a tag list. */
		as?: 'label' | 'div';
		children: Snippet;
	} & HTMLAttributes<HTMLElement> = $props();
</script>

<svelte:element this={as} class="field" {...rest}>
	<span>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</span>
	{@render children()}
</svelte:element>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		/* Lets a field shrink inside a grid or flex row instead of overflowing it. */
		min-width: 0;
	}

	span {
		font-size: 0.93em;
		font-weight: 500;
		color: var(--ink, #111);
	}
</style>
