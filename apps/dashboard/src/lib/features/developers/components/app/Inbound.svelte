<script lang="ts">
	import type { App } from '@template/core/app';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Issue, Section, Skeleton, Status } from '@template/ui';
	import { endpoint } from '../../api/apps.query';
	import { secret } from './secret';

	let { app }: { app: App.Info } = $props();

	const url = createQuery(() => endpoint(app.id));
	const inbound = secret();

	// The signing contract, spelled out where the secret lives so nobody has to go looking.
	const example = (to: string) => `body='{"type":"invoice.paid","data":{"id":"inv_1"}}'
ts=$(date +%s)
sig=$(printf '%s' "$body.$ts" | openssl dgst -sha256 -hmac "$SECRET" -binary | basenc --base64url | tr -d =)
curl -X POST ${to} -H "x-webhook-timestamp: $ts" -H "x-webhook-signature: $sig" -d "$body"`;
</script>

{#snippet signed()}
	Signed posts become <code>app.received</code> events.
{/snippet}

<Section divider title="Inbound" description={signed}>
	<div class="bar">
		{#if inbound.spin.error}<Status state="failed" message={inbound.spin.error.message} />{/if}
		<Button pending={inbound.spin.isPending} onclick={() => inbound.run(app)}>
			{app.inbound ? 'Rotate secret' : 'Generate secret'}
		</Button>
	</div>
	{#if url.data}
		<pre>{example(url.data)}</pre>
	{:else if url.isError}
		<Issue retry={() => url.refetch()}>{url.error.message}</Issue>
	{:else}
		<Skeleton h="6em" />
	{/if}
</Section>

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6em;
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
