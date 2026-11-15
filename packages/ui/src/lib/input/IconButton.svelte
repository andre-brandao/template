<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		label,
		pressed,
		size = 'md',
		variant = 'ghost',
		children,
		...rest
	}: {
		/** Required: an icon has no text, so this is the button's only name. */
		label: string;
		/** Set for a toggle; leave unset for a plain action. */
		pressed?: boolean;
		/** `sm` sits inside a row or a toolbar, `md` is one control tall. */
		size?: 'sm' | 'md';
		variant?: 'ghost' | 'secondary';
		children: Snippet;
	} & Omit<HTMLButtonAttributes, 'children'> = $props();
</script>

<button
	type="button"
	class={['icon', size, variant]}
	aria-label={label}
	title={label}
	aria-pressed={pressed}
	{...rest}
>
	{@render children()}
</button>

<style>
	.icon {
		display: inline-grid;
		flex: none;
		place-items: center;
		box-sizing: border-box;
		width: var(--control, 2.25em);
		height: var(--control, 2.25em);
		margin: 0;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--radius-sm, 6px);
		background: transparent;
		color: var(--muted, #64625d);
		font: inherit;
		line-height: 1;
		cursor: pointer;
		transition:
			background 0.12s ease,
			color 0.12s ease;
	}

	.sm {
		width: 1.75em;
		height: 1.75em;
	}

	.secondary {
		border-color: var(--border, #e6e5e1);
		background: var(--surface, #fff);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.04));
	}

	.icon:hover:not(:disabled),
	.icon[aria-expanded='true'],
	.icon[aria-pressed='true'] {
		background: var(--hover, rgb(0 0 0 / 0.06));
		color: var(--ink, #1c1b19);
	}

	.icon:focus-visible {
		outline: none;
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
		color: var(--ink, #1c1b19);
	}

	.icon:disabled {
		cursor: default;
		opacity: 0.5;
	}

	@media (prefers-reduced-motion: reduce) {
		.icon {
			transition: none;
		}
	}
</style>
