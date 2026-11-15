<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Drawer, Empty, Issue, Skeleton } from '@template/ui';
	import type { File as Entry } from '@template/sdk/query';
	import * as Header from '$lib/components/header';
	import { size } from '$lib/utils/size';
	import { list, upload } from '../api/files.query';
	import FileCard from '../components/FileCard.svelte';
	import FileForm from '../components/FileForm.svelte';
	import Upload from '../components/Upload.svelte';

	const files = createQuery(() => list());
	const put = upload();

	let editing = $state<Entry | null>(null);
	let open = $state(false);
	let uploading = $state(false);
	let failed = $state<string[]>([]);
	let drag = $state(0);

	async function send(picked: FileList) {
		const all = [...picked];
		uploading = true;
		failed = [];
		const results = await Promise.allSettled(all.map((file) => put.mutateAsync({ body: { file } })));
		failed = all.filter((_, i) => results[i].status === 'rejected').map((file) => file.name);
		uploading = false;
	}

	function enter(e: DragEvent) {
		if (!e.dataTransfer?.types.includes('Files')) return;
		e.preventDefault();
		drag += 1;
	}

	function drop(e: DragEvent) {
		e.preventDefault();
		drag = 0;
		if (e.dataTransfer?.files.length) send(e.dataTransfer.files);
	}
</script>

<div
	class={['page', { drop: drag > 0 }]}
	role="region"
	aria-label="Files"
	ondragenter={enter}
	ondragover={(e) => e.preventDefault()}
	ondragleave={() => (drag = Math.max(0, drag - 1))}
	ondrop={drop}
>
	<Header.Root title="Files" lead="Uploads kept in storage. Drop files anywhere on the page.">
		<Header.Item label="Files">{files.data?.length ?? '–'}</Header.Item>
		<Header.Item label="Total size">
			{files.data ? size(files.data.reduce((sum, file) => sum + file.size, 0)) : '–'}
		</Header.Item>
		{#snippet actions()}
			<Upload upload={send} pending={uploading} />
		{/snippet}
	</Header.Root>

	{#each failed as name (name)}
		<Issue>Upload failed: {name}</Issue>
	{/each}

	{#if files.isPending}
		<div class="list">
			{#each [0, 1, 2] as i (i)}
				<Skeleton h="4em" />
			{/each}
		</div>
	{:else if files.isError}
		<Issue>{files.error.message}</Issue>
	{:else if files.data.length === 0}
		<Empty>No files yet. Drop one here or use Upload.</Empty>
	{:else}
		<div class="list">
			{#each files.data as file (file.key)}
				<FileCard
					{file}
					onedit={() => {
						editing = file;
						open = true;
					}}
				/>
			{/each}
		</div>
	{/if}

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
