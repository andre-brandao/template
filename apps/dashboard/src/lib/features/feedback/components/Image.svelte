<!--
	The markdown `img` override. GitHub's attachment hosts only serve inside a GitHub session, so
	a picture there becomes a link out instead of a broken image; any other picture (a print the
	person attached) renders inline, linked so it opens full size.
-->
<script lang="ts">
	let { src, alt, title }: { src: string; alt: string; title?: string } = $props();

	const github = $derived(
		/^https?:\/\/(github\.com\/user-attachments\/|(private-)?user-images\.githubusercontent\.com\/)/i.test(
			src
		)
	);
</script>

{#if github}
	<a href={src} target="_blank" rel="noreferrer" {title}>{alt || 'image on GitHub'}</a>
{:else}
	<a class="print" href={src} target="_blank" rel="noreferrer" {title}>
		<img {src} {alt} loading="lazy" />
	</a>
{/if}

<style>
	.print {
		display: inline-block;
		max-width: 100%;
		line-height: 0;
	}

	img {
		max-width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
</style>
