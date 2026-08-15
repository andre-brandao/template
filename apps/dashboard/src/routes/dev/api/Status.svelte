<script lang="ts">
	let { status }: { status: number } = $props();
</script>

<span class="pill" data-kind={Math.floor(status / 100)}>{status || 'failed'}</span>

<style>
	.pill {
		padding: 0.15em 0.5em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-family: var(--font-mono);
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
</style>
