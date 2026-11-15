<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Drawer, Empty, Issue, Skeleton, modal } from '@template/ui';
	import { getEndpoint } from '../../api/apps.remote';
	import { app, hooks, owned, remove } from '../../api/developers.query';
	import SecretForm from './SecretForm.svelte';
	import KeyForm from '../form/KeyForm.svelte';
	import KeyList from '../list/KeyList.svelte';
	import WebhookForm from '../webhook/WebhookForm.svelte';
	import WebhookRow from '../webhook/WebhookRow.svelte';

	// What an admin configures on an App's profile. The profile itself — header, edit, activity —
	// is the people slice's; the route puts this panel inside it.
	let { id }: { id: string } = $props();

	const row = createQuery(() => app(id));
	const subs = createQuery(() => hooks(id));
	const keys = createQuery(() => owned(id));
	const drop = remove({ onSuccess: () => goto('/developers/apps') });

	let keying = $state(false);
	let hooking = $state(false);

	async function ask() {
		const ok = await modal.confirm({ title: 'Remove app', action: 'Remove app', body: warn });
		if (ok) drop.mutate({ path: { id } });
	}

	// The signing contract, spelled out where the secret lives so nobody has to go looking.
	const example = (url: string) => `body='{"type":"invoice.paid","data":{"id":"inv_1"}}'
ts=$(date +%s)
sig=$(printf '%s' "$body.$ts" | openssl dgst -sha256 -hmac "$SECRET" -binary | basenc --base64url | tr -d =)
curl -X POST ${url} -H "x-webhook-timestamp: $ts" -H "x-webhook-signature: $sig" -d "$body"`;
</script>

{#snippet warn()}
	Its keys, inbound secret and webhooks stop working immediately.
{/snippet}

{#if row.isPending}
	<Skeleton h="12em" />
{:else if row.isError}
	<Empty>That app doesn't exist, or was removed.</Empty>
{:else}
	<section>
		<header>
			<h2>App</h2>
			<Button variant="danger" pending={drop.isPending} onclick={ask}>Remove app</Button>
		</header>
		{#if drop.error}
			<Issue>{drop.error.message}</Issue>
		{/if}
		<p class="hint">A system account. It never acts above its owner's role.</p>
	</section>

	<section>
		<header>
			<h2>API keys</h2>
			<Button onclick={() => (keying = true)}>New key</Button>
		</header>
		<p class="hint">Send as <code>Authorization: Bearer &lt;key&gt;</code>; each key acts as the App, not as you.</p>
		{#if keys.isPending}
			<Skeleton h="4em" />
		{:else if keys.isError}
			<Issue>{keys.error.message}</Issue>
		{:else}
			<KeyList keys={keys.data} app={id} />
		{/if}
	</section>

	<section>
		<header>
			<h2>Inbound</h2>
			<SecretForm {id} held={row.data.inbound} />
		</header>
		<p class="hint">
			Signed posts become <code>app.received</code> events. Nothing acts on them until a subscriber does.
		</p>
		<pre>{example(await getEndpoint(id))}</pre>
	</section>

	<section>
		<header>
			<h2>Webhooks</h2>
			<Button onclick={() => (hooking = true)}>New webhook</Button>
		</header>
		{#if subs.isPending}
			<Skeleton h="4em" />
		{:else if subs.isError}
			<Issue>{subs.error.message}</Issue>
		{:else if subs.data.length === 0}
			<Empty>No webhooks for this app.</Empty>
		{:else}
			<ul>
				{#each subs.data as hook (hook.id)}
					<WebhookRow row={hook} />
				{/each}
			</ul>
		{/if}
	</section>

	<Drawer bind:open={keying}>
		<h2>New key for {row.data.name}</h2>
		<KeyForm app={id} onsuccess={() => (keying = false)} />
	</Drawer>

	<Drawer bind:open={hooking}>
		<h2>New webhook for {row.data.name}</h2>
		<WebhookForm owner={id} onsuccess={() => (hooking = false)} />
	</Drawer>
{/if}

<style>
	section {
		margin-top: 2em;
	}

	section header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		margin-bottom: 0.6em;
	}

	h2 {
		margin: 0;
		font-size: 1.05em;
	}

	.hint {
		margin: 0 0 0.8em;
		font-size: 0.8em;
		color: var(--muted);
	}

	pre {
		margin: 0;
		padding: 0.8em;
		border-radius: var(--radius);
		background: var(--bg);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.45);
		font-family: var(--font-mono);
		font-size: 0.78em;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}


	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}
</style>
