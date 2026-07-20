<script lang="ts">
	import { z } from 'zod';
	import { Button, Drawer } from '@template/ui';
	import type { File } from '@template/core/file';
	import { query } from '$lib/utils/params';
	import { getFiles } from '../api/files.remote';
	import FileFilters from '../components/FileFilters.svelte';
	import FileCard from '../components/FileCard.svelte';
	import FileForm from '../components/FileForm.svelte';

	const params = query(
		z.object({
			q: z.string().default(''),
			tag: z.string().default(''),
			page: z.coerce.number().int().min(1).default(1)
		})
	);

	const args = $derived({
		q: params.q || undefined,
		tag: params.tag || undefined,
		page: params.page
	});
	const files = $derived(await getFiles(args));
	const pages = $derived(Math.max(1, Math.ceil(files.total / files.pageSize)));

	let editing = $state<File.Info | null>(null);
	let open = $state(false);
	let picker: HTMLInputElement | undefined = $state();
	let uploading = $state(false);
	let failed = $state<string[]>([]);
	let drag = $state(0);

	async function upload(picked: FileList) {
		uploading = true;
		failed = [];
		const results = await Promise.all(
			[...picked].map(async (file) => {
				const body = new FormData();
				body.append('file', file);
				const res = await fetch('/files', { method: 'POST', body });
				return res.ok ? null : file.name;
			})
		);
		failed = results.filter((name): name is string => name !== null);
		uploading = false;
		await getFiles(args).refresh();
	}
</script>

<div
	class="page"
	class:drop={drag > 0}
	role="region"
	aria-label="Files"
	ondragenter={(e) => {
		if (!e.dataTransfer?.types.includes('Files')) return;
		e.preventDefault();
		drag += 1;
	}}
	ondragover={(e) => e.preventDefault()}
	ondragleave={() => (drag = Math.max(0, drag - 1))}
	ondrop={(e) => {
		e.preventDefault();
		drag = 0;
		if (e.dataTransfer?.files.length) upload(e.dataTransfer.files);
	}}
>
	<h1>Files</h1>

	<div class="toolbar">
		<FileFilters
			filters={{ search: params.q, tag: params.tag }}
			onchange={(next) => params.update({ q: next.search, tag: next.tag, page: undefined })}
		/>
		<span class="sep"></span>
		<input
			type="file"
			multiple
			hidden
			bind:this={picker}
			onchange={(e) => {
				const list = e.currentTarget.files;
				if (list?.length) upload(list);
				e.currentTarget.value = '';
			}}
		/>
		<Button pending={uploading} onclick={() => picker?.click()}>Upload</Button>
	</div>

	{#each failed as name (name)}
		<p class="error">Upload failed: {name}</p>
	{/each}

	<div class="list">
		{#each files.data as file (file.id)}
			<FileCard
				{file}
				ontag={(tag) => params.update({ tag, page: undefined })}
				onedit={() => {
					editing = file;
					open = true;
				}}
			/>
		{/each}
		{#if files.data.length === 0}
			<p class="empty">
				{params.q || params.tag ? 'No files match this filter' : 'No files yet — drop one here'}
			</p>
		{/if}
	</div>

	{#if pages > 1}
		<div class="pager">
			{#if files.page > 1}
				<Button variant="ghost" onclick={() => params.update({ page: files.page - 1 })}>Prev</Button>
			{/if}
			<span>Page {files.page} of {pages}</span>
			{#if files.page < pages}
				<Button variant="ghost" onclick={() => params.update({ page: files.page + 1 })}>Next</Button>
			{/if}
		</div>
	{/if}

	{#if drag > 0}
		<div class="overlay">Drop files to upload</div>
	{/if}
</div>

<Drawer bind:open>
	{#if editing}
		<h2>Edit file</h2>
		<FileForm file={editing} onsuccess={() => (open = false)} />
	{/if}
</Drawer>

<style>
	.page {
		position: relative;
		min-height: 60vh;
	}

	h1 {
		margin: 0 0 0.75em;
		font-size: 1.4em;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}

	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
		margin-bottom: 1.25em;
	}

	.sep {
		width: 1px;
		align-self: stretch;
		background: var(--border);
		margin-left: auto;
	}

	.error {
		margin: 0 0 0.5em;
		color: var(--danger, crimson);
		font-size: 0.85em;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}

	.empty {
		color: var(--dim);
		font-size: 0.85em;
		margin: 0.5em 0.2em;
	}

	.pager {
		display: flex;
		align-items: center;
		gap: 0.75em;
		margin-top: 1em;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.82em;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px dashed var(--accent);
		border-radius: var(--radius, 8px);
		background: color-mix(in srgb, var(--surface) 80%, transparent);
		color: var(--ink);
		font-family: var(--font-mono);
		pointer-events: none;
	}
</style>
