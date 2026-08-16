<script lang="ts">
	import { Button, Card, Issue } from '@template/ui';
	import type { Storage } from '@template/core/storage';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { removeFile } from '../api/files.remote';

	let { file, onedit }: { file: Storage.Entry; onedit: () => void } = $props();

	const f = fmt();
	const name = $derived(file.key.split('/').at(-1) ?? file.key);
	const href = $derived(`/files/${encodeURIComponent(name)}`);
	const remove = $derived(removeFile.for(file.key));
	// No metadata table, so `list` can't report a content type — the extension is all we have.
	const kind = $derived(name.includes('.') ? (name.split('.').at(-1) ?? 'file') : 'file');
	const image = $derived(/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name));
</script>

<Card interactive>
	{#each remove.fields.allIssues() ?? [] as issue, i (i)}
		<Issue>{issue.message}</Issue>
	{/each}

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
					· {f.ago(file.lastModified.toISOString())}
				{/if}
			</span>
		</div>

		<div class="actions">
			<a class="download" {href} download={name}>Download</a>
			<Button variant="ghost" onclick={onedit}>Rename</Button>
			<form
				{...remove.enhance(async (f) => {
					if (!confirm(`Delete ${name}?`)) return;
					await f.submit();
				})}
			>
				<input {...remove.fields.name.as('hidden', name)} />
				<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
			</form>
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
		font-family: var(--font-mono);
		font-size: 0.7em;
		text-transform: uppercase;
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
