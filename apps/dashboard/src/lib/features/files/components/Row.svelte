<script lang="ts">
	import type { File as Entry } from '@template/sdk/query';
	import { Inline, Menu, Status, modal } from '@template/ui';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Archive from '@lucide/svelte/icons/file-archive';
	import Audio from '@lucide/svelte/icons/file-audio';
	import Code from '@lucide/svelte/icons/file-code';
	import Text from '@lucide/svelte/icons/file-text';
	import Video from '@lucide/svelte/icons/file-video';
	import Blank from '@lucide/svelte/icons/file';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { remove, rename } from '../api/files.query';

	let { file }: { file: Entry } = $props();

	const f = fmt();
	const save = rename();
	const drop = remove();
	const name = $derived(file.key.split('/').at(-1) ?? file.key);
	const href = $derived(`/api/file/${encodeURIComponent(name)}/content`);
	// No metadata table, so the extension is all `list` can tell us about the type.
	const ext = $derived(name.includes('.') ? (name.split('.').at(-1)?.toLowerCase() ?? '') : '');
	const image = $derived(/^(png|jpe?g|gif|webp|avif|svg)$/.test(ext));
	const Icon = $derived(
		[
			{ test: /^(zip|tar|gz|tgz|rar|7z)$/, icon: Archive },
			{ test: /^(mp3|wav|ogg|flac|m4a)$/, icon: Audio },
			{ test: /^(mp4|mov|webm|mkv|avi)$/, icon: Video },
			{ test: /^(js|ts|json|html|css|svelte|py|go|rs|sh|yaml|yml|toml)$/, icon: Code },
			{ test: /^(txt|md|pdf|doc|docx|csv|rtf)$/, icon: Text }
		].find((one) => one.test.test(ext))?.icon ?? Blank
	);
	const busy = $derived(save.isPending || drop.isPending);
	// The row keeps the typed name while the rename lands, and reverts if it fails.
	const shown = $derived(save.isPending ? (save.variables?.body?.name ?? name) : name);
	const dot = $derived(busy ? 'pending' : save.isError || drop.isError ? 'failed' : 'idle');

	let renaming = $state(false);

	function download() {
		const a = document.createElement('a');
		a.href = href;
		a.download = name;
		a.click();
	}

	async function ask() {
		const ok = await modal.confirm({
			title: 'Delete file',
			action: 'Delete file',
			body: warn,
			verify: name
		});
		if (ok) drop.mutate({ path: { name } });
	}
</script>

{#snippet warn()}
	This permanently removes <b>{name}</b> from storage. Links to it stop working.
{/snippet}

<li class={['row', { busy: drop.isPending }]}>
	{#if image}
		<img src={href} alt="" loading="lazy" />
	{:else}
		<span class="icon"><Icon size={16} strokeWidth={1.75} /></span>
	{/if}

	<div class="main">
		{#if renaming}
			<!-- Leaving the field by any route ends the rename; Inline owns save and cancel. -->
			<div
				class="edit"
				onfocusout={() => (renaming = false)}
				{@attach (el) => el.querySelector('button')?.focus()}
			>
				<Inline
					label="File name"
					value={name}
					onsave={(to) => {
						renaming = false;
						return save.mutateAsync({ path: { name }, body: { name: to } });
					}}
				/>
			</div>
		{:else}
			<a class="name" {href} target="_blank" rel="noopener">{shown}</a>
		{/if}
	</div>

	<Status state={dot} message={save.error?.message ?? drop.error?.message} />
	<span class="meta kind">{ext || '—'}</span>
	<span class="meta size">{size(file.size)}</span>
	<span class="meta when">
		{#if file.lastModified}
			<time datetime={file.lastModified} title={f.stamp(file.lastModified)}>
				{f.ago(file.lastModified)}
			</time>
		{/if}
	</span>

	<Menu.Root label="{name} actions" align="end">
		{#snippet trigger(attrs)}
			<button class="dots" aria-label="{name} actions" {...attrs}>
				<Ellipsis size={16} strokeWidth={1.75} />
			</button>
		{/snippet}
		<Menu.Item onselect={() => window.open(href, '_blank', 'noopener')}>Open</Menu.Item>
		<Menu.Item onselect={download}>Download</Menu.Item>
		<Menu.Item disabled={busy} onselect={() => (renaming = true)}>Rename</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger disabled={busy} onselect={ask}>Delete</Menu.Item>
	</Menu.Root>
</li>

<style>
	.row {
		position: relative;
		display: grid;
		grid-template-columns: 1.6em minmax(0, 1fr) 0.5em 4em 5.5em 5em auto;
		align-items: center;
		gap: 0.75em;
		min-height: 2.6em;
		padding: 0.25em 0.4em 0.25em 0.7em;
		border-bottom: 1px solid var(--border);
		transition:
			background 140ms ease,
			opacity 140ms ease;
	}

	.row:hover,
	.row:focus-within {
		background: var(--hover);
	}

	.busy {
		opacity: 0.55;
	}

	img,
	.icon {
		width: 1.6em;
		height: 1.6em;
		border-radius: var(--radius-sm);
	}

	img {
		object-fit: cover;
		border: 1px solid var(--border);
	}

	.icon {
		display: grid;
		place-items: center;
		color: var(--dim);
	}

	.main {
		min-width: 0;
	}

	.name {
		display: block;
		overflow: hidden;
		color: var(--ink);
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
		outline: none;
	}

	/* Stretched over the row, so anywhere that isn't the menu opens the file. */
	.name::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.name:focus-visible::after {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
		border-radius: var(--radius-sm);
	}

	/* Inline pads its box; pull it back so the text stays on the name's line. */
	.edit {
		position: relative;
		z-index: 1;
		margin: -0.2em -0.4em;
	}

	.meta {
		overflow: hidden;
		color: var(--dim);
		font-size: 0.82em;
		font-variant-numeric: tabular-nums;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.kind {
		text-transform: uppercase;
	}

	.size,
	.when {
		text-align: right;
	}

	.dots {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 1.9em;
		height: 1.9em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 140ms ease,
			background 140ms ease;
	}

	.row:hover .dots,
	.row:focus-within .dots,
	.dots[aria-expanded='true'] {
		opacity: 1;
	}

	.dots:hover,
	.dots[aria-expanded='true'] {
		background: var(--hover);
		color: var(--ink);
	}

	.dots:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
	}

	@media (hover: none) {
		.dots {
			opacity: 1;
		}
	}

	@media (max-width: 600px) {
		.row {
			grid-template-columns: 1.6em minmax(0, 1fr) 0.5em 4.5em auto;
		}

		.kind,
		.when {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row,
		.dots {
			transition: none;
		}
	}
</style>
