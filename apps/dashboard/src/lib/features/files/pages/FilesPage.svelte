<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Empty, Issue, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { size } from '$lib/utils/size';
	import { list, upload } from '../api/files.query';
	import Pending from '../components/Pending.svelte';
	import Row from '../components/Row.svelte';
	import Upload from '../components/Upload.svelte';

	const files = createQuery(() => list());
	const put = upload();

	let up: Upload | undefined = $state();
	let sending = $state<{ id: string; file: File; error?: string }[]>([]);
	let drag = $state(0);

	// The list refetches before mutateAsync settles, so a sent row hands over without a gap.
	function send(picked: FileList) {
		[...picked].forEach((file) => {
			const id = crypto.randomUUID();
			sending.push({ id, file });
			put.mutateAsync({ body: { file } }).then(
				() => (sending = sending.filter((one) => one.id !== id)),
				(err: Error) => {
					const one = sending.find((x) => x.id === id);
					if (one) one.error = err?.message ?? 'Upload failed';
				}
			);
		});
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
	class="page"
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
			<Upload bind:this={up} upload={send} />
		{/snippet}
	</Header.Root>

	{#if sending.length}
		<ul class="list" aria-label="Uploads">
			{#each sending as one (one.id)}
				<Pending
					file={one.file}
					error={one.error}
					ondismiss={() => (sending = sending.filter((x) => x.id !== one.id))}
				/>
			{/each}
		</ul>
	{/if}

	{#if files.isPending}
		<div class="skeleton" aria-busy="true">
			{#each [0, 1, 2, 3, 4] as i (i)}
				<Skeleton h="2.6em" />
			{/each}
		</div>
	{:else if files.isError}
		<Issue>{files.error.message}</Issue>
	{:else if files.data.length === 0 && !sending.length}
		<Empty>
			No files yet. Drop one anywhere on the page, or pick some to upload.
			{#snippet action()}
				<Button onclick={() => up?.open()}>Upload files</Button>
			{/snippet}
		</Empty>
	{:else}
		<ul class="list">
			{#each files.data as file (file.key)}
				<Row {file} />
			{/each}
		</ul>
	{/if}

	{#if drag > 0}
		<div class="overlay">Drop files to upload</div>
	{/if}
</div>

<style>
	.page {
		position: relative;
		min-height: 60vh;
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px dashed var(--accent);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--surface) 80%, transparent);
		color: var(--ink);
		pointer-events: none;
		animation: enter 140ms ease-out;
	}

	@keyframes enter {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.overlay {
			animation: none;
		}
	}
</style>
