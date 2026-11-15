<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, modal, toast } from '@template/ui';
	import { remove } from '../api/projects.query';

	let { id, name }: { id: string; name: string } = $props();

	const drop = remove({ onSuccess: () => goto('/projects') });

	async function ask() {
		const ok = await modal.confirm({
			title: 'Delete project',
			action: 'Delete project',
			body: warn,
			verify: name
		});
		if (!ok) return;
		// The toast reports a failure; there is nothing else to do with it here.
		toast
			.promise(drop.mutateAsync({ path: { id } }), {
				loading: 'Deleting project…',
				success: 'Project deleted',
				error: (e) => (e as Error)?.message ?? 'Could not delete project'
			})
			.catch(() => {});
	}
</script>

{#snippet warn()}
	This removes <b>{name}</b> along with its stages and its insights. Todos filed under it are kept
	and stay in the Todos list.
{/snippet}

<Button variant="danger" onclick={ask}>Delete project</Button>
