<script lang="ts">
	import { Code as Syntax, toast } from '@template/ui';

	let { text, label = 'Usage' }: { text: string; label?: string } = $props();

	async function copy() {
		await navigator.clipboard.writeText(text);
		toast.success(`${label} copied`);
	}
</script>

<div class="code">
	<div class="head">
		<span>{label}</span>
		<button onclick={copy}>Copy</button>
	</div>
	<Syntax value={text} lang="svelte" />
</div>

<style>
	/* Flat: it sits inside the stage's bordered block, which draws the outer edge. The rule
	   on top is its own, so a second listing under the first is separated by one line. */
	.code {
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4em 0.6em 0.4em 1em;
		border-bottom: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 0.7em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}

	button {
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		padding: 0.35em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	button:hover {
		color: var(--ink);
		border-color: var(--border-bright);
	}

	/* Only long lines scroll here; the listing wrapping this owns the vertical scroll. */
	.code :global(pre.tm-code) {
		margin: 0;
		overflow-x: auto;
		padding: 0.9em 1em;
		font-family: var(--font-mono);
		font-size: 0.78em;
		line-height: 1.5;
		color: var(--muted);
	}
</style>
