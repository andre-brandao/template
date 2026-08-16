<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { createKey } from '../../api/keys.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();
</script>

<FormBoundary>
	{#each createKey.fields.allIssues() ?? [] as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		class="add"
		{...createKey.enhance(async (f) => {
			await f.submit();
			onsuccess?.();
		})}
	>
		<Field label="Name" style="flex: 1 1 14em">
			<Input placeholder="e.g. laptop" {...createKey.fields.name.as('text')} />
		</Field>
		<Field label="Expires" style="flex: 0 1 auto">
			<select name="ttl">
				<option value="">Never expires</option>
				<option value="30">30 days</option>
				<option value="90">90 days</option>
				<option value="365">1 year</option>
			</select>
		</Field>
		<Button type="submit" pending={!!createKey.pending}>Create</Button>
	</form>
</FormBoundary>

<style>
	.add {
		display: flex;
		align-items: end;
		flex-wrap: wrap;
		gap: 0.6em;
		margin-bottom: 1.5em;
	}

	select {
		min-width: 0;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	select:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
