<script lang="ts">
	import { renderMermaidASCII, renderMermaidSVG } from 'beautiful-mermaid';
	import Code from '../code/Code.svelte';
	import Full from '../full/Full.svelte';

	// `ascii` swaps the SVG for box-drawing text — same source, terminal-shaped output.
	let { value, ascii = false }: { value: string; ascii?: boolean } = $props();

	let el = $state<HTMLElement>();
	let zoom = $state(1);
	let view = $state<'diagram' | 'code'>('diagram');

	// Synchronous and DOM-free, so this renders on the server too. Colours go in as CSS
	// custom properties, so a theme switch repaints the SVG without a re-render.
	const out = $derived.by(() => {
		try {
			// colorMode none keeps it plain text, so it renders escaped rather than through {@html}.
			if (ascii) return { svg: '', text: renderMermaidASCII(value, { colorMode: 'none' }), err: '' };
			const svg = renderMermaidSVG(value, {
				bg: 'var(--surface)',
				fg: 'var(--ink)',
				accent: 'var(--accent)',
				muted: 'var(--muted)',
				border: 'var(--border-bright)',
				transparent: true
			});
			return { svg, text: '', err: '' };
		} catch (e) {
			return { svg: '', text: '', err: e instanceof Error ? e.message : String(e) };
		}
	});
</script>

<figure class="mermaid" bind:this={el}>
	<div class="bar">
		<div class="tabs">
			<button type="button" class:on={view === 'diagram'} onclick={() => (view = 'diagram')}>
				Diagram
			</button>
			<button type="button" class:on={view === 'code'} onclick={() => (view = 'code')}>Code</button>
		</div>
		<div class="right">
			{#if view === 'diagram' && !ascii && !out.err}
				<button type="button" aria-label="Zoom out" onclick={() => (zoom = Math.max(0.5, zoom - 0.25))}>
					−
				</button>
				<button type="button" title="Reset zoom" onclick={() => (zoom = 1)}>
					{Math.round(zoom * 100)}%
				</button>
				<button type="button" aria-label="Zoom in" onclick={() => (zoom = Math.min(4, zoom + 0.25))}>
					+
				</button>
			{/if}
			<Full {el} />
		</div>
	</div>

	{#if view === 'diagram' && !out.err}
		{#if ascii}
			<pre class="ascii">{out.text}</pre>
		{:else}
			<div class="canvas">
				<!-- The svg carries a viewBox, so a percentage width scales it whole. -->
				<div class="fit" style="width: {zoom * 100}%">{@html out.svg}</div>
			</div>
		{/if}
	{:else}
		<!-- On a parse error the highlighted source is the useful fallback. -->
		<Code {value} lang="mermaid" />
		{#if out.err && view === 'diagram'}
			<p class="err">{out.err}</p>
		{/if}
	{/if}
</figure>

<style>
	.mermaid {
		margin: 0.8em 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4em;
		padding: 0.3em 0.4em;
		border-bottom: 1px solid var(--border);
	}

	.tabs,
	.right {
		display: flex;
		align-items: center;
		gap: 0.15em;
		font-family: var(--font-mono);
		font-size: 0.72em;
	}

	button {
		border: 1px solid transparent;
		border-radius: 5px;
		padding: 0.25em 0.6em;
		background: transparent;
		color: var(--muted);
		font: inherit;
		cursor: pointer;
	}

	button:hover,
	button.on {
		background: var(--surface-2);
		color: var(--ink);
	}

	.ascii {
		margin: 0;
		padding: 1em;
		overflow: auto;
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.75em;
		line-height: 1.25;
	}

	.canvas {
		display: flex;
		/* `safe`: zoomed past the frame it aligns to the start instead of centring the
		   overflow out of reach. */
		justify-content: safe center;
		padding: 1em;
		overflow: auto;
	}

	.fit {
		flex: none;
	}

	.fit :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}

	.err {
		margin: 0;
		padding: 0.6em 1em;
		border-top: 1px solid var(--border);
		color: var(--danger);
		font-family: var(--font-mono);
		font-size: 0.75em;
	}

	.mermaid:fullscreen {
		display: flex;
		flex-direction: column;
		margin: 0;
		border: 0;
		border-radius: 0;
		background: var(--bg);
	}

	.mermaid:fullscreen .canvas {
		flex: 1;
		min-height: 0;
	}
</style>
