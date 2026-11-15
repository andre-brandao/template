<script module lang="ts">
	import { createHighlighter } from '@tanstack/highlight/core';
	import { css } from '@tanstack/highlight/languages/css';
	import { diff } from '@tanstack/highlight/languages/diff';
	import { html } from '@tanstack/highlight/languages/html';
	import { http } from '@tanstack/highlight/languages/http';
	import { js } from '@tanstack/highlight/languages/js';
	import { json } from '@tanstack/highlight/languages/json';
	import { markdown } from '@tanstack/highlight/languages/markdown';
	import { plaintext } from '@tanstack/highlight/languages/plaintext';
	import { shell } from '@tanstack/highlight/languages/shell';
	import { sql } from '@tanstack/highlight/languages/sql';
	import { svelte } from '@tanstack/highlight/languages/svelte';
	import { ts } from '@tanstack/highlight/languages/ts';
	import { yaml } from '@tanstack/highlight/languages/yaml';

	// Only the languages the app renders; anything else falls back to plaintext.
	const hl = createHighlighter({
		languages: [css, diff, html, http, js, json, markdown, plaintext, shell, sql, svelte, ts, yaml]
	});
</script>

<script lang="ts">
	import './code.css';

	let {
		value,
		lang,
		title,
		max
	}: {
		value: string;
		lang?: string;
		title?: string;
		/** Caps the height, framed as a scrolling pane: a response, a snippet. */
		max?: string;
	} = $props();

	// Tokenising is synchronous and on the main thread, so oversized payloads stay plain.
	const out = $derived(value.length > 50_000 ? undefined : hl.tokenize(value, { lang }));
</script>

{#snippet body()}<pre class={['tm-code', { pane: !!max }]} style:max-height={max} data-lang={out?.lang ?? 'plaintext'}><code>{#if out}{#each out.tokens as tok, i (i)}{#if tok.className}<span class="tm-{tok.className}">{tok.value}</span>{:else}{tok.value}{/if}{/each}{:else}{value}{/if}</code></pre>{/snippet}

{#if title}
	<figure class="tm-code-frame" data-lang={out?.lang ?? 'plaintext'}>
		<figcaption>{title}</figcaption>
		{@render body()}
	</figure>
{:else}
	{@render body()}
{/if}
