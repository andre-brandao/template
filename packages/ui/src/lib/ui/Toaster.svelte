<script lang="ts">
	import Button from '../input/Button.svelte';
	import Spinner from './Spinner.svelte';
	import { queue } from './toast.svelte';

	const GAP = 12;

	let open = $state(false);
	let sizes = $state<Record<number, number>>({});

	/**
	 * Where each toast sits, measured from the front of the stack: `d` toasts ahead of it, and
	 * `y` px of them once expanded. Ones on their way out stop counting straight away, so the
	 * rest close the gap while the dismissed one is still fading.
	 */
	const stack = $derived(
		queue.items.map((_, i) => {
			const front = queue.items.slice(i + 1).filter((t) => !t.gone);
			return {
				d: front.length,
				y: front.reduce((n, t) => n + (sizes[t.id] ?? 0) + GAP, 0)
			};
		})
	);

	function grow() {
		open = true;
		queue.pause();
	}

	function shrink() {
		open = false;
		queue.resume();
	}
</script>

<ol
	popover="manual"
	aria-label="Notifications"
	aria-live="polite"
	data-open={open || undefined}
	onpointerenter={grow}
	onpointerleave={shrink}
	onfocusin={grow}
	onfocusout={(e) => e.currentTarget.contains(e.relatedTarget as Node) || shrink()}
	{@attach (el) => {
		// Re-promoted rather than shown once: `showPopover` on an open popover is a no-op, and only
		// a fresh promotion puts the stack above a dialog that opened after this mounted. The cost
		// is that the live region is re-inserted too, so announcements are best-effort.
		el.togglePopover(false);
		if (queue.items.length) el.showPopover();
	}}
>
	{#each queue.items as t, i (t.id)}
		<li
			class={t.kind}
			role={t.kind === 'error' ? 'alert' : undefined}
			data-gone={t.gone || undefined}
			style:--d={stack[i].d}
			style:--y={stack[i].y}
			{@attach (el) => {
				sizes[t.id] = el.offsetHeight;
				return () => delete sizes[t.id];
			}}
		>
			{#if t.kind === 'loading'}
				<Spinner />
			{/if}
			<p>{t.text}</p>
			{#if t.action}
				<Button
					variant="ghost"
					onclick={() => {
						t.action?.onclick();
						queue.kill(t.id);
					}}
				>
					{t.action.label}
				</Button>
			{/if}
			<button class="x" type="button" aria-label="Dismiss" onclick={() => queue.kill(t.id)}>✕</button>
		</li>
	{/each}
</ol>

<style>
	ol {
		position: fixed;
		inset: auto 1rem 1rem auto;
		width: min(24em, calc(100vw - 2em));
		/* The items are anchored to the corner themselves, so the list needs no box of its own. */
		height: 0;
		margin: 0;
		padding: 0;
		border: none;
		background: none;
		overflow: visible;
		list-style: none;
		pointer-events: none;
	}

	li {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.7em 0.85em;
		border: 1px solid var(--border, #333);
		border-inline-start: 3px solid var(--border-bright, #555);
		border-radius: var(--radius, 8px);
		background: var(--surface, #fff);
		color: var(--ink, #111);
		box-shadow: var(--shadow-2, 0 12px 28px -14px rgb(0 0 0 / 0.6));
		font-family: var(--font-sans, system-ui);
		font-size: 0.9em;
		pointer-events: auto;
		transform-origin: bottom center;
		translate: 0 calc(var(--d) * -0.9em);
		scale: calc(1 - var(--d) * 0.05);
		transition:
			translate 0.3s ease,
			scale 0.3s ease,
			opacity 0.3s ease;
	}

	li.success {
		border-inline-start-color: var(--done, #4fa98f);
	}

	li.error {
		border-inline-start-color: var(--danger, #d3684f);
	}

	li.loading {
		border-inline-start-color: var(--accent, #4fa98f);
	}

	@starting-style {
		li {
			translate: 0 100%;
			scale: 0.95;
			opacity: 0;
		}
	}

	li[data-gone] {
		translate: 0 60%;
		opacity: 0;
		pointer-events: none;
	}

	ol[data-open] li {
		translate: 0 calc(var(--y) * -1px);
		scale: 1;
	}

	/* Bridges the gap to the toast in front so crossing it doesn't read as leaving the stack. */
	ol[data-open] li:not(:last-child)::after {
		content: '';
		position: absolute;
		inset-inline: 0;
		top: 100%;
		height: 12px;
	}

	p {
		flex: 1;
		min-width: 0;
		margin: 0;
		overflow-wrap: anywhere;
	}

	.x {
		border: none;
		background: none;
		padding: 0 0.2em;
		font-size: 0.9em;
		line-height: 1;
		color: var(--muted, #666);
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.x:hover {
		color: var(--ink, #111);
	}

	ol[data-open] .x,
	.x:focus-visible {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		li {
			scale: 1;
			transition-duration: 0.01s;
		}
	}
</style>
