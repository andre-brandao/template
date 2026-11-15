<!--
	The frame of a `modal(Of)` body: heading, an error, the fields, then Cancel and the main
	action. Without `onsubmit` it only acknowledges: one button, `submit` ("Done"), that closes.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../input/Button.svelte';
	import Issue from '../issue/Issue.svelte';

	let {
		title,
		close,
		onsubmit,
		submit = 'Done',
		pending = false,
		error,
		children
	}: {
		title: string;
		/** The `close` prop `modal()` hands its body. */
		close: () => void;
		onsubmit?: () => void;
		/** The main button's label: say what it makes, "Create project". */
		submit?: string;
		pending?: boolean;
		error?: string;
		children: Snippet;
	} = $props();
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		(onsubmit ?? close)();
	}}
>
	<h2>{title}</h2>
	{#if error}<Issue>{error}</Issue>{/if}
	{@render children()}
	<div class="foot">
		{#if onsubmit}<Button variant="ghost" onclick={close}>Cancel</Button>{/if}
		<Button variant="primary" type="submit" {pending}>{submit}</Button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	h2 {
		margin: 0;
		font-size: 1.1em;
		font-weight: 600;
	}

	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 0.6em;
		margin-top: 0.25em;
	}
</style>
