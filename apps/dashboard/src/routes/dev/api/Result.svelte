<script lang="ts">
	import { Code } from '@template/ui';
	import Verdict from './Verdict.svelte';
	import type { send } from './api.remote';

	let { res }: { res: Awaited<ReturnType<typeof send>> } = $props();

	const lang = $derived(res.headers['content-type']?.includes('json') ? 'json' : 'plaintext');
	const headers = $derived(
		Object.entries(res.headers)
			.map(([name, value]) => `${name}: ${value}`)
			.join('\n')
	);
</script>

<section>
	<div class="status">
		<Verdict status={res.status} />
		<span>{res.ms}ms</span>
		<span>{res.headers['content-type'] ?? ''}</span>
	</div>
	<Code value={res.text} {lang} max="30em" />
	<details>
		<summary>Response headers</summary>
		<Code value={headers} lang="http" max="30em" />
	</details>
</section>

<style>
	section {
		margin-top: 2em;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 0.8em;
		margin-bottom: 0.6em;
		font-family: var(--font-mono);
		font-size: 0.75em;
		color: var(--dim);
	}

	details {
		margin-top: 0.8em;
		font-size: 0.8em;
		color: var(--muted);
	}

	summary {
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.9em;
		margin-bottom: 0.5em;
	}
</style>
