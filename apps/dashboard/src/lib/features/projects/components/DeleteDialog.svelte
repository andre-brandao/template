<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, modal, toast } from '@template/ui';
	import { removeProject } from '../api/projects.remote';

	let { id, name }: { id: string; name: string } = $props();

	async function drop() {
		const ok = await modal.confirm({
			title: 'Delete project',
			action: 'Delete project',
			body: warn,
			verify: name
		});
		if (!ok) return;
		// The toast reports a failure; there is nothing else to do with it here.
		toast
			.promise(removeProject(id), {
				loading: 'Deleting project…',
				success: 'Project deleted',
				error: (e) => (e as Error)?.message ?? 'Could not delete project'
			})
			.then(
				() => goto('/projects'),
				() => {}
			);
	}
</script>

{#snippet warn()}
	This removes <b>{name}</b> along with its stages and its insights. Todos filed under it are kept
	and stay in the Todos list.
{/snippet}

<Button variant="danger" onclick={drop}>Delete project</Button>
