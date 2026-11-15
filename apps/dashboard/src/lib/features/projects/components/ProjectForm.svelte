<!-- Raised through `modal(ProjectForm)`, which passes `close`. -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Dialog, Field, Input, Textarea } from '@template/ui';
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

<Dialog
	title="New project"
	submit="Create project"
	pending={save.isPending}
	error={save.error?.message}
	{close}
	onsubmit={() => save.mutate({ body: { name, description: description || undefined } })}
>
	<Field label="Name">
		<Input placeholder="Quarterly close" required autofocus bind:value={name} />
	</Field>

	<Field label="Description">
		<Textarea placeholder="What is this for?" rows={2} bind:value={description} />
	</Field>
</Dialog>
