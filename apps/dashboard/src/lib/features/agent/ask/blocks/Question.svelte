<!-- A question's frame: its label, an optional hint, and why the model suggested the answer. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	let {
		label,
		hint,
		reason,
		id,
		children
	}: {
		label?: string;
		hint?: string | null;
		reason?: string | null;
		id?: string;
		children: Snippet;
	} = $props();
</script>

<fieldset class="question">
	<legend><label for={id}>{label ?? ''}</label></legend>
	{#if hint}<p class="hint">{hint}</p>{/if}
	{@render children()}
	{#if reason}
		<p class="reason"><Sparkles size={12} strokeWidth={1.75} /> {reason}</p>
	{/if}
</fieldset>

<style>
	.question {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		min-width: 0;
		margin: 0;
		padding: 0;
		border: none;
	}

	legend {
		padding: 0;
		font-size: 0.9em;
		font-weight: 600;
	}

	.hint,
	.reason {
		margin: 0;
		color: var(--muted);
		font-size: 0.78em;
	}

	.reason {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		color: var(--accent);
	}
</style>
