<script lang="ts">
	import { dev } from '$app/environment';
	import { Button, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { Types } from '@template/core/webhook/types';
	import { createWebhook } from '../api/admin.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();

	// What `scripts/testing/webhook.ts` listens on, so a local endpoint is one click away.
	const local = 'http://localhost:4000/';

	const groups = [...new Set(Types.map((t) => t.split('.')[0]!))];

	// Empty means every event, which is also what an empty `types` column means to the worker.
	let pick = $state<string[]>([]);
	const list = $derived(pick.length ? Types.filter((t) => pick.includes(t.split('.')[0]!)) : Types);

	function choose(entity?: string) {
		if (!entity) return (pick = []);
		pick = pick.includes(entity) ? pick.filter((e) => e !== entity) : [...pick, entity];
	}

	let el: HTMLInputElement;

	// The field is uncontrolled, so fill the element and let the form pick the change up.
	function fill() {
		el.value = local;
		el.dispatchEvent(new Event('input', { bubbles: true }));
	}
</script>

<FormBoundary>
	{#each createWebhook.fields.allIssues() ?? [] as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		{...createWebhook.enhance(async (f) => {
			await f.submit();
			f.element.reset();
			pick = [];
			onsuccess?.();
		})}
	>
		<Field label="Endpoint URL">
			<Input
				placeholder="https://example.com/hooks"
				{...createWebhook.fields.url.as('url')}
				{@attach (node) => void (el = node as HTMLInputElement)}
			/>
		</Field>

		{#if dev}
			<button type="button" class="local" onclick={fill}>
				Use the local receiver — <code>{local}</code>
			</button>
		{/if}

		<fieldset>
			<legend>Events</legend>

			<div class="chips">
				<button type="button" class:on={!pick.length} onclick={() => choose()}>All events</button>
				{#each groups as entity (entity)}
					<button type="button" class:on={pick.includes(entity)} onclick={() => choose(entity)}>
						{entity}
					</button>
				{/each}
			</div>

			<!-- The catalog is fixed; the chips only decide which of these go along. -->
			{#each Types as type (type)}
				<input
					hidden
					{...createWebhook.fields.types.as('checkbox', type)}
					checked={!!pick.length && list.includes(type)}
				/>
			{/each}

			<p class="hint">
				{#if pick.length}
					Delivers {list.length} of {Types.length} events.
				{:else}
					Delivers every published event, including any added later.
				{/if}
			</p>

			<div class="types">
				{#each list as type (type)}
					<code>{type}</code>
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

	.local {
		align-self: flex-start;
		margin-top: -0.8em;
		padding: 0;
		border: 0;
		background: none;
		color: var(--dim);
		font: inherit;
		font-size: 0.8em;
		cursor: pointer;
	}

	.local:hover {
		color: var(--accent);
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

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
		margin-top: 0.5em;
	}

	.chips button {
		padding: 0.35em 0.7em;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--muted);
		font: inherit;
		font-size: 0.85em;
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.chips button:hover {
		border-color: var(--accent);
	}

	.chips button.on {
		border-color: var(--accent);
		color: var(--accent);
	}

	.hint {
		margin: 0.8em 0 0.5em;
		font-size: 0.8em;
		color: var(--dim);
	}

	.types {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35em;
	}

	.types code {
		padding: 0.2em 0.5em;
		border-radius: 4px;
		background: var(--bg);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
