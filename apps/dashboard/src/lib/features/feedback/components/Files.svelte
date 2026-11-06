<!--
	The files a `send` form attaches: picked, pasted as a screenshot, or removed one by one. The
	list is the truth; the attachment mirrors it into the input, which is what the form posts.
-->
<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import { Field } from '@template/ui';
	import { size } from '$lib/utils/size';

	const MAX = 3;
	let files = $state.raw<{ file: File; url?: string }[]>([]);
	let over = $state(false);
	let dragging = $state(false);
	let pasted = 0;

	// Each list revokes its own thumbnails when replaced, and the last one on unmount.
	$effect(() => {
		const list = files;
		return () => list.forEach((row) => row.url && URL.revokeObjectURL(row.url));
	});

	// Past the cap the first MAX stay and a note says so; the thumbnails are rebuilt each time.
	function set(list: File[]) {
		over = list.length > MAX;
		files = list.slice(0, MAX).map((file) => ({
			file,
			url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
		}));
	}

	// A pick adds to what is there, so a cancelled dialog (empty `files`) changes nothing.
	function pick(e: Event & { currentTarget: HTMLInputElement }) {
		set([...files.map((row) => row.file), ...Array.from(e.currentTarget.files ?? [])]);
	}

	// A drop takes the same kinds the picker accepts; anything else is ignored.
	function drop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const dropped = Array.from(e.dataTransfer?.files ?? []).filter(
			(file) => file.type.startsWith('image/') || file.type === 'application/pdf'
		);
		if (dropped.length) set([...files.map((row) => row.file), ...dropped]);
	}

	// The clipboard names a screenshot `image.png`; a counter tells them apart in the issue.
	function paste(e: ClipboardEvent) {
		const shots = Array.from(e.clipboardData?.files ?? []).filter((file) =>
			file.type.startsWith('image/')
		);
		if (!shots.length) return;
		set([
			...files.map((row) => row.file),
			...shots.map((file) =>
				file.name && file.name !== 'image.png'
					? file
					: new File([file], `screenshot-${++pasted}.png`, { type: file.type })
			)
		]);
	}
</script>

<svelte:window onpaste={paste} />

<div class="files">
	<Field label="Attachments" as="div">
		<!-- The native input stays in the form, visually hidden; the zone is its label. -->
		<label
			class={['zone', { dragging }]}
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={() => (dragging = false)}
			ondrop={drop}
		>
			<input
				{@attach (node) => {
					const list = new DataTransfer();
					files.forEach((row) => list.items.add(row.file));
					node.files = list.files;
				}}
				type="file"
				name="files[]"
				multiple
				accept="image/*,application/pdf"
				onchange={pick}
			/>
			<Paperclip size={16} strokeWidth={1.75} />
			<span>
				<strong>Choose files</strong> or drop them here
				<span class="hint">
					Up to 3, 10 MB each: screenshots or PDFs. Or paste a screenshot with Ctrl+V.
				</span>
			</span>
		</label>
	</Field>

	{#if over}
		<p class="note">At most 3 attachments</p>
	{/if}

	{#if files.length}
		<ul>
			{#each files as row (row.file)}
				<li>
					{#if row.url}
						<img src={row.url} alt="" />
					{:else}
						<span class="pdf"><FileText size={16} strokeWidth={1.75} /></span>
					{/if}
					<span class="name">{row.file.name}</span>
					<span class="size">{size(row.file.size)}</span>
					<button
						type="button"
						aria-label="Remove {row.file.name}"
						onclick={() => set(files.filter((one) => one !== row).map((one) => one.file))}
					>
						remove
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.files {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.zone {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75em;
		padding: 0.85em 1em;
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--muted);
		font-size: 0.88em;
		cursor: pointer;
	}

	.zone:hover,
	.zone.dragging {
		border-color: var(--accent);
		color: var(--ink);
	}

	.zone:focus-within {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.zone strong {
		color: var(--accent);
		font-weight: 600;
	}

	/* Hidden but focusable, and still posted with the form. */
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}

	.hint {
		display: block;
		margin-top: 0.2em;
		font-size: 0.88em;
		color: var(--muted);
	}

	.note {
		margin: 0;
		font-size: 0.8em;
		color: var(--danger);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.35em 0.5em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
		font-size: 0.85em;
	}

	img,
	.pdf {
		flex: none;
		width: 2.6em;
		height: 2em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
	}

	img {
		object-fit: cover;
	}

	.pdf {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--muted);
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.size {
		flex: none;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	button {
		flex: none;
		border: none;
		background: none;
		padding: 0.2em 0.4em;
		border-radius: var(--radius-sm);
		font: inherit;
		font-size: 0.92em;
		color: var(--muted);
		cursor: pointer;
	}

	button:hover {
		color: var(--danger);
		background: var(--hover);
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
</style>
