<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Empty, Issue, Skeleton, Status, modal } from '@template/ui';
	import { getEndpoint } from '../../api/apps.remote';
	import { app, hooks, owned, remove, rotate } from '../../api/developers.query';
	import KeyForm from '../key/KeyForm.svelte';
	import KeyList from '../key/KeyList.svelte';
	import List from '../List.svelte';
	import Loading from '../Loading.svelte';
	import Reveal from '../Reveal.svelte';
	import WebhookForm from '../webhook/WebhookForm.svelte';
	import WebhookRow from '../webhook/WebhookRow.svelte';

	// What an admin configures on an App's profile. The profile itself is the people slice's;
	// the route puts this panel inside it.
	let { id }: { id: string } = $props();

	const row = createQuery(() => app(id));
	const subs = createQuery(() => hooks(id));
	const keys = createQuery(() => owned(id));
	const drop = remove({ onSuccess: () => goto('/developers/apps') });
	// The panel outlives the reveal, so reset drops the secret from the mutation's data.
	const spin = rotate({
		onSuccess: (data) => {
			spin.reset();
			modal(Reveal, { title: 'Inbound secret', secret: data.secret });
		}
	});

	const key = () => modal(KeyForm, { app: id });
	const hook = () => modal(WebhookForm, { owner: id });

	async function cycle(held: boolean) {
		if (held && !(await modal.confirm({ title: 'Rotate secret', action: 'Rotate', body: cut }))) return;
		spin.mutate({ path: { id } });
	}

	async function ask(name: string) {
		const ok = await modal.confirm({ title: 'Delete app', action: 'Delete app', body: warn, verify: name });
		if (ok) drop.mutate({ path: { id } });
	}

	// The signing contract, spelled out where the secret lives so nobody has to go looking.
	const example = (url: string) => `body='{"type":"invoice.paid","data":{"id":"inv_1"}}'
ts=$(date +%s)
sig=$(printf '%s' "$body.$ts" | openssl dgst -sha256 -hmac "$SECRET" -binary | basenc --base64url | tr -d =)
curl -X POST ${url} -H "x-webhook-timestamp: $ts" -H "x-webhook-signature: $sig" -d "$body"`;
</script>

{#snippet cut()}
	The current inbound secret stops working at once.
{/snippet}

{#snippet warn()}
	Its keys, inbound secret and webhooks stop working immediately.
{/snippet}

{#snippet listed()}
	{#if keys.isPending}
		<Loading rows={2} />
	{:else if keys.isError}
		<Issue>{keys.error.message}</Issue>
	{:else}
		<KeyList keys={keys.data} app={id} create={key} />
	{/if}
{/snippet}

{#snippet subscribed()}
	{#if subs.isPending}
		<Loading rows={2} />
	{:else if subs.isError}
		<Issue>{subs.error.message}</Issue>
	{:else if subs.data.length === 0}
		<Empty>
			No webhooks for this app.
			{#snippet action()}
				<Button onclick={hook}>New webhook</Button>
			{/snippet}
		</Empty>
	{:else}
		<List>
			{#each subs.data as one (one.id)}
				<WebhookRow row={one} />
			{/each}
		</List>
	{/if}
{/snippet}

{#if row.isPending}
	<Skeleton h="12em" />
{:else if row.isError}
	<Empty>That app doesn't exist, or was removed.</Empty>
{:else}
	<section>
		<header>
			<h2>API keys</h2>
			<Button variant="secondary" onclick={key}>New key</Button>
		</header>
		<p class="hint">Send as <code>Authorization: Bearer &lt;key&gt;</code>; each key acts as the App.</p>
		{@render listed()}
	</section>

	<section>
		<header>
			<h2>
				Inbound
				{#if spin.isPending || spin.error}
					<Status state={spin.isPending ? 'pending' : 'failed'} message={spin.error?.message} />
				{/if}
			</h2>
			<Button variant="secondary" pending={spin.isPending} onclick={() => cycle(row.data.inbound)}>
				{row.data.inbound ? 'Rotate secret' : 'Generate secret'}
			</Button>
		</header>
		<p class="hint">Signed posts become <code>app.received</code> events.</p>
		<pre>{example(await getEndpoint(id))}</pre>
	</section>

	<section>
		<header>
			<h2>Webhooks</h2>
			<Button variant="secondary" onclick={hook}>New webhook</Button>
		</header>
		{@render subscribed()}
	</section>

	<section class="danger">
		<header>
			<h2>Delete app</h2>
			<Button variant="danger" pending={drop.isPending} onclick={() => ask(row.data.name)}>Delete</Button>
		</header>
		{#if drop.error}
			<Issue>{drop.error.message}</Issue>
		{/if}
	</section>
{/if}

<style>
	section {
		margin-top: 2em;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		margin-bottom: 0.5em;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin: 0;
		font-size: 0.95em;
		font-weight: 600;
	}

	.hint {
		margin: 0 0 0.7em;
		font-size: 0.8em;
		color: var(--muted);
	}

	pre {
		margin: 0;
		padding: 0.8em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
		font-family: var(--font-mono);
		font-size: 0.78em;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.danger {
		padding-top: 1.2em;
		border-top: 1px solid var(--border);
	}
</style>
