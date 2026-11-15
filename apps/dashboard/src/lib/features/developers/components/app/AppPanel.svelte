<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Empty, Issue, Section, Skeleton, Status, modal } from '@template/ui';
	import { app, endpoint, owned, rotate } from '../../api/apps.query';
	import { hooks } from '../../api/webhooks.query';
	import KeyForm from '../key/KeyForm.svelte';
	import KeyRow from '../key/KeyRow.svelte';
	import List from '../List.svelte';
	import Loading from '../Loading.svelte';
	import Reveal from '../Reveal.svelte';
	import WebhookForm from '../webhook/WebhookForm.svelte';
	import WebhookRow from '../webhook/WebhookRow.svelte';
	import Delete from './Delete.svelte';

	// What an admin configures on an App's profile, as sections of the people slice's page.
	let { id }: { id: string } = $props();

	const row = createQuery(() => app(id));
	const subs = createQuery(() => hooks(id));
	const keys = createQuery(() => owned(id));
	const url = createQuery(() => endpoint(id));
	// The panel outlives the reveal, so reset drops the secret from the mutation's data.
	const spin = rotate({
		onSuccess: (data) => {
			spin.reset();
			modal(Reveal, { title: 'Inbound secret', secret: data.secret });
		}
	});

	const key = () => modal(KeyForm, { app: id });
	const hook = () => modal(WebhookForm, { owner: id });

	// Rotating breaks whatever signs with the current secret, so only a held one asks first.
	async function cycle(held: boolean) {
		if (held && !(await modal.confirm({ title: 'Rotate secret', action: 'Rotate', body: cut }))) return;
		spin.mutate(id);
	}

	// The signing contract, spelled out where the secret lives so nobody has to go looking.
	const example = (to: string) => `body='{"type":"invoice.paid","data":{"id":"inv_1"}}'
ts=$(date +%s)
sig=$(printf '%s' "$body.$ts" | openssl dgst -sha256 -hmac "$SECRET" -binary | basenc --base64url | tr -d =)
curl -X POST ${to} -H "x-webhook-timestamp: $ts" -H "x-webhook-signature: $sig" -d "$body"`;
</script>

{#snippet cut()}
	The current inbound secret stops working at once.
{/snippet}

{#snippet bearer()}
	Send as <code>Authorization: Bearer &lt;key&gt;</code>. Each key acts as the App.
{/snippet}

{#snippet signed()}
	Signed posts become <code>app.received</code> events.
{/snippet}

{#snippet keyed()}
	{#if keys.isPending}
		<Loading rows={2} />
	{:else if keys.isError}
		<Issue>{keys.error.message}</Issue>
	{:else if keys.data.length === 0}
		<div class="none">
			<Empty>
				No keys yet.
				{#snippet action()}<Button onclick={key}>New key</Button>{/snippet}
			</Empty>
		</div>
	{:else}
		<div class="bar"><Button variant="secondary" onclick={key}>New key</Button></div>
		<List>
			{#each keys.data as one (one.id)}
				<KeyRow key={one} app={id} />
			{/each}
		</List>
	{/if}
{/snippet}

{#snippet subscribed()}
	{#if subs.isPending}
		<Loading rows={2} />
	{:else if subs.isError}
		<Issue>{subs.error.message}</Issue>
	{:else if subs.data.length === 0}
		<div class="none">
			<Empty>
				No webhooks for this app.
				{#snippet action()}<Button onclick={hook}>New webhook</Button>{/snippet}
			</Empty>
		</div>
	{:else}
		<div class="bar"><Button variant="secondary" onclick={hook}>New webhook</Button></div>
		<List>
			{#each subs.data as one (one.id)}
				<WebhookRow row={one} />
			{/each}
		</List>
	{/if}
{/snippet}

{#if row.isPending}
	<Skeleton h="12em" />
{:else if row.isError || !row.data}
	<Issue>{row.error?.message ?? "That app doesn't exist, or was removed."}</Issue>
{:else}
	{@const held = row.data.inbound}
	<Section divider title="API keys" description={bearer}>
		{@render keyed()}
	</Section>

	<Section divider title="Inbound" description={signed}>
		<div class="bar">
			{#if spin.isPending || spin.error}
				<Status state={spin.isPending ? 'pending' : 'failed'} message={spin.error?.message} />
			{/if}
			<Button variant="secondary" pending={spin.isPending} onclick={() => cycle(held)}>
				{held ? 'Rotate secret' : 'Generate secret'}
			</Button>
		</div>
		{#if url.data}
			<pre>{example(url.data)}</pre>
		{:else if url.isError}
			<Issue>{url.error.message}</Issue>
		{:else}
			<Skeleton h="6em" />
		{/if}
	</Section>

	<Section divider title="Webhooks" description="Events delivered to this app's endpoints.">
		{@render subscribed()}
	</Section>

	<Section
		danger
		divider
		title="Delete app"
		description="Its keys, inbound secret and webhooks stop working immediately."
	>
		<Delete {id} name={row.data.name} ondone={() => goto('/developers/apps')}>
			{#snippet children(ask, pending)}
				<!-- A block wrapper so the button keeps its own width in the stretched column. -->
				<div><Button variant="danger" {pending} onclick={ask}>Delete app</Button></div>
			{/snippet}
		</Delete>
	</Section>
{/if}

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6em;
	}

	/* The empty state sits in the box its list will fill, so it lines up with the section. */
	.none {
		border: 1px dashed var(--border);
		border-radius: var(--radius);
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
</style>
