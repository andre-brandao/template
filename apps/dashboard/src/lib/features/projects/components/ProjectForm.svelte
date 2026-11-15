<script lang="ts">
	import { Button, Field, Input, Issue } from '@template/ui';
	import { create } from '../api/projects.query';

	let { onsuccess }: { onsuccess?: () => void } = $props();

	let name = $state('');
	let description = $state('');

	const save = create({
		onSuccess: () => {
			name = '';
			description = '';
			onsuccess?.();
		}
	});
</script>

{#if save.error}
	<Issue>{save.error.message}</Issue>
{/if}

<form
	class="add"
	onsubmit={(e) => {
		e.preventDefault();
		save.mutate({ body: { name, description: description || undefined } });
	}}
>
	<Field label="Name">
		<Input
			placeholder="Quarterly close"
			required
			value={name}
			oninput={(e) => (name = e.currentTarget.value)}
		/>
	</Field>

	<Field label="Description">
		<Input
			placeholder="What is this for?"
			value={description}
			oninput={(e) => (description = e.currentTarget.value)}
		/>
	</Field>

	<div class="footer">
		<Button type="submit" pending={save.isPending}>Add project</Button>
	</div>
</form>

<style>
	.add {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
	}
</style>
