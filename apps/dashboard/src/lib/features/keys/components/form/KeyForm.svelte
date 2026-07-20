<script lang="ts">
	import { Button, FormBoundary, Input } from '@template/ui';
	import { createKey } from '../../api/keys.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();
</script>

<FormBoundary>
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
		<label class="field name">
			<span>Name</span>
			<Input placeholder="e.g. laptop" {...createKey.fields.name.as('text')} />
		</label>
		<label class="field ttl">
			<span>Expires</span>
			<select name="ttl">
				<option value="">Never expires</option>
				<option value="30">30 days</option>
				<option value="90">90 days</option>
				<option value="365">1 year</option>
			</select>
		</label>
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

	.name {
		flex: 1 1 14em;
	}

	.ttl {
		flex: 0 1 auto;
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
