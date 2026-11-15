<!-- The message box, the model picker, and send or stop. Typed while a form waits, it answers it. -->
<script lang="ts">
	import { IconButton, Kbd, Textarea } from '@template/ui';
	import Send from '@lucide/svelte/icons/send-horizontal';
	import Square from '@lucide/svelte/icons/square';
	import { agent } from '../agent.svelte';
	import { talking, waiting } from '../ask/pending';
	import ModelPicker from './ModelPicker.svelte';

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
	<div class="box">
		<Textarea
			bind:value={text}
			rows={2}
			placeholder={hint}
			aria-label="Message"
			onkeydown={keydown}
			{@attach (el) => {
				if (ctx.open) el.focus();
			}}
		/>
	</div>
	<div class="row">
		<ModelPicker bind:value={ctx.model} />
		<span class="send">
			<span class="key"><Kbd keys="Enter" /></span>
			{#if busy}
				<IconButton label="Stop" onclick={() => ctx.chat.stop()}>
					<Square size={17} strokeWidth={1.75} />
				</IconButton>
			{:else}
				<IconButton type="submit" label="Send" disabled={!text.trim()}>
					<Send size={17} strokeWidth={1.75} />
				</IconButton>
			{/if}
		</span>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		padding-top: 0.75em;
		border-top: 1px solid var(--border);
		flex-shrink: 0;
	}

	.box {
		display: grid;
		margin: 0 var(--gutter, 0.75em) 0.75em;
	}

	/* The page footer's height and rule, so its top border runs on through the dock. */
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		height: var(--footer);
		padding-inline: var(--gutter, 0.75em);
		border-top: 1px solid var(--border);
		--control: 2em;
	}

	.send {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
	}

	.key {
		display: inline-flex;
		font-size: 0.8em;
	}
</style>
