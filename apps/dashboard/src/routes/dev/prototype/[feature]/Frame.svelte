<script lang="ts">
	import { page } from '$app/state';

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

	// Inline rather than a glyph: the ⛶ codepoint has no glyph in many system fonts.
	const grow = 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3';
	const shrink = 'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3';

	let el = $state<HTMLElement>();
	let big = $state(false);

	function full() {
		if (document.fullscreenElement) return void document.exitFullscreen();
		el?.requestFullscreen();
	}
</script>

{#if url}
	<div class="frame" bind:this={el} onfullscreenchange={() => (big = !!document.fullscreenElement)}>
		<iframe src={url} title={src} {height}></iframe>
		<div class="bar">
			<a href={url} target="_blank" rel="noopener noreferrer">open ↗</a>
			<button
				type="button"
				title={big ? 'Exit full screen' : 'Full screen'}
				aria-label={big ? 'Exit full screen' : 'Full screen'}
				onclick={full}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<path d={big ? shrink : grow} />
				</svg>
			</button>
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

	a,
	button {
		display: flex;
		align-items: center;
		padding: 0.25em 0.5em;
		border: none;
		border-radius: 5px;
		background: transparent;
		color: var(--muted);
		font: inherit;
		text-decoration: none;
		cursor: pointer;
	}

	a:hover,
	button:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	svg {
		width: 13px;
		height: 13px;
	}
</style>
