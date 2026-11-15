<!--
	Click-to-edit text. The typed value stays up with a pending dot while `onsave` runs; a
	rejection puts the old text back, marks the field failed and keeps the draft for a retry.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { matchesKeyboardEvent } from '@tanstack/svelte-hotkeys';
	import Status from '../status/Status.svelte';

	let {
		value,
		onsave,
		label,
		placeholder = 'Empty',
		multiline = false,
		required = false,
		flush = false,
		disabled = false
	}: {
		value: string;
		/**
		 * Return the save's promise (a TanStack `mutateAsync`, not `mutate`): a bare `void`
		 * reads as an instant success, so a failure would never show or revert.
		 */
		onsave: (value: string) => Promise<unknown> | void;
		/** Names the field for assistive tech, since there is no visible label. */
		label: string;
		placeholder?: string;
		/** Enter adds a line; ⌘/Ctrl+Enter saves. */
		multiline?: boolean;
		/** An empty value fails with "Required" before `onsave` is called. */
		required?: boolean;
		/** Pulls the box's padding back, so the text lines up with its neighbours. */
		flush?: boolean;
		disabled?: boolean;
	} = $props();

	// Writable derived: shows the draft while saving, and a new `value` from the caller wins.
	let shown = $derived(value);
	let draft = $state('');
	let editing = $state(false);
	let pending = $state(false);
	let failed = $state<string>();
	// The text a failed save rejected, offered again on the next edit.
	let lost: string | undefined;
	let face: HTMLButtonElement | undefined;
	// Focus handed back after a save must not reopen the editor.
	let quiet = false;

	function edit() {
		if (quiet || disabled || pending) {
			quiet = false;
			return;
		}
		draft = lost ?? shown;
		lost = undefined;
		failed = undefined;
		editing = true;
	}

	async function leave(refocus: boolean) {
		editing = false;
		if (!refocus) return;
		await tick();
		quiet = true;
		face?.focus();
	}

	function save(refocus: boolean) {
		if (!editing) return;
		const next = multiline ? draft : draft.trim();
		leave(refocus);
		if (next === shown) return;
		if (required && !next) {
			lost = next;
			failed = 'Required';
			return;
		}
		const prev = shown;
		shown = next;
		pending = true;
		// `new Promise` so a synchronous throw reverts the same way a rejection does.
		new Promise((ok) => ok(onsave(next)))
			.then(
				() => {},
				(err: { message?: string } | undefined) => {
					shown = prev;
					lost = next;
					failed = err?.message || 'Not saved';
				}
			)
			.finally(() => (pending = false));
	}

	// The field's own keys, matched in place; page hotkeys already skip a focused input.
	function keys(e: KeyboardEvent) {
		if (e.isComposing) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			leave(true);
			return;
		}
		if (!matchesKeyboardEvent(e, multiline ? 'Mod+Enter' : 'Enter')) return;
		e.preventDefault();
		save(true);
	}

	const focus = (el: HTMLInputElement | HTMLTextAreaElement) => {
		el.focus();
		el.select();
	};
</script>

<span class={['inline', { pending, failed, flush }]}>
	{#if editing && multiline}
		<textarea
			class="box"
			aria-label={label}
			{placeholder}
			bind:value={draft}
			onkeydown={keys}
			onblur={() => save(false)}
			{@attach focus}
		></textarea>
	{:else if editing}
		<input
			class="box"
			aria-label={label}
			{placeholder}
			bind:value={draft}
			onkeydown={keys}
			onblur={() => save(false)}
			{@attach focus}
		/>
	{:else}
		<button
			type="button"
			class={['box', 'face', { empty: !shown, multiline }]}
			aria-label="{label}: {shown || placeholder}{failed ? ' (save failed)' : ''}"
			aria-busy={pending}
			{disabled}
			{@attach (el) => {
				face = el;
			}}
			onfocus={edit}
			onclick={edit}
		>
			<span class="text">{shown || placeholder}</span>
			<!-- The resting cue: invisible until hover or focus, and always in the flow so nothing shifts. -->
			<svg class="pen" viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M21.17 6.81a1 1 0 0 0-3.98-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.63l4.35-1.32a2 2 0 0 0 .83-.5z"
				/>
				<path d="m15 5 4 4" />
			</svg>
		</button>
	{/if}
	{#if pending || failed}<span class="spin"><Status state={pending ? 'pending' : 'failed'} message={failed} /></span>{/if}
</span>

<style>
	.inline {
		position: relative;
		display: block;
		min-width: 0;
	}

	/* The box's own padding, taken back so the text sits where plain text would. */
	.flush {
		margin: -0.2em -0.4em;
	}

	/* One box model for both states: same font, padding and border width. */
	.box {
		display: block;
		width: 100%;
		margin: 0;
		padding: 0.2em 0.4em;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background: none;
		color: inherit;
		font: inherit;
		line-height: 1.45;
		text-align: left;
		transition:
			background 0.12s ease,
			border-color 0.12s ease;
	}

	input.box,
	textarea.box {
		border-color: var(--accent);
		background: var(--surface);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 16%, transparent);
	}

	textarea.box {
		resize: none;
		field-sizing: content;
		min-height: calc(1.45em + 0.4em + 2px);
	}

	.face {
		display: flex;
		align-items: baseline;
		gap: 0.4em;
		cursor: text;
	}

	.text {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-decoration: underline dotted transparent;
		text-underline-offset: 0.25em;
		transition: text-decoration-color 0.12s ease;
	}

	.multiline .text {
		white-space: pre-wrap;
	}

	.pen {
		flex: none;
		align-self: center;
		width: 0.75em;
		height: 0.75em;
		fill: none;
		stroke: var(--dim);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0;
		transition: opacity 0.12s ease;
	}

	/* Flush faces sit in headers, where the underline and pencil are cue enough. */
	.inline:not(.flush) .face:hover:not(:disabled) {
		background: var(--hover);
	}

	.face:hover:not(:disabled) .text {
		text-decoration-color: var(--dim);
	}

	.face:hover:not(:disabled) .pen,
	.face:focus-visible .pen {
		opacity: 1;
	}

	/* Hidden while a save is out or failed, so a long name can't put it under the dot. */
	.pending .face .pen,
	.failed .face .pen {
		opacity: 0;
	}

	.face:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
	}

	.face:disabled {
		cursor: default;
	}

	.empty {
		color: var(--dim);
	}

	.pending .face {
		color: var(--muted);
	}

	.failed .face {
		border-color: color-mix(in oklab, var(--danger) 60%, transparent);
	}

	.spin {
		position: absolute;
		inset-block: 0;
		inset-inline-end: 0.4em;
		display: grid;
		place-items: center;
		color: var(--dim);
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.box,
		.text,
		.pen {
			transition: none;
		}
	}
</style>
