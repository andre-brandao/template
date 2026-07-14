<script lang="ts">
	import { Button } from '@template/ui';
	import { createKey } from '../../api/keys.remote';
</script>

{#each createKey.fields.allIssues() ?? [] as issue}
	<p class="error">{issue.message}</p>
{/each}

<form class="add" {...createKey}>
	<input placeholder="Key name, e.g. laptop" {...createKey.fields.name.as('text')} />
	<Button type="submit" pending={!!createKey.pending}>Create</Button>
</form>

<style>
	.add {
		display: flex;
		gap: 0.6em;
		margin-bottom: 1.5em;
	}

	input {
		flex: 1;
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.error {
		color: var(--danger, crimson);
	}
</style>
