<script lang="ts">
	import { untrack } from 'svelte';
	import { Button, Field } from '@template/ui';
	import Params from './Params.svelte';
	import Responses from './Responses.svelte';
	import Result from './Result.svelte';
	import Schema from './Schema.svelte';
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

<!-- The console you drive on the left, the reference that never moves on the right. -->
<div class="panes">
	<section class="console" aria-label="Try it">
		<!-- Sticky within the card: Send keeps its place however tall the request grows. -->
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
			<Field label="body" style="margin-bottom: 1.2em">
				<textarea rows="10" spellcheck="false" bind:value={body}></textarea>
			</Field>
		{/if}

		<!-- Always rendered, so the arriving response fills a slot instead of growing the card. -->
		<div class="out">
			{#if res}
				<Result {res} />
			{:else}
				<p class="idle">Send the request to see the response here.</p>
			{/if}
		</div>
	</section>

	<!-- Scrolls itself rather than the page, so a 15-field schema doesn't bury the console. -->
	<aside class="docs">
		<!-- First: it mirrors the request you just built, so it belongs next to the console. -->
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

		{#if op.fields.length}
			<details class="schema" open>
				<summary>body schema <code>{op.mime}</code></summary>
				<Schema fields={op.fields} />
			</details>
		{/if}

		<Responses responses={op.responses} />
	</aside>
</div>

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

	/* Golden ratio: the console keeps the wider side, since its params grid and body editor
	   need it most. Below the breakpoint the two stack and the page scrolls as before. */
	.panes {
		display: grid;
		grid-template-columns: 1.618fr 1fr;
		align-items: start;
		gap: 2em;
	}

	/* Without this the tracks size to their content's minimum, so a long url in the bar widens
	   the whole column and re-flows the params grid as you type. */
	.console,
	.docs {
		min-width: 0;
	}

	/* The card is the boundary the docs beside it don't cross: everything inside is yours to
	   drive, and hitting Send only ever changes what is in here. */
	.console {
		padding: 0 1.1em 1.1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.8em;
		position: sticky;
		top: var(--topbar);
		z-index: 1;
		/* Full-bleed across the card's padding, so scrolled content passes behind it. */
		margin: 0 -1.1em 1.2em;
		padding: 0.9em 1.1em;
		border-bottom: 1px solid var(--border);
		border-radius: var(--radius) var(--radius) 0 0;
		background: var(--surface-2);
	}

	.out {
		margin-top: 1.2em;
		padding-top: 1em;
		border-top: 1px solid var(--border);
		/* Reserved: the result drops into a slot that is already this tall, so nothing shifts. */
		min-height: 11em;
	}

	.out :global(section) {
		margin-top: 0;
	}

	.idle {
		margin: 0;
		color: var(--dim);
		font-size: 0.82em;
	}

	.docs {
		position: sticky;
		top: calc(var(--topbar) + 1em);
		max-height: calc(100vh - var(--topbar) - 3em);
		overflow-y: auto;
		scrollbar-gutter: stable;
	}

	.docs :global(> section:first-child) {
		margin-top: 0;
	}

	@media (max-width: 1100px) {
		.panes {
			grid-template-columns: 1fr;
		}

		.docs {
			position: static;
			max-height: none;
			overflow-y: visible;
		}
	}

	.schema {
		margin-bottom: 1.2em;
		padding-bottom: 0.6em;
		border-bottom: 1px solid var(--border);
	}

	.schema summary {
		cursor: pointer;
		margin-bottom: 0.4em;
		font-family: var(--font-mono);
		font-size: 0.72em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.schema summary code {
		text-transform: none;
		letter-spacing: 0;
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
