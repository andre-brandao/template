<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Field, Select } from '@template/ui';
	import { getKeys } from '$lib/features/keys/api/keys.remote';
	import Nav from '../Nav.svelte';
	import { doc } from './api.remote';
	import { createToken } from './token.svelte';
	import Method from './Method.svelte';

	let { children } = $props();

	// Before the awaits below: context has to be set while the component initializes.
	const token = createToken();
	const ops = $derived((await doc()).list);
	const keys = $derived(await getKeys());
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
			<Select
				options={[
					{ value: '', label: 'None (public)' },
					...keys.map((key) => ({ value: key.key, label: key.name, hint: key.display }))
				]}
				value={token.current}
				onchange={(e) => (token.current = e.currentTarget.value)}
			/>
		</Field>
		{#if !keys.length}
			<p class="hint">
				No keys yet, so authenticated routes answer 401. Mint one in
				<a href="/settings/keys">settings</a>.
			</p>
		{/if}
	{/snippet}

	{#snippet row(op)}
		<span class="method"><Method method={op.method} /></span>
		<span class="path">{op.label}</span>
	{/snippet}
</Nav>

<style>
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
