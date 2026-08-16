<script lang="ts">
	import { Drawer, Empty, Issue } from '@template/ui';
	import type { Storage } from '@template/core/storage';
	import Header from '$lib/components/Header.svelte';
	import { getFiles } from '../api/files.remote';
	import FileCard from '../components/FileCard.svelte';
	import FileForm from '../components/FileForm.svelte';
	import Upload from '../components/Upload.svelte';

	const files = $derived(await getFiles());

	let editing = $state<Storage.Entry | null>(null);
	let open = $state(false);
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
		await getFiles().refresh();
	}

	function enter(e: DragEvent) {
		if (!e.dataTransfer?.types.includes('Files')) return;
		e.preventDefault();
		drag += 1;
	}

	function drop(e: DragEvent) {
		e.preventDefault();
		drag = 0;
		if (e.dataTransfer?.files.length) upload(e.dataTransfer.files);
	}

</script>

<div
	class="page"
	class:drop={drag > 0}
	role="region"
	aria-label="Files"
	ondragenter={enter}
	ondragover={(e) => e.preventDefault()}
	ondragleave={() => (drag = Math.max(0, drag - 1))}
	ondrop={drop}
>
	<Header title="Files">
		{#snippet actions()}
			<Upload {upload} pending={uploading} />
		{/snippet}
	</Header>

	{#each failed as name (name)}
		<Issue>Upload failed: {name}</Issue>
	{/each}

	<div class="list">
		{#each files as file (file.key)}
			<FileCard
				{file}
				onedit={() => {
					editing = file;
					open = true;
				}}
			/>
		{/each}
		{#if files.length === 0}
			<Empty>No files yet — drop one here</Empty>
		{/if}
	</div>

	{#if drag > 0}
		<div class="overlay">Drop files to upload</div>
	{/if}
</div>

<Drawer bind:open>
	{#if editing}
		<h2>Rename file</h2>
		<FileForm file={editing} onsuccess={() => (open = false)} />
	{/if}
</Drawer>

<style>
	.page {
		position: relative;
		min-height: 60vh;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
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
