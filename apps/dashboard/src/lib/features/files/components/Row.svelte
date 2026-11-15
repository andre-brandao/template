<script lang="ts">
	import type { File as Entry } from '@template/sdk/query';
	import { List, Menu } from '@template/ui';
	import Archive from '@lucide/svelte/icons/file-archive';
	import Audio from '@lucide/svelte/icons/file-audio';
	import Code from '@lucide/svelte/icons/file-code';
	import Text from '@lucide/svelte/icons/file-text';
	import Video from '@lucide/svelte/icons/file-video';
	import Blank from '@lucide/svelte/icons/file';
	import Rename from '$lib/components/Rename.svelte';
	import { ask } from '$lib/ask';
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

	let renaming = $state(false);
	// While renaming, Inline shows its own failure.
	const fail = $derived(drop.error ?? (renaming ? null : save.error));

	function download() {
		const a = document.createElement('a');
		a.href = href;
		a.download = name;
		a.click();
	}

	async function del() {
		const ok = await ask({
			title: 'Delete file',
			name,
			warn: 'This permanently removes {name} from storage. Links to it stop working.',
			verify: true
		});
		if (ok) drop.mutate({ path: { name } });
	}
</script>

{#snippet edit()}
	<Rename
		label="File name"
		value={name}
		save={(to) => save.mutateAsync({ path: { name }, body: { name: to } })}
		done={() => (renaming = false)}
	/>
{/snippet}

<List.Row
	title={renaming ? edit : name}
	href={renaming ? undefined : href}
	external
	label="{name} actions"
	muted={drop.isPending}
	state={drop.isPending ? 'pending' : fail ? 'failed' : 'idle'}
	message={fail?.message}
>
	{#snippet lead()}
		{#if image}
			<img src={href} alt="" loading="lazy" />
		{:else}
			<span class="icon"><Icon size={16} strokeWidth={1.75} /></span>
		{/if}
	{/snippet}
	{#snippet meta()}
		<span class="kind">{ext || '—'}</span>
		<span class="cell">{size(file.size)}</span>
		<span class="cell">
			{#if file.lastModified}
				<time datetime={file.lastModified} title={f.stamp(file.lastModified)}>
					{f.ago(file.lastModified)}
				</time>
			{/if}
		</span>
	{/snippet}
	{#snippet menu()}
		<Menu.Item onselect={() => window.open(href, '_blank', 'noopener')}>Open</Menu.Item>
		<Menu.Item onselect={download}>Download</Menu.Item>
		<Menu.Item disabled={save.isPending} onselect={() => (renaming = true)}>Rename</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger onselect={del}>Delete</Menu.Item>
	{/snippet}
</List.Row>

<style>
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

	/* Fixed widths, so the columns line up from row to row. */
	.kind {
		width: 4em;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: uppercase;
	}

	.cell {
		width: 5.5em;
		text-align: right;
	}
</style>
