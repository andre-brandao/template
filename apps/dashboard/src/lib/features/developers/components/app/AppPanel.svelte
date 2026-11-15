<script lang="ts">
	import { Button, Drawer, Empty, FormBoundary, Issue, modal } from '@template/ui';
	import { getApp, getAppKeys, getEndpoint, removeApp } from '../../api/apps.remote';
	import { getWebhooks } from '../../api/webhooks.remote';
	import SecretForm from './SecretForm.svelte';
	import KeyForm from '../form/KeyForm.svelte';
	import KeyList from '../list/KeyList.svelte';
	import WebhookForm from '../webhook/WebhookForm.svelte';
	import WebhookRow from '../webhook/WebhookRow.svelte';

	// What an admin configures on an App's profile. The profile itself — header, edit, activity —
	// is the people slice's; the route puts this panel inside it.
	let { id }: { id: string } = $props();

	const app = $derived(await getApp(id));
	const hooks = $derived(await getWebhooks(id));
	const drop = $derived(removeApp.for(id));

	let keying = $state(false);
	let hooking = $state(false);

	// The signing contract, spelled out where the secret lives so nobody has to go looking.
	const example = (url: string) => `body='{"type":"invoice.paid","data":{"id":"inv_1"}}'
ts=$(date +%s)
sig=$(printf '%s' "$body.$ts" | openssl dgst -sha256 -hmac "$SECRET" -binary | basenc --base64url | tr -d =)
curl -X POST ${url} -H "x-webhook-timestamp: $ts" -H "x-webhook-signature: $sig" -d "$body"`;
</script>

{#snippet warn()}
	Its keys, inbound secret and webhooks stop working immediately.
{/snippet}

{#if !app}
	<Empty>That app doesn't exist, or was removed.</Empty>
{:else}
	<section>
		<header>
			<h2>App</h2>
			<FormBoundary>
				{#each drop.fields.allIssues() ?? [] as issue (issue)}
					<Issue>{issue.message}</Issue>
				{/each}
				<form
					{...drop.enhance(async (form) => {
						const ok = await modal.confirm({
							title: 'Remove app',
							action: 'Remove app',
							body: warn
						});
						if (ok) await form.submit();
					})}
				>
					<input {...drop.fields.id.as('hidden', id)} />
					<Button variant="danger" type="submit" pending={!!drop.pending}>Remove app</Button>
				</form>
			</FormBoundary>
		</header>
		<p class="hint">A system account. It never acts above its owner's role.</p>
	</section>

	<section>
		<header>
			<h2>API keys</h2>
			<Button onclick={() => (keying = true)}>New key</Button>
		</header>
		<p class="hint">Send as <code>Authorization: Bearer &lt;key&gt;</code>; each key acts as the App, not as you.</p>
		<KeyList keys={await getAppKeys(id)} app={id} />
	</section>

	<section>
		<header>
			<h2>Inbound</h2>
			<SecretForm {id} held={app.inbound} />
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
		{#if hooks.length === 0}
			<Empty>No webhooks for this app.</Empty>
		{:else}
			<ul>
				{#each hooks as row (row.id)}
					<WebhookRow {row} />
				{/each}
			</ul>
		{/if}
	</section>

	<Drawer bind:open={keying}>
		<h2>New key for {app.name}</h2>
		<KeyForm app={id} onsuccess={() => (keying = false)} />
	</Drawer>

	<Drawer bind:open={hooking}>
		<h2>New webhook for {app.name}</h2>
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
