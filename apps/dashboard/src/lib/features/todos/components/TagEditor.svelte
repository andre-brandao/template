<script lang="ts">
	let {
		tags = $bindable([]),
		placeholder = 'Add a tag'
	}: { tags?: string[]; placeholder?: string } = $props();

	let draft = $state('');

	function commit() {
		const tag = draft.trim();
		draft = '';
		if (!tag || tags.includes(tag)) return;
		tags = [...tags, tag];
	}

	function remove(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	function keydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			commit();
			return;
		}
		if (e.key === 'Backspace' && !draft && tags.length) tags = tags.slice(0, -1);
	}
</script>

<div class="editor">
	{#each tags as tag (tag)}
		<span class="chip">
			{tag}
			<button type="button" onclick={() => remove(tag)} aria-label="Remove tag {tag}">×</button>
		</span>
	{/each}
	<input
		bind:value={draft}
		onkeydown={keydown}
		onblur={commit}
		placeholder={tags.length ? '' : placeholder}
	/>
</div>

<style>
	.editor {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35em;
		min-width: 0;
		padding: 0.4em 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.editor:focus-within {
		border-color: var(--accent);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		border: 1px solid var(--border);
		background: var(--surface-2);
		color: var(--muted);
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.78em;
		padding: 0.15em 0.3em 0.15em 0.6em;
	}

	.chip button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.2em;
		height: 1.2em;
		border: none;
		border-radius: 999px;
		background: none;
		color: var(--dim);
		font: inherit;
		line-height: 1;
		cursor: pointer;
	}

	.chip button:hover {
		background: var(--border);
		color: var(--ink);
	}

	input {
		flex: 1 1 6em;
		min-width: 4em;
		border: none;
		background: none;
		padding: 0.25em 0;
		font: inherit;
		color: var(--ink);
	}

	input:focus {
		outline: none;
	}
</style>
