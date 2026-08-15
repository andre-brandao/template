<script lang="ts">
	import Button from '../input/Button.svelte';
	import Input from '../input/Input.svelte';
	import { modal, type Ask } from './modal.svelte';

	let { opts }: { opts: Ask } = $props();

	let typed = $state('');
	const ok = $derived(!opts.verify || typed.trim() === opts.verify);
</script>

<h2>{opts.title}</h2>

<p class="warn">{@render opts.body()}</p>

{#if opts.verify}
	<label class="verify">
		<span>Type <code>{opts.verify}</code> to confirm</span>
		<Input
			value={typed}
			autocomplete="off"
			autocapitalize="off"
			spellcheck={false}
			oninput={(e) => (typed = e.currentTarget.value)}
		/>
	</label>
{/if}

<div class="foot">
	<Button variant="ghost" onclick={() => modal.close(false)}>Cancel</Button>
	<Button variant="danger" disabled={!ok} onclick={() => modal.close(true)}>{opts.action}</Button>
</div>

<style>
	h2 {
		margin: 0 0 0.6em;
		font-size: 1.1em;
	}

	.warn {
		margin: 0 0 1.25em;
		color: var(--muted, #666);
		font-size: 0.9em;
		line-height: 1.55;
	}

	/* The prose comes in as the caller's snippet, so its `<b>` carries the caller's scope. */
	.warn :global(b) {
		color: var(--ink, #111);
		font-weight: 600;
		/* The subject is often a URL or an id, which has nowhere natural to break. */
		overflow-wrap: anywhere;
	}

	.verify {
		display: flex;
		flex-direction: column;
		gap: 0.45em;
	}

	/* Deliberately not the global `.field` label, which uppercases its text — the name
	   has to be shown exactly as it must be typed. */
	.verify > span {
		color: var(--muted, #666);
		font-size: 0.85em;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.92em;
		padding: 0.1em 0.35em;
		border-radius: 4px;
		background: var(--surface-2);
		color: var(--ink, #111);
	}

	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 0.6em;
		margin-top: 1.25em;
	}
</style>
