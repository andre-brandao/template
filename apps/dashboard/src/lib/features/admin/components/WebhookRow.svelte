<script lang="ts">
	import { Button, FormBoundary } from '@template/ui';
	import type { Webhook } from '@template/core/webhook';
	import { fmt } from '$lib/utils/fmt';
	import { disableWebhook, enableWebhook, removeWebhook } from '../api/admin.remote';

	let { row }: { row: Webhook.Info } = $props();

	const f = fmt();
	let shown = $state(false);

	const toggle = $derived((row.enabled ? disableWebhook : enableWebhook).for(row.id));
	const drop = $derived(removeWebhook.for(row.id));
	const issues = $derived([
		...(toggle.fields.allIssues() ?? []),
		...(drop.fields.allIssues() ?? [])
	]);

	const scope = $derived(row.types.length ? row.types.join(', ') : 'every event');
	const health = $derived(
		row.timeDelivered
			? `delivered ${f.ago(row.timeDelivered)}${row.lastStatus ? ` · ${row.lastStatus}` : ''}`
			: 'never delivered'
	);
	// The rail reads at a glance: off, struggling, or fine.
	const rail = $derived(
		!row.enabled ? 'var(--dim)' : row.failures ? 'var(--danger, #c0392b)' : 'var(--accent)'
	);
</script>

<li style:--rail={rail} class:gone={!row.enabled}>
	<div class="meta">
		<span class="url">{row.url}</span>
		<span class="sub">{scope}</span>
		<span class="sub">
			{health}{#if row.failures}
				· {row.failures} consecutive {row.failures === 1 ? 'failure' : 'failures'}
			{/if}
		</span>
	</div>

	<div class="secret" class:revealed={shown}>
		<code>{shown ? row.secret : row.display}</code>
	</div>

	<FormBoundary>
		{#each issues as issue (issue)}
			<p class="error">{issue.message}</p>
		{/each}

		<div class="acts">
			<Button onclick={() => (shown = !shown)}>{shown ? 'Hide' : 'Reveal'}</Button>
			<Button onclick={() => navigator.clipboard.writeText(row.secret)}>Copy</Button>

			<form {...toggle}>
				<input {...toggle.fields.id.as('hidden', row.id)} />
				<Button type="submit" pending={!!toggle.pending}>
					{row.enabled ? 'Disable' : 'Enable'}
				</Button>
			</form>

			<form {...drop}>
				<input {...drop.fields.id.as('hidden', row.id)} />
				<Button variant="danger" type="submit" pending={!!drop.pending}>Delete</Button>
			</form>
		</div>
	</FormBoundary>
</li>

<style>
	li {
		display: flex;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
		padding: 0.8em 1em 0.8em calc(1em - 2px);
		border: 1px solid var(--border);
		border-left: 3px solid var(--rail);
		border-radius: var(--radius);
		background: var(--surface);
	}

	/* Disabled subscriptions stay legible but visibly inert — they're listed to be re-enabled. */
	.gone {
		opacity: 0.55;
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 14em;
		flex: 1 1 16em;
	}

	.url {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.sub {
		font-size: 0.78em;
		color: var(--dim);
	}

	.secret {
		flex: 1 1 12em;
		min-width: 10em;
		padding: 0.45em 0.65em;
		border-radius: calc(var(--radius) - 2px);
		background: var(--bg);
	}

	.secret code {
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		overflow-wrap: anywhere;
	}

	.secret.revealed code {
		color: var(--ink);
	}

	.acts {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin-left: auto;
	}

	.error {
		margin: 0 0 0.4em;
		font-size: 0.85em;
		color: var(--danger, #c0392b);
	}
</style>
