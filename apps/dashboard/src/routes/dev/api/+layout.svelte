<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button, Field, Input } from '@template/ui';
	import { mintKey } from '$lib/features/keys/api/keys.remote';
	import Nav from '../Nav.svelte';
	import { doc } from './api.remote';
	import { createToken } from './token.svelte';
	import Method from './Method.svelte';

	let { children } = $props();

	// Before the awaits below: context has to be set while the component initializes.
	const token = createToken();
	const ops = $derived((await doc()).list);
	const mint = async () => (token.current = await mintKey());
	const items = $derived(
		ops.map((op) => ({
			href: resolve('/dev/api/[op]', { op: op.id }),
			label: op.path,
			group: op.tag,
			active: page.params.op === op.id,
			method: op.method
		}))
	);
</script>

<Nav label="Operations" {items} {children}>
	{#snippet head()}
		<Field label="auth">
			<Input
				placeholder="sk-…"
				value={token.current}
				oninput={(e) => (token.current = e.currentTarget.value)}
			/>
		</Field>
		<div class="mint">
			<Button variant="secondary" pending={!!mintKey.pending} onclick={mint}>Mint a test key</Button>
			<p class="hint">
				Expires in a day. Any other key has to be pasted — one is only readable when minted, in
				<a href="/settings/keys">settings</a>.
			</p>
		</div>
	{/snippet}

	{#snippet row(op)}
		<span class="method"><Method method={op.method} /></span>
		<span class="path">{op.label}</span>
	{/snippet}
</Nav>

<style>
	.mint {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		align-items: start;
	}

	.hint {
		margin: 0;
		color: var(--dim);
		font-size: 0.75em;
		line-height: 1.5;
	}

	.method {
		width: 3.5em;
		flex-shrink: 0;
		font-family: var(--font-mono);
	}

	.path {
		font-family: var(--font-mono);
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
