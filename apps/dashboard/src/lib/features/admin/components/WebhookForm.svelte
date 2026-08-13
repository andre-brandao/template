<script lang="ts">
	import { Button, FormBoundary, Input } from '@template/ui';
	import { Types } from '@template/core/webhook/types';
	import { createWebhook } from '../api/admin.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();
</script>

<FormBoundary>
	{#each createWebhook.fields.allIssues() ?? [] as issue (issue)}
		<p class="error">{issue.message}</p>
	{/each}

	<form
		{...createWebhook.enhance(async (f) => {
			await f.submit();
			f.element.reset();
			onsuccess?.();
		})}
	>
		<label class="field">
			<span>Endpoint URL</span>
			<Input placeholder="https://example.com/hooks" {...createWebhook.fields.url.as('url')} />
		</label>

		<fieldset>
			<legend>Events</legend>
			<p class="hint">Check nothing to receive every published event.</p>
			<div class="types">
				{#each Types as type (type)}
					<label class="type">
						<input {...createWebhook.fields.types.as('checkbox', type)} />
						<code>{type}</code>
					</label>
				{/each}
			</div>
		</fieldset>

		<Button type="submit" pending={!!createWebhook.pending}>Create</Button>
	</form>
</FormBoundary>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}

	.field span {
		font-size: 0.85em;
		color: var(--muted);
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		padding: 0;
		font-size: 0.85em;
		color: var(--muted);
	}

	.hint {
		margin: 0.2em 0 0.7em;
		font-size: 0.8em;
		color: var(--dim);
	}

	.types {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11em, 1fr));
		gap: 0.4em;
	}

	.type {
		display: flex;
		align-items: center;
		gap: 0.45em;
		font-size: 0.85em;
	}

	.type code {
		font-family: var(--font-mono);
	}

	.error {
		margin: 0 0 0.6em;
		font-size: 0.85em;
		color: var(--danger, #c0392b);
	}
</style>
