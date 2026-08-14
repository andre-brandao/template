<script lang="ts">
	import type { send } from './api.remote';

	let { res }: { res: Awaited<ReturnType<typeof send>> } = $props();
</script>

<section>
	<div class="status">
		<span class="pill" data-kind={Math.floor(res.status / 100)}>{res.status || 'failed'}</span>
		<span>{res.ms}ms</span>
		<span>{res.headers['content-type'] ?? ''}</span>
	</div>
	<pre>{res.text}</pre>
	<details>
		<summary>Response headers</summary>
		<pre>{Object.entries(res.headers)
				.map(([name, value]) => `${name}: ${value}`)
				.join('\n')}</pre>
	</details>
</section>

<style>
	section {
		margin-top: 2em;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 0.8em;
		margin-bottom: 0.6em;
		font-family: var(--font-mono);
		font-size: 0.75em;
		color: var(--dim);
	}

	.pill {
		padding: 0.15em 0.5em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--muted);
	}

	.pill[data-kind='2'] {
		border-color: color-mix(in srgb, var(--done) 45%, transparent);
		color: var(--done);
	}

	.pill[data-kind='4'],
	.pill[data-kind='5'] {
		border-color: color-mix(in srgb, var(--danger) 45%, transparent);
		color: var(--danger);
	}

	pre {
		margin: 0;
		max-height: 30em;
		overflow: auto;
		padding: 0.9em 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: 0.78em;
		line-height: 1.5;
	}

	details {
		margin-top: 0.8em;
		font-size: 0.8em;
		color: var(--muted);
	}

	summary {
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.9em;
		margin-bottom: 0.5em;
	}
</style>
