<script lang="ts">
	import Code from '../code/Code.svelte';
	import Mermaid from './Mermaid.svelte';

	let { value, lang, title }: { value: string; lang?: string; title?: string } = $props();
</script>

{#if lang === 'mermaid'}
	<Mermaid {value} />
{:else}
	<Code {value} {lang} {title} />
{/if}
