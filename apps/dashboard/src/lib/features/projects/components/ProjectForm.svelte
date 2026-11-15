<!-- Raised through `modal(ProjectForm)`, which passes `close`. -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Field, Input, Issue } from '@template/ui';
	import { create } from '../api/projects.query';

	let { close }: { close: () => void } = $props();

	let name = $state('');
	let description = $state('');

	const save = create({
		onSuccess: (project) => {
			close();
			goto(`/projects/${project.id}`);
		}
	});
</script>

<h2>New project</h2>

<form
	onsubmit={(e) => {
		e.preventDefault();
		save.mutate({ body: { name, description: description || undefined } });
	}}
>
	{#if save.error}<Issue>{save.error.message}</Issue>{/if}

	<Field label="Name">
		<Input
			placeholder="Quarterly close"
			required
			autofocus
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

	<div class="foot">
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button type="submit" pending={save.isPending}>Create project</Button>
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
