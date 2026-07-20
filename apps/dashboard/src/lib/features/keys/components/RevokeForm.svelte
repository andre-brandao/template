<script lang="ts">
	import { Button, FormBoundary } from '@template/ui';
	import { removeKey } from '../api/keys.remote';

	let { id, label = 'Revoke' }: { id: string; label?: string } = $props();

	const revoke = $derived(removeKey.for(id));
	const issues = $derived(revoke.fields.allIssues() ?? []);
	const pending = $derived(!!revoke.pending);
</script>

<FormBoundary>
	{#each issues as issue (issue)}
		<p class="error">{issue.message}</p>
	{/each}

	<form {...revoke}>
		<input {...revoke.fields.id.as('hidden', id)} />
		<Button variant="danger" type="submit" {pending}>{label}</Button>
	</form>
</FormBoundary>
