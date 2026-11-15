<!-- The form's root: title, its questions and context blocks, then send or discuss. -->
<script lang="ts">
	import { createHotkeyAttachment } from '@tanstack/svelte-hotkeys';
	import { Button, Kbd } from '@template/ui';
	import Help from '@lucide/svelte/icons/message-circle-question-mark';
	import type { Block } from '../catalog';
	import { form } from '../state.svelte';

	let { props, children }: Block<'Form'> = $props();

	const ctx = form();
	// Mod+Enter sends from any field, a multiline one included.
	const send = createHotkeyAttachment('Mod+Enter', () => ctx.ready && ctx.send());

	function submit(e: SubmitEvent) {
		e.preventDefault();
		ctx.send();
	}
</script>

<form class="form" onsubmit={submit} {@attach send}>
	<header>
		<Help size={16} strokeWidth={1.75} />
		<div>
			<h3>{props.title ?? ''}</h3>
			{#if props.description}<p>{props.description}</p>{/if}
		</div>
	</header>
	<div class="body">{@render children?.()}</div>
	<footer>
		<Button variant="ghost" onclick={ctx.talk}>Discuss in chat</Button>
		<Button variant="primary" type="submit" disabled={!ctx.ready}>
			{props.submit ?? 'Send'}
			<Kbd keys="Mod+Enter" />
		</Button>
	</footer>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
		padding: 0.85em 0.95em;
		border: 1px solid var(--border-bright);
		border-radius: var(--radius);
		background: var(--surface);
	}

	header {
		display: flex;
		gap: 0.5em;
		color: var(--accent);
	}

	h3 {
		margin: 0;
		color: var(--ink);
		font-size: 0.95em;
	}

	p {
		margin: 0.2em 0 0;
		color: var(--muted);
		font-size: 0.8em;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.4em;
	}
</style>
