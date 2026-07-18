<script lang="ts">
	import { Button, Input } from '@template/ui';
	import { createKey } from '../../api/keys.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();
</script>

{#each createKey.fields.allIssues() ?? [] as issue (issue)}
	<p class="error">{issue.message}</p>
{/each}

<form
	class="add"
	{...createKey.enhance(async (f) => {
		await f.submit();
		onsuccess?.();
	})}
>
	<Input placeholder="Key name, e.g. laptop" {...createKey.fields.name.as('text')} />
	<select class="ttl" name="ttl">
		<option value="">Never expires</option>
		<option value="30">30 days</option>
		<option value="90">90 days</option>
		<option value="365">1 year</option>
	</select>
	<Button type="submit" pending={!!createKey.pending}>Create</Button>
</form>

<style>
	.add {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6em;
		margin-bottom: 1.5em;
	}

	.ttl {
		flex: 0 1 auto;
		min-width: 0;
		padding: 0 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	.error {
		color: var(--danger, crimson);
	}
</style>
