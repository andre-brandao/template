<script lang="ts">
	import { Button, Card, Issue } from '@template/ui';
	import type { File as Entry } from '@template/sdk/query';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { remove } from '../api/files.query';

	let { file, onedit }: { file: Entry; onedit: () => void } = $props();

	const f = fmt();
	const drop = remove();
	const name = $derived(file.key.split('/').at(-1) ?? file.key);
	const href = $derived(`/api/file/${encodeURIComponent(name)}/content`);
	// No metadata table, so `list` can't report a content type — the extension is all we have.
	const kind = $derived(name.includes('.') ? (name.split('.').at(-1) ?? 'file') : 'file');
	const image = $derived(/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name));
</script>

<Card interactive>
	{#if drop.error}
		<Issue>{drop.error.message}</Issue>
	{/if}

	<div class="row">
		{#if image}
			<img src={href} alt={name} loading="lazy" />
		{:else}
			<span class="kind">{kind}</span>
		{/if}

		<div class="info">
			<span class="name">{name}</span>
			<span class="meta">
				{size(file.size)}
				{#if file.lastModified}
					· {f.ago(file.lastModified)}
				{/if}
			</span>
		</div>

		<div class="actions">
			<a class="download" {href} download={name}>Download</a>
			<Button variant="ghost" onclick={onedit}>Rename</Button>
			<Button
				variant="danger"
				pending={drop.isPending}
				onclick={() => {
					if (confirm(`Delete ${name}?`)) drop.mutate({ path: { name } });
				}}
			>
				Delete
			</Button>
		</div>
	</div>
</Card>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.9em;
	}

	img {
		width: 3em;
		height: 3em;
		object-fit: cover;
		border-radius: var(--radius, 6px);
		border: 1px solid var(--border);
		flex-shrink: 0;
	}

	.kind {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3em;
		height: 3em;
		flex-shrink: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius, 6px);
		background: var(--surface-2);
		color: var(--muted);
		font-size: 0.7em;
		overflow: hidden;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
		min-width: 0;
		flex: 1;
	}

	.name {
		font-weight: 500;
		color: var(--ink);
		word-break: break-word;
	}

	.meta {
		color: var(--dim);
		font-size: 0.78em;
		font-family: var(--font-mono);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex-shrink: 0;
	}

	.download {
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		text-decoration: none;
		padding: 0.35em 0.6em;
		border-radius: var(--radius, 6px);
	}

	.download:hover {
		color: var(--ink);
		background: var(--surface-2);
	}
</style>
