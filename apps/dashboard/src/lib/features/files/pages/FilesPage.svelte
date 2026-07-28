<script lang="ts">
	import { z } from 'zod';
	import { Drawer } from '@template/ui';
	import type { File } from '@template/core/file';
	import { query } from '$lib/utils/params';
	import { org } from '$lib/context/org';
	import { getFiles } from '../api/files.remote';
	import FileFilters from '../components/FileFilters.svelte';
	import FileCard from '../components/FileCard.svelte';
	import FileForm from '../components/FileForm.svelte';
	import Dropzone from '../components/Dropzone.svelte';
	import Pager from '../components/Pager.svelte';
	import Upload from '../components/Upload.svelte';

	const ctx = org();

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
	let uploading = $state(false);
	let failed = $state<string[]>([]);

	async function upload(picked: FileList) {
		if (!ctx.can('file:write')) return;
		uploading = true;
		failed = [];
		const results = await Promise.all(
			[...picked].map(async (file) => {
				const body = new FormData();
				body.append('file', file);
				const res = await fetch(ctx.path('/files'), { method: 'POST', body });
				return res.ok ? null : file.name;
			})
		);
		failed = results.filter((name): name is string => name !== null);
		uploading = false;
		await getFiles(args).refresh();
	}
</script>

<Dropzone enabled={ctx.can('file:write')} onfiles={upload}>
	<h1>Files</h1>

	<div class="toolbar">
		<FileFilters
			filters={{ search: params.q, tag: params.tag }}
			onchange={(next) => params.update({ q: next.search, tag: next.tag, page: undefined })}
		/>
		<span class="sep"></span>
		{#if ctx.can('file:write')}
			<Upload pending={uploading} onfiles={upload} />
		{/if}
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

	<Pager page={files.page} {pages} onpage={(page) => params.update({ page })} />
</Dropzone>

<Drawer bind:open>
	{#if editing}
		<h2>Edit file</h2>
		<FileForm file={editing} onsuccess={() => (open = false)} />
	{/if}
</Drawer>

<style>
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
</style>
