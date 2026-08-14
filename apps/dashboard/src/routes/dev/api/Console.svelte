<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '@template/ui';
	import Params from './Params.svelte';
	import Result from './Result.svelte';
	import Snippets from './Snippets.svelte';
	import Url from './Url.svelte';
	import { token } from './token.svelte';
	import { doc, send } from './api.remote';

	type Op = Awaited<ReturnType<typeof doc>>['list'][number];

	let { op, base }: { op: Op; base: string } = $props();

	const auth = token();

	let values = $state<Record<string, string>>({});
	// Seeded once — the page keys this component on the id, so a new operation remounts.
	let body = $state(untrack(() => op.body));
	let busy = $state(false);
	let res = $state<Awaited<ReturnType<typeof send>> | null>(null);

	const path = $derived(
		op.path.replace(/\{(\w+)\}/g, (_, name) => encodeURIComponent(values[name] ?? ''))
	);
	const query = $derived(op.params.filter((one) => one.in === 'query'));
	const search = $derived(
		new URLSearchParams(
			query
				.filter((one) => values[one.name])
				.map((one) => [one.name, values[one.name] ?? ''])
		).toString()
	);
	const url = $derived(search ? `${path}?${search}` : path);

	// The upload route takes a file part, which this console has no way to build.
	const upload = $derived(op.mime === 'multipart/form-data');

	async function run() {
		busy = true;
		res = await send({
			method: op.method,
			path: url,
			token: auth.current,
			body: op.mime === 'application/json' ? body : ''
		}).catch((err) => ({ status: 0, ms: 0, headers: {}, text: String(err) }));
		busy = false;
	}
</script>

<!-- The method and path live in the bar below, where they are editable — not repeated here. -->
<header>
	<h1>{op.summary || op.path}</h1>
	{#if op.description}<p class="desc">{op.description}</p>{/if}
</header>

<!-- Above the form and sticky: Send keeps its place however tall the request grows. -->
<div class="bar">
	<Url method={op.method} {base} path={op.path} {search} bind:values />
	<Button onclick={run} pending={busy} disabled={upload}>Send</Button>
</div>

{#if upload}
	<p class="note">
		Takes <code>multipart/form-data</code>. Upload a file from the files screen instead.
	</p>
{/if}

<Params params={query} bind:values />

{#if op.mime === 'application/json'}
	<label class="field body">
		<span>body</span>
		<textarea rows="10" spellcheck="false" bind:value={body}></textarea>
	</label>
{/if}

<Snippets
	input={{
		method: op.method,
		url,
		base,
		id: op.id,
		token: auth.current,
		body: op.mime === 'application/json' ? body : '',
		values
	}}
/>

{#if res}
	<Result {res} />
{/if}

<style>
	header {
		margin-bottom: 1em;
	}

	h1 {
		margin: 0 0 0.3em;
		font-size: 1.1em;
	}

	.desc {
		margin: 0;
		max-width: 70ch;
		color: var(--muted);
		font-size: 0.85em;
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.8em;
		position: sticky;
		top: var(--topbar);
		z-index: 1;
		margin-bottom: 1.2em;
		padding: 0.7em 0;
		background: var(--bg);
	}

	.body {
		margin-bottom: 1.2em;
	}

	textarea {
		font: inherit;
		font-family: var(--font-mono);
		font-size: 0.78em;
		resize: vertical;
		padding: 0.6em 0.8em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	textarea:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.note {
		margin: 0 0 1.2em;
		color: var(--muted);
		font-size: 0.82em;
	}

	code {
		font-family: var(--font-mono);
	}
</style>
