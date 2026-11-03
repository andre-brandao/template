<!-- The message box, the model picker, and send or stop. Typed while a form waits, it answers it. -->
<script lang="ts">
	import Send from '@lucide/svelte/icons/send-horizontal';
	import Square from '@lucide/svelte/icons/square';
	import { getModels } from '../api/agent.remote';
	import { agent } from '../agent.svelte';
	import { talking, waiting } from '../ask/pending';
	import Icon from './Icon.svelte';

	const ctx = agent();
	let text = $state('');

	const busy = $derived(ctx.chat.isLoading && !waiting.size);
	const hint = $derived.by(() => {
		if (talking.size) return 'Ask or explain…';
		if (waiting.size) return 'Answer above, or write here…';
		return 'Ask the assistant…';
	});

	function submit(e?: SubmitEvent) {
		e?.preventDefault();
		const value = text.trim();
		if (!value || busy) return;
		text = '';
		ctx.send(value);
	}

	function keydown(e: KeyboardEvent) {
		if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
		e.preventDefault();
		submit();
	}
</script>

<form onsubmit={submit}>
	<textarea bind:value={text} rows={3} placeholder={hint} aria-label="Message" onkeydown={keydown}
	></textarea>
	<div class="row">
		<svelte:boundary>
			{@const models = await getModels()}
			<select
				aria-label="Model"
				bind:value={() => ctx.model ?? models.default, (value) => (ctx.model = value)}
			>
				{#each models.ids as id (id)}
					<option value={id}>{id}</option>
				{/each}
			</select>
			{#snippet pending()}
				<span class="hint">Loading models…</span>
			{/snippet}
			{#snippet failed()}
				<span class="hint">Models unavailable</span>
			{/snippet}
		</svelte:boundary>
		{#if busy}
			<Icon aria-label="Stop" onclick={() => ctx.chat.stop()}>
				<Square size={17} strokeWidth={1.75} />
			</Icon>
		{:else}
			<Icon type="submit" aria-label="Send" disabled={!text.trim()}>
				<Send size={17} strokeWidth={1.75} />
			</Icon>
		{/if}
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 0.75em var(--gutter, 0.75em);
		border-top: 1px solid var(--border);
		flex-shrink: 0;
	}

	textarea {
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		resize: none;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
	}

	select {
		min-width: 0;
		max-width: 70%;
		padding: 0.25em 0.4em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--muted);
		font: inherit;
		font-size: 0.8em;
	}

	.hint {
		color: var(--dim);
		font-size: 0.8em;
	}
</style>
