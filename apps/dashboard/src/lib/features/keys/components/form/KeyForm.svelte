<script lang="ts">
	import { Button, Input } from '@template/ui';
	import { createKey } from '../../api/keys.remote';
</script>

{#each createKey.fields.allIssues() ?? [] as issue (issue)}
	<p class="error">{issue.message}</p>
{/each}

<form class="add" {...createKey}>
	<Input placeholder="Key name, e.g. laptop" {...createKey.fields.name.as('text')} />
	<Button type="submit" pending={!!createKey.pending}>Create</Button>
</form>

<style>
	.add {
		display: flex;
		gap: 0.6em;
		margin-bottom: 1.5em;
	}

	.error {
		color: var(--danger, crimson);
	}
</style>
