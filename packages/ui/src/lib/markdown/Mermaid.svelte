<script lang="ts">
	import { renderMermaidASCII, renderMermaidSVG } from 'beautiful-mermaid';
	import Code from '../code/Code.svelte';

	// `ascii` swaps the SVG for box-drawing text — same source, terminal-shaped output.
	let { value, ascii = false }: { value: string; ascii?: boolean } = $props();

	let el = $state<HTMLElement>();
	let view = $state<'diagram' | 'code'>('diagram');
	let big = $state(false);

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

	function full() {
		if (document.fullscreenElement) return void document.exitFullscreen();
		el?.requestFullscreen();
	}
</script>

<figure
	class="mermaid"
	bind:this={el}
	onfullscreenchange={() => (big = !!document.fullscreenElement)}
>
	<div class="bar">
		<div class="tabs">
			<button type="button" class:on={view === 'diagram'} onclick={() => (view = 'diagram')}>
				Diagram
			</button>
			<button type="button" class:on={view === 'code'} onclick={() => (view = 'code')}>Code</button>
		</div>
		<button
			type="button"
			class="full"
			title={big ? 'Exit full screen' : 'Full screen'}
			aria-label={big ? 'Exit full screen' : 'Full screen'}
			onclick={full}
		>
			{big ? '✕' : '⛶'}
		</button>
	</div>

	{#if view === 'diagram' && !out.err}
		{#if ascii}
			<pre class="ascii">{out.text}</pre>
		{:else}
			<div class="canvas">{@html out.svg}</div>
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

	.tabs {
		display: flex;
		gap: 0.15em;
	}

	button {
		border: 1px solid transparent;
		border-radius: 5px;
		padding: 0.25em 0.6em;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-family: var(--font-mono);
		font-size: 0.72em;
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
		padding: 1em;
		overflow: auto;
		text-align: center;
	}

	.canvas :global(svg) {
		max-width: 100%;
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
		display: grid;
		place-items: center;
	}

	.mermaid:fullscreen .canvas :global(svg) {
		max-width: 100%;
		max-height: 100%;
	}
</style>
