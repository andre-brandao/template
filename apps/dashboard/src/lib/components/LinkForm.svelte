<!-- Raised through `modal(LinkForm, { add })`; the write comes in, so any slice can reuse it. -->
<script lang="ts">
	import { Button, Field, Input, Issue } from '@template/ui';

	let {
		add,
		close
	}: {
		add: (link: { url: string; title?: string }) => Promise<unknown>;
		close: () => void;
	} = $props();

	let pending = $state(false);
	let error = $state<string>();

	// A remote command rejects with `{ body: { message } }`, the query SDK with the body itself.
	async function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		const title = String(data.get('title') ?? '').trim();
		pending = true;
		error = undefined;
		await add({ url: String(data.get('url')), title: title || undefined }).then(
			() => close(),
			(err: { message?: string; body?: { message?: string } }) => {
				error = err.body?.message ?? err.message ?? 'Could not save the link';
			}
		);
		pending = false;
	}
</script>

<h2>Add link</h2>

<form onsubmit={submit}>
	{#if error}<Issue>{error}</Issue>{/if}

	<Field label="URL">
		<Input type="url" name="url" placeholder="https://…" required autofocus />
	</Field>

	<Field label="Title">
		<Input name="title" placeholder="Optional" maxlength={200} />
	</Field>

	<div class="foot">
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button type="submit" {pending}>Add link</Button>
	</div>
</form>

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.05em;
		font-weight: 600;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 0.5em;
	}
</style>
