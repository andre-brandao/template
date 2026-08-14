<script lang="ts">
	import { toast } from '@template/ui';

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
	<pre>{text}</pre>
</div>

<style>
	/* Grows to whatever a flex column parent gives it, and scrolls the listing inside —
	   same deal as the preview frame. */
	.code {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
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

	pre {
		margin: 0;
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 0.9em 1em;
		font-family: var(--font-mono);
		font-size: 0.78em;
		line-height: 1.5;
		color: var(--muted);
	}
</style>
