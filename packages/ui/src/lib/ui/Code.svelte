<script lang="ts">
	import { tokenize } from '@tanstack/highlight';
	import './code.css';

	let { value, lang, title }: { value: string; lang?: string; title?: string } = $props();

	// Tokenising is synchronous and on the main thread, so oversized payloads stay plain.
	const out = $derived(value.length > 50_000 ? undefined : tokenize(value, { lang }));
</script>

{#snippet body()}<pre class="tm-code" data-lang={out?.lang ?? 'plaintext'}><code>{#if out}{#each out.tokens as tok, i (i)}{#if tok.className}<span class="tm-{tok.className}">{tok.value}</span>{:else}{tok.value}{/if}{/each}{:else}{value}{/if}</code></pre>{/snippet}

{#if title}
	<figure class="tm-code-frame" data-lang={out?.lang ?? 'plaintext'}>
		<figcaption>{title}</figcaption>
		{@render body()}
	</figure>
{:else}
	{@render body()}
{/if}
