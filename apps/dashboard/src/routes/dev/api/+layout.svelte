<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Select } from '@template/ui';
	import { getKeys } from '$lib/features/keys/api/keys.remote';
	import { doc } from './api.remote';
	import { createToken } from './token.svelte';
	import Method from './Method.svelte';

	let { children } = $props();

	// Before the awaits below: context has to be set while the component initializes.
	const token = createToken();
	const ops = $derived((await doc()).list);
	const tags = $derived([...new Set(ops.map((one) => one.tag))]);
	const keys = $derived(await getKeys());
</script>

<div class="split">
	<nav aria-label="Operations">
		<label class="field">
			<span>auth</span>
			<Select
				options={[
					{ value: '', label: 'None (public)' },
					...keys.map((key) => ({ value: key.key, label: key.name, hint: key.display }))
				]}
				value={token.current}
				onchange={(e) => (token.current = e.currentTarget.value)}
			/>
		</label>
		{#if !keys.length}
			<p class="hint">
				No keys yet, so authenticated routes answer 401. Mint one in
				<a href="/settings/keys">settings</a>.
			</p>
		{/if}

		{#each tags as tag (tag)}
			<h2>{tag}</h2>
			{#each ops.filter((one) => one.tag === tag) as op (op.id)}
				<a
					class="navlink"
					href={resolve('/dev/api/[op]', { op: op.id })}
					aria-current={page.params.op === op.id ? 'page' : undefined}
				>
					<span class="method"><Method method={op.method} /></span>
					<span class="path">{op.path}</span>
				</a>
			{/each}
		{/each}
	</nav>
	<div class="pane">{@render children()}</div>
</div>

<style>
	.split {
		display: flex;
		align-items: flex-start;
		gap: 2em;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		width: 15em;
		flex-shrink: 0;
		position: sticky;
		top: calc(var(--topbar) + 1.75em);
	}

	.hint {
		margin: 0.5em 0 0;
		color: var(--dim);
		font-size: 0.75em;
		line-height: 1.5;
	}

	h2 {
		margin: 1.4em 0 0.3em;
		padding-left: 0.7em;
		font-family: var(--font-mono);
		font-size: 0.65em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.navlink {
		display: flex;
		gap: 0.5em;
		font-family: var(--font-mono);
		font-size: 0.75em;
		padding: 0.4em 0.7em;
	}

	.method {
		width: 3.5em;
		flex-shrink: 0;
	}

	.path {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.pane {
		flex: 1;
		min-width: 0;
	}

	@media (max-width: 900px) {
		.split {
			flex-direction: column;
		}

		nav {
			position: static;
			width: 100%;
		}
	}
</style>
