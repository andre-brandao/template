<script lang="ts">
	import { Button, Field, Input, Issue } from '@template/ui';
	import type { File as Entry } from '@template/sdk/query';
	import { rename } from '../api/files.query';

	let { file, onsuccess }: { file: Entry; onsuccess?: () => void } = $props();

	const name = $derived(file.key.split('/').at(-1) ?? file.key);
	const save = rename({ onSuccess: () => onsuccess?.() });

	// Reset whenever the drawer switches to another file.
	let to = $derived(name);
</script>

{#if save.error}
	<Issue>{save.error.message}</Issue>
{/if}

<form
	class="edit"
	onsubmit={(e) => {
		e.preventDefault();
		save.mutate({ path: { name }, body: { name: to } });
	}}
>
	<Field label="Name">
		<Input required value={to} oninput={(e) => (to = e.currentTarget.value)} />
	</Field>

	<div class="footer">
		<Button type="submit" pending={save.isPending}>Save</Button>
	</div>
</form>

<style>
	.edit {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
	}
</style>
