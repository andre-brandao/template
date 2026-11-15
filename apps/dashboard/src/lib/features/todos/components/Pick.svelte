<!-- The one look for a small fixed set (status, grouping): a tinted pill opening a `Menu`.
     `compact` drops the text, so a board card or row shows the dot alone. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Menu } from '@template/ui';

	let {
		label,
		text,
		color = 'var(--muted)',
		compact = false,
		disabled = false,
		children
	}: {
		label: string;
		text: string;
		color?: string;
		compact?: boolean;
		disabled?: boolean;
		children: Snippet;
	} = $props();
</script>

<Menu.Root {label}>
	{#snippet trigger(attrs)}
		<button
			class={['pill', { compact }]}
			type="button"
			style:--c={color}
			aria-label={compact ? `${label}: ${text}` : undefined}
			title={compact ? text : undefined}
			{disabled}
			{...attrs}
		>
			<span class="dot"></span>
			{#if !compact}{text}{/if}
		</button>
	{/snippet}
	{@render children()}
</Menu.Root>

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.35em 0.7em;
		border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--c) 12%, transparent);
		color: var(--c);
		font: inherit;
		font-size: 0.86em;
		white-space: nowrap;
		cursor: pointer;
		transition: background 140ms ease;
	}

	/* A bare dot with a hit area big enough to tap. */
	.pill.compact {
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		padding: 0;
		border-color: transparent;
		background: none;
	}

	.pill:hover,
	.pill[aria-expanded='true'] {
		background: color-mix(in srgb, var(--c) 20%, transparent);
	}

	.pill:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.pill:disabled {
		cursor: default;
	}

	.dot {
		flex: none;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c);
	}

	@media (prefers-reduced-motion: reduce) {
		.pill {
			transition: none;
		}
	}
</style>
