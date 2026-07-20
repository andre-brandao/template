<script lang="ts">
	import { Button, Card } from '@template/ui';
	import type { File } from '@template/core/file';
	import { ago } from '$lib/utils/time';
	import { size } from '$lib/utils/size';
	import { removeFile } from '../api/files.remote';

	let {
		file,
		ontag,
		onedit
	}: { file: File.Info; ontag: (tag: string) => void; onedit: () => void } = $props();

	const remove = $derived(removeFile.for(file.id));
	const image = $derived(file.contentType.startsWith('image/'));
	const kind = $derived(
		file.filename.includes('.')
			? (file.filename.split('.').at(-1) ?? '')
			: (file.contentType.split('/').at(-1) ?? 'file')
	);
</script>

<Card interactive>
	{#each remove.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="row">
		{#if image}
			<img src="/files/{file.id}" alt={file.filename} loading="lazy" />
		{:else}
			<span class="kind">{kind}</span>
		{/if}

		<div class="info">
			<span class="name">{file.filename}</span>
			<span class="meta">
				{size(file.size)} · {file.contentType} · {ago(file.timeCreated)}
			</span>
			{#if file.tags.length > 0}
				<span class="tags">
					{#each file.tags as tag (tag)}
						<button class="tag" type="button" onclick={() => ontag(tag)}>{tag}</button>
					{/each}
				</span>
			{/if}
		</div>

		<div class="actions">
			<a class="download" href="/files/{file.id}" download={file.filename}>Download</a>
			<Button variant="ghost" onclick={onedit}>Edit</Button>
			<form
				{...remove.enhance(async (f) => {
					if (!confirm(`Delete ${file.filename}?`)) return;
					await f.submit();
				})}
			>
				<input {...remove.fields.id.as('hidden', file.id)} />
				<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
			</form>
		</div>
	</div>
</Card>

<style>
	.error {
		margin: 0 0 0.5em;
		color: var(--danger, crimson);
		font-size: 0.85em;
	}

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

	.tags {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.35em;
	}

	.tag {
		border: 1px solid var(--border);
		background: var(--surface-2);
		color: var(--muted);
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.72em;
		padding: 0.2em 0.55em;
		cursor: pointer;
	}

	.tag:hover {
		border-color: var(--accent);
		color: var(--ink);
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
