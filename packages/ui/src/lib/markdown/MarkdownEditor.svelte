<script lang="ts">
	import Attachment from './Attachment.svelte';
	import Markdown from './Markdown.svelte';
	import { fence, link, prefix, wrap, type Edit } from './toolbar';
	import './markdown.css';

	let {
		value = $bindable(''),
		upload
	}: { value?: string; upload: (file: File) => Promise<string | null> } = $props();

	type Fn = (value: string, from: number, to: number) => Edit;

	const mime = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'];
	const parts = { img: Attachment };

	const tools: { label: string; name: string; fn: Fn }[] = [
		{ label: 'B', name: 'Bold', fn: (v, a, b) => wrap(v, a, b, '**') },
		{ label: 'I', name: 'Italic', fn: (v, a, b) => wrap(v, a, b, '*') },
		{ label: '`', name: 'Code', fn: (v, a, b) => wrap(v, a, b, '`') },
		{ label: 'H', name: 'Heading', fn: (v, a, b) => prefix(v, a, b, '## ') },
		{ label: '"', name: 'Quote', fn: (v, a, b) => prefix(v, a, b, '> ') },
		{ label: '•', name: 'List', fn: (v, a, b) => prefix(v, a, b, '- ') },
		{ label: '☑', name: 'Task', fn: (v, a, b) => prefix(v, a, b, '- [ ] ') },
		{ label: '🔗', name: 'Link', fn: link },
		{ label: '{}', name: 'Code block', fn: fence }
	];

	const binds: Record<string, Fn> = {
		b: (v, a, b) => wrap(v, a, b, '**'),
		i: (v, a, b) => wrap(v, a, b, '*'),
		k: link
	};

	let area = $state<HTMLTextAreaElement>();
	let tab = $state<'write' | 'preview'>('write');
	let over = $state(false);
	let seq = 0;

	// setRangeText keeps the browser's native undo stack, so mirror `value` from the DOM after it.
	const act = (fn: Fn) => () => {
		if (!area) return;
		const edit = fn(value, area.selectionStart, area.selectionEnd);
		area.focus();
		area.setRangeText(edit.text, edit.from, edit.to, 'preserve');
		value = area.value;
		area.setSelectionRange(edit.start, edit.end);
	};

	async function attach(files: File[]) {
		const pick = files.filter((file) => mime.includes(file.type));
		if (!pick.length) return;
		const at = area?.selectionStart ?? value.length;
		// `#upload-n` survives the parser's URL filter, unlike an invented `upload:` scheme.
		const marks = pick.map((file) => ({ file, md: `![${file.name}](#upload-${seq++})` }));
		value = value.slice(0, at) + marks.map((mark) => mark.md).join('\n') + value.slice(at);
		await Promise.all(
			marks.map(async (mark) => {
				const url = await upload(mark.file);
				value = url
					? value.replace(mark.md, () => `![${mark.file.name}](${url})`)
					: value.replace(mark.md, () => '');
			})
		);
	}

	function keys(e: KeyboardEvent) {
		if (!e.ctrlKey && !e.metaKey) return;
		const fn = binds[e.key.toLowerCase()];
		if (!fn) return;
		e.preventDefault();
		act(fn)();
	}

	function paste(e: ClipboardEvent) {
		const files = [...(e.clipboardData?.files ?? [])];
		if (!files.length) return;
		e.preventDefault();
		attach(files);
	}

	function drop(e: DragEvent) {
		over = false;
		const files = [...(e.dataTransfer?.files ?? [])];
		if (!files.length) return;
		e.preventDefault();
		attach(files);
	}

	function choose(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		attach([...(el.files ?? [])]);
		el.value = '';
	}
</script>

<div class="editor" class:over>
	<div class="bar">
		{#each tools as tool (tool.name)}
			<button type="button" title={tool.name} aria-label={tool.name} onclick={act(tool.fn)}>
				{tool.label}
			</button>
		{/each}
		<label class="pick" title="Attach image">
			<input type="file" accept={mime.join(',')} multiple onchange={choose} hidden />
			<span>+</span>
		</label>
		<div class="tabs">
			<button type="button" class:on={tab === 'write'} onclick={() => (tab = 'write')}>Write</button>
			<button type="button" class:on={tab === 'preview'} onclick={() => (tab = 'preview')}>
				Preview
			</button>
		</div>
	</div>

	{#if tab === 'write'}
		<textarea
			bind:this={area}
			bind:value
			spellcheck="true"
			onkeydown={keys}
			onpaste={paste}
			ondrop={drop}
			ondragover={(e) => {
				e.preventDefault();
				over = true;
			}}
			ondragleave={() => (over = false)}
		></textarea>
	{:else}
		<div class="preview"><Markdown {value} components={parts} /></div>
	{/if}
</div>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 16em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
	}

	.editor.over {
		border-color: var(--accent);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.15em;
		padding: 0.3em 0.4em;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}

	.bar button,
	.pick {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.9em;
		height: 1.9em;
		padding: 0 0.4em;
		border: 1px solid transparent;
		border-radius: 5px;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-family: var(--font-mono);
		font-size: 0.85em;
		cursor: pointer;
	}

	.bar button:hover,
	.pick:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	.tabs {
		display: flex;
		gap: 0.15em;
		margin-left: auto;
	}

	.tabs button.on {
		background: var(--surface-2);
		color: var(--ink);
	}

	textarea {
		flex: 1;
		width: 100%;
		min-height: 0;
		resize: none;
		border: 0;
		padding: 0.8em 1em;
		background: transparent;
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.85em;
		line-height: 1.6;
		scrollbar-width: thin;
	}

	textarea:focus {
		outline: none;
	}

	.preview {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0.8em 1em;
		scrollbar-width: thin;
	}
</style>
