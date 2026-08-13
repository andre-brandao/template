<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Power from '@lucide/svelte/icons/power';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Button, FormBoundary, Modal } from '@template/ui';
	import type { Webhook } from '@template/core/webhook';
	import { fmt } from '$lib/utils/fmt';
	import { disableWebhook, enableWebhook, removeWebhook } from '../api/admin.remote';

	let { row }: { row: Webhook.Info } = $props();

	const f = fmt();
	let shown = $state(false);
	let open = $state(false);

	const toggle = $derived((row.enabled ? disableWebhook : enableWebhook).for(row.id));
	const drop = $derived(removeWebhook.for(row.id));
	// Delete issues render inside the modal, which covers the row while it's open.
	const issues = $derived(toggle.fields.allIssues() ?? []);

	const scope = $derived(row.types.length ? row.types.join(', ') : 'every event');

	// The last delivery in one line. The button already says enabled or not, so a disabled
	// row keeps the detail — usually the failures that switched it off — and just greys it.
	const badge = $derived.by(() => {
		const state = () => {
			if (!row.lastStatus) return { label: 'no deliveries', tone: 'idle' };
			if (row.failures)
				return {
					label: `${row.lastStatus} · ${row.failures} consecutive ${row.failures === 1 ? 'failure' : 'failures'}`,
					tone: 'bad'
				};
			// `timeDelivered` only moves on success, so it pairs with a clean status.
			const at = row.timeDelivered ? ` · delivered ${f.ago(row.timeDelivered)}` : '';
			return { label: `${row.lastStatus}${at}`, tone: 'ok' };
		};
		const now = state();
		return row.enabled ? now : { label: now.label, tone: 'off' };
	});
	// The rail repeats the tone down the edge, so a failing row is findable in a long list.
	const rail = $derived(
		!row.enabled ? 'var(--dim)' : row.failures ? 'var(--danger, #c0392b)' : 'var(--accent)'
	);
</script>

<li style:--rail={rail} class:gone={!row.enabled}>
	<div class="meta">
		<span class="url">{row.url}</span>
		<span class="sub">{scope}</span>
	</div>

	<!-- Reveal and copy act on the secret, so they live in its field rather than the row. -->
	<div class="secret" class:revealed={shown}>
		<code>{shown ? row.secret : row.display}</code>
		<button type="button" onclick={() => (shown = !shown)} title={shown ? 'Hide' : 'Reveal'}>
			{#if shown}<EyeOff size={15} />{:else}<Eye size={15} />{/if}
		</button>
		<button
			type="button"
			onclick={() => navigator.clipboard.writeText(row.secret)}
			title="Copy secret"
		>
			<Copy size={15} />
		</button>
	</div>

	<FormBoundary>
		{#each issues as issue (issue)}
			<p class="error">{issue.message}</p>
		{/each}

		<div class="acts">
			<button type="button" onclick={() => (open = true)} title="Delete webhook">
				<Trash2 size={16} />
			</button>
		</div>

		<!-- The switch and what it produced, together — the status only means anything next to it. -->
		<form class="power" {...toggle}>
			<input {...toggle.fields.id.as('hidden', row.id)} />
			<button
				type="submit"
				class:on={row.enabled}
				disabled={!!toggle.pending}
				aria-pressed={row.enabled}
				title={row.enabled ? 'Disable' : 'Enable'}
			>
				<Power size={16} />
				{row.enabled ? 'Enabled' : 'Disabled'}
			</button>
			<span class="status {badge.tone}">{badge.label}</span>
		</form>

		<Modal bind:open>
			<h2>Delete webhook</h2>

			<p class="warn">
				Deliveries to <b>{row.url}</b> stop at once, including any retries still in flight. Its signing
				secret goes with it — a replacement subscription gets a new one.
			</p>

			<form {...drop}>
				<input {...drop.fields.id.as('hidden', row.id)} />

				{#each drop.fields.allIssues() ?? [] as issue (issue)}
					<p class="error">{issue.message}</p>
				{/each}

				<div class="foot">
					<Button variant="ghost" type="button" onclick={() => (open = false)}>Cancel</Button>
					<Button variant="danger" type="submit" pending={!!drop.pending}>Delete webhook</Button>
				</div>
			</form>
		</Modal>
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
		display: flex;
		align-items: center;
		gap: 0.3em;
		flex: 1 1 12em;
		min-width: 10em;
		padding: 0.35em 0.4em 0.35em 0.65em;
		border-radius: calc(var(--radius) - 2px);
		background: var(--bg);
	}

	.secret code {
		flex: 1;
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		overflow-wrap: anywhere;
	}

	.secret.revealed code {
		color: var(--ink);
	}

	.secret button {
		display: grid;
		place-items: center;
		padding: 0.3em;
		border: 0;
		border-radius: calc(var(--radius) - 2px);
		background: none;
		color: var(--dim);
		cursor: pointer;
	}

	.secret button:hover {
		color: var(--ink);
	}

	.acts {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin-left: auto;
	}

	.acts button {
		display: grid;
		place-items: center;
		padding: 0.5em;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) - 2px);
		background: var(--bg);
		color: var(--dim);
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.acts button:hover {
		border-color: var(--danger, #c0392b);
		color: var(--danger, #c0392b);
	}

	/* Fixed width so every row's panel lines up, however long its status reads. */
	.power {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.35em;
		flex: 0 0 12em;
		padding: 0.5em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
	}

	.power button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45em;
		padding: 0.4em 0.6em;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) - 2px);
		background: var(--surface);
		color: var(--dim);
		font: inherit;
		font-family: var(--font-mono);
		font-size: 0.8em;
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.status {
		font-size: 0.72em;
		text-align: center;
		color: var(--muted);
	}

	.status.ok {
		color: var(--accent);
	}

	.status.bad {
		color: var(--danger, #c0392b);
	}

	.status.off {
		color: var(--dim);
	}

	.power button.on {
		border-color: var(--accent);
		color: var(--accent);
	}

	.power button:hover:not(:disabled) {
		border-color: var(--border-bright, var(--accent));
	}

	.power button:disabled {
		cursor: default;
		opacity: 0.6;
	}

	h2 {
		margin: 0 0 0.6em;
		font-size: 1.1em;
	}

	.warn {
		margin: 0 0 1.25em;
		color: var(--muted);
		font-size: 0.9em;
		line-height: 1.55;
	}

	.warn b {
		color: var(--ink);
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 0.6em;
		margin-top: 1.25em;
	}

	.error {
		margin: 0 0 0.4em;
		font-size: 0.85em;
		color: var(--danger, #c0392b);
	}
</style>
