<script lang="ts">
	import { page } from '$app/state';
	import { Full } from '@template/ui';

	// The raw html block, straight from the parser. Only an iframe becomes a real element;
	// anything else stays inert text, exactly like the renderer's default.
	let { value }: { value: string } = $props();

	const src = $derived(value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1]);
	const height = $derived(value.match(/\sheight=["']?(\d+)/i)?.[1] ?? '600');
	// Siblings resolve against this url inside the frame, so the mockups' cross-links work.
	const url = $derived(
		src &&
			(/^(https?:|\/)/.test(src)
				? src
				: `/dev/prototype/${page.params.feature}/${src.replace(/^\.\//, '')}`)
	);

	let el = $state<HTMLElement>();
</script>

{#if url}
	<div class="frame" bind:this={el}>
		<iframe src={url} title={src} {height}></iframe>
		<div class="bar">
			<a href={url} target="_blank" rel="noopener noreferrer">open ↗</a>
			<Full {el} />
		</div>
	</div>
{:else}
	<p>{value}</p>
{/if}

<style>
	.frame {
		position: relative;
		margin: 1em 0;
	}

	iframe {
		display: block;
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.frame:fullscreen iframe {
		height: 100dvh;
		border: none;
		border-radius: 0;
	}

	.bar {
		position: absolute;
		top: 0.6em;
		right: 0.6em;
		display: flex;
		align-items: center;
		gap: 0.2em;
		padding: 0.15em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: 0.75em;
	}

	a {
		display: flex;
		align-items: center;
		padding: 0.25em 0.5em;
		border-radius: 5px;
		color: var(--muted);
		font: inherit;
		text-decoration: none;
	}

	a:hover {
		background: var(--surface-2);
		color: var(--ink);
	}
</style>
