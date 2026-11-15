<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { hotkeys } from '$lib/hotkeys';
	import { Button, Empty, Issue, Kbd, List } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { size } from '$lib/utils/size';
	import { list, upload } from '../api/files.query';
	import Pending from '../components/Pending.svelte';
	import Row from '../components/Row.svelte';

	const files = createQuery(() => list());
	const put = upload();

	let picker: HTMLInputElement | undefined;
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

	// Each file shows its own progress row, so picking never waits on a send.
	const pick = () => picker?.click();

	createHotkey(hotkeys.create, pick);

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
	<Header.Root title="Files" lead="Your uploads. Drop files anywhere on the page to add more.">
		{#if files.data?.length}
			<Header.Item label="Total size">
				{size(files.data.reduce((sum, file) => sum + file.size, 0))}
			</Header.Item>
		{/if}
		{#snippet actions()}
			<input
				type="file"
				name="files"
				multiple
				hidden
				onchange={(e) => {
					if (e.currentTarget.files?.length) send(e.currentTarget.files);
					e.currentTarget.value = '';
				}}
				{@attach (el) => {
					picker = el;
				}}
			/>
			<Button variant="primary" onclick={pick}>Upload <Kbd keys="C" /></Button>
		{/snippet}
	</Header.Root>

	{#if sending.length}
		<List.Root label="Uploads">
			{#each sending as one (one.id)}
				<Pending
					file={one.file}
					error={one.error}
					ondismiss={() => (sending = sending.filter((x) => x.id !== one.id))}
				/>
			{/each}
		</List.Root>
	{/if}

	{#if files.isPending}
		<List.Loading rows={5} />
	{:else if files.isError}
		<Issue retry={() => files.refetch()}>{files.error.message}</Issue>
	{:else if files.data.length === 0 && !sending.length}
		<Empty
			>No files yet. Drop some anywhere on the page, or press <Kbd keys="C" /> to pick them.</Empty
		>
	{:else}
		<List.Root label="Files">
			{#each files.data as file (file.key)}
				<Row {file} />
			{/each}
		</List.Root>
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
