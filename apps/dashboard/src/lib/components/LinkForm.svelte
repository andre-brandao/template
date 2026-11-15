<!-- Raised through `modal(LinkForm, { add })`; the write comes in, so any slice can reuse it. -->
<script lang="ts">
	import { Dialog, Field, Input } from '@template/ui';
	import { message } from '#lib/query.ts';

	let {
		add,
		close
	}: {
		add: (link: { url: string; title?: string }) => Promise<unknown>;
		close: () => void;
	} = $props();

	let url = $state('');
	let title = $state('');
	let pending = $state(false);
	let error = $state<string>();

	function submit() {
		pending = true;
		error = undefined;
		add({ url, title: title.trim() || undefined })
			.then(close, (err) => (error = message(err)))
			.finally(() => (pending = false));
	}
</script>

<Dialog title="Add link" submit="Add link" {pending} {error} {close} onsubmit={submit}>
	<Field label="URL">
		<Input type="url" placeholder="https://…" required autofocus bind:value={url} />
	</Field>

	<Field label="Title">
		<Input placeholder="Optional" maxlength={200} bind:value={title} />
	</Field>
</Dialog>
