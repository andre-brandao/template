<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import { getProjects } from '../api/projects.remote';

	let { id }: { id: string } = $props();

	const projects = $derived(await getProjects({}));
	const current = $derived(projects.find((p) => p.id === id));
	// Keep the reader on the same subpage when they switch projects.
	const sub = $derived(page.url.pathname.slice(`/projects/${id}`.length));

	let open = $state(false);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="switcher" onfocusout={(e) => (open = e.currentTarget.contains(e.relatedTarget as Node))}>
	<button type="button" aria-expanded={open} onclick={() => (open = !open)}>
		{#if current?.image}
			<Avatar name={current.name} image={current.image} size={16} />
		{/if}
		<span class="name">{current?.name ?? 'Project'}</span>
		<span class="caret" aria-hidden="true">▾</span>
	</button>

	{#if open}
		<ul aria-label="Projects">
			{#each projects as p (p.id)}
				<li>
					<!-- Blocking the focus shift on mousedown keeps focusout from closing
					     the list before the click lands. -->
					<a
						href="/projects/{p.id}{sub}"
						aria-current={p.id === id ? 'true' : undefined}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => (open = false)}
					>
						{#if p.image}
							<Avatar name={p.name} image={p.image} size={16} />
						{/if}
						<span class="label">{p.name}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.switcher {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	button {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		font-family: var(--font-mono);
		font-size: 0.8em;
		text-align: left;
		padding: 0.5em 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--ink);
		cursor: pointer;
	}

	button:hover {
		border-color: var(--border-bright);
	}

	button:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.caret {
		color: var(--dim);
		font-size: 0.85em;
	}

	button[aria-expanded='true'] .caret {
		rotate: 180deg;
	}

	ul {
		position: absolute;
		z-index: 10;
		inset-inline-start: 0;
		top: calc(100% + 0.4em);
		/* Grows past the narrow rail rather than clipping project names. */
		min-width: 100%;
		width: max-content;
		max-width: 16em;
		max-height: 15em;
		overflow-y: auto;
		list-style: none;
		margin: 0;
		padding: 0.25em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.45em;
		font-family: var(--font-mono);
		font-size: 0.8em;
		padding: 0.45em 0.55em;
		border-radius: var(--radius);
		color: var(--muted);
		text-decoration: none;
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	a:hover,
	a:focus-visible {
		color: var(--ink);
		background: var(--surface-2);
		outline: none;
	}

	a[aria-current] {
		color: var(--ink);
	}
</style>
