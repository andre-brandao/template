<!--
	The files a `send` form attaches: picked, dropped or pasted anywhere on the form, removed one
	by one. The list is the truth; the attachment mirrors it into the input the form posts.
-->
<script lang="ts">
	import type { RemoteFormField } from '$app/server';
	import { on } from 'svelte/events';
	import FileText from '@lucide/svelte/icons/file-text';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import X from '@lucide/svelte/icons/x';
	import { Field, Kbd } from '@template/ui';
	import { size } from '#lib/utils/size.ts';

	let { field, issues = [] }: { field: RemoteFormField<File[]>; issues?: { message: string }[] } =
		$props();

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

	function add(list: File[]) {
		if (list.length) set([...files.map((row) => row.file), ...list]);
	}

	// The clipboard names a screenshot `image.png`; a counter tells them apart in the issue.
	const name = (file: File) =>
		file.name && file.name !== 'image.png'
			? file
			: new File([file], `screenshot-${++pasted}.png`, { type: file.type });

	// The whole form takes drops and pastes, so a screenshot can land on Details too. Only file
	// drags are claimed: text still drags into the textarea as usual.
	function listen(node: HTMLElement) {
		const form = node.closest('form');
		if (!form) return;
		const carries = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');
		const stops = [
			on(form, 'dragover', (e) => {
				if (!carries(e)) return;
				e.preventDefault();
				dragging = true;
			}),
			on(form, 'dragleave', (e) => {
				if (!form.contains(e.relatedTarget as Node | null)) dragging = false;
			}),
			on(form, 'drop', (e) => {
				if (!carries(e)) return;
				e.preventDefault();
				dragging = false;
				add(
					Array.from(e.dataTransfer?.files ?? []).filter(
						(file) => file.type.startsWith('image/') || file.type === 'application/pdf'
					)
				);
			}),
			on(form, 'paste', (e) => {
				const shots = Array.from(e.clipboardData?.files ?? []).filter((file) =>
					file.type.startsWith('image/')
				);
				if (!shots.length) return;
				e.preventDefault();
				add(shots.map(name));
			})
		];
		return () => stops.forEach((stop) => stop());
	}
</script>

<div class="files" {@attach listen}>
	<Field label="Attachments" as="div">
		<!-- The native input stays in the form, visually hidden; the zone is its label. -->
		<label class={['zone', { dragging }]}>
			<input
				{@attach (node) => {
					const list = new DataTransfer();
					files.forEach((row) => list.items.add(row.file));
					node.files = list.files;
				}}
				{...field.as('file multiple')}
				accept="image/*,application/pdf"
				onchange={(e) => add(Array.from(e.currentTarget.files ?? []))}
			/>
			<span class="badge"><ImagePlus size={18} strokeWidth={1.75} /></span>
			<span class="text">
				<strong>{dragging ? 'Drop to attach' : 'Drop, paste or choose files'}</strong>
				<span class="hint">
					Screenshots or PDFs, up to {MAX} at 10 MB each. Paste one with <Kbd keys="Mod+V" />
				</span>
			</span>
			<span class="count" aria-label="{files.length} of {MAX} attached">{files.length}/{MAX}</span>
		</label>
	</Field>

	{#if over}
		<p class="note" role="alert">Only {MAX} fit, so the rest were left out.</p>
	{/if}
	{#each issues as issue, i (i)}
		<p class="note" role="alert">{issue.message}</p>
	{/each}

	{#if files.length}
		<ul>
			{#each files as row (row.file)}
				<li>
					{#if row.url}
						<img src={row.url} alt="" />
					{:else}
						<span class="pdf"><FileText size={20} strokeWidth={1.5} /></span>
					{/if}
					<span class="name" title={row.file.name}>{row.file.name}</span>
					<span class="size">{size(row.file.size)}</span>
					<button
						type="button"
						aria-label="Remove {row.file.name}"
						onclick={(e) => {
							// Focus goes back to the picker rather than falling out of the form.
							e.currentTarget.closest('.files')?.querySelector('input')?.focus();
							set(files.filter((one) => one !== row).map((one) => one.file));
						}}
					>
						<X size={14} strokeWidth={2} />
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
		gap: 0.8em;
		padding: 0.8em 0.9em;
		border: 1.5px dashed var(--border-bright);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--muted);
		font-size: 0.88em;
		cursor: pointer;
		transition:
			background 0.12s ease,
			border-color 0.12s ease;
	}

	.zone:hover,
	.zone.dragging {
		border-color: var(--accent);
		background: color-mix(in oklab, var(--accent) 8%, var(--surface));
	}

	.zone:focus-within {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.badge {
		flex: none;
		display: grid;
		place-items: center;
		width: 2.4em;
		height: 2.4em;
		border-radius: 50%;
		background: color-mix(in oklab, var(--accent) 14%, var(--surface));
		color: var(--accent);
	}

	.text {
		flex: 1;
		min-width: 0;
	}

	strong {
		display: block;
		color: var(--ink);
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
		font-size: 0.9em;
		color: var(--dim);
	}

	.count {
		flex: none;
		align-self: flex-start;
		font-size: 0.85em;
		font-variant-numeric: tabular-nums;
		color: var(--dim);
	}

	.note {
		margin: 0;
		font-size: 0.8em;
		color: var(--danger);
	}

	/* At most three, so three columns: a row of tiles never wraps to a lone straggler. */
	ul {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		padding: 0.3em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: 0.8em;
	}

	img,
	.pdf {
		width: 100%;
		aspect-ratio: 4 / 3;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}

	img {
		object-fit: cover;
	}

	.pdf {
		display: grid;
		place-items: center;
		color: var(--muted);
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 0 0.15em;
	}

	.size {
		padding: 0 0.15em;
		color: var(--dim);
		font-variant-numeric: tabular-nums;
	}

	/* Always shown, not on hover: a phone has no hover to reveal it. */
	button {
		position: absolute;
		top: 0.5em;
		right: 0.5em;
		display: grid;
		place-items: center;
		width: 1.9em;
		height: 1.9em;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface);
		color: var(--muted);
		box-shadow: var(--shadow-1);
		cursor: pointer;
	}

	button:hover {
		color: var(--danger);
		border-color: var(--danger);
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
</style>
