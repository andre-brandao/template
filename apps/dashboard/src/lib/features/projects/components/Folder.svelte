<script lang="ts">
	import type { Project } from '@template/core/project';

	// `pos` staggers the tab the way folders in a real drawer offset theirs so the
	// labels don't line up and hide each other.
	let { project, pos }: { project: Project.Info; pos: number } = $props();
</script>

<article class="folder" style:--x={pos}>
	<!-- The list is ordered by name, so the tab letter is a real filing index. -->
	<span class="tab" aria-hidden="true">
		{#if project.image}
			<img src={project.image} alt="" />
		{:else}
			{project.name.slice(0, 1).toUpperCase()}
		{/if}
	</span>

	<div class="body">
		<a class="name" href="/projects/{project.id}">{project.name}</a>
		{#if project.description}
			<p class="blurb">{project.description}</p>
		{/if}
		<div class="foot">
			<a href="/projects/{project.id}/todos">Todos</a>
			<a href="/projects/{project.id}/insights">Insights</a>
		</div>
	</div>
</article>

<style>
	.folder {
		--tab: 26px;
		position: relative;
		padding-top: var(--tab);
		transition: transform 0.15s ease;
	}

	.tab {
		position: absolute;
		top: 0;
		left: calc(14px + var(--x) * 30%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 54px;
		/* One past the tab so the opaque fill covers the body's top border beneath it,
		   leaving tab and body reading as one cut sheet. */
		height: calc(var(--tab) + 1px);
		border: 1px solid var(--border);
		border-bottom: none;
		border-radius: 7px 7px 0 0;
		background: var(--surface);
		/* Set after the box, which is sized in px, so the glyph can't resize the tab. */
		font-family: var(--font-mono);
		font-size: 0.72em;
		letter-spacing: 0.06em;
		color: var(--dim);
		pointer-events: none;
		transition: border-color 0.15s ease;
	}

	.tab img {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		object-fit: cover;
	}

	.body {
		display: flex;
		flex-direction: column;
		/* A letter folder is about 5:4 closed. The ratio fixes the height, so the
		   clamps below are what keep long copy from spilling past the edge. */
		aspect-ratio: 5 / 4;
		overflow: hidden;
		padding: 1.1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow-1);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.folder:hover,
	.folder:focus-within {
		transform: translateY(-2px);
	}

	.folder:hover .body,
	.folder:focus-within .body {
		border-color: var(--border-bright);
		box-shadow: var(--shadow-2);
	}

	.folder:hover .tab,
	.folder:focus-within .tab {
		border-color: var(--border-bright);
	}

	.name {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		color: var(--ink);
		font-weight: 500;
		line-height: 1.35;
		text-decoration: none;
	}

	/* Stretched over the whole folder, so anywhere that isn't a foot link opens it. */
	.name::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.folder:hover .name {
		color: var(--accent);
	}

	.blurb {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		overflow: hidden;
		margin: 0.5em 0 0;
		color: var(--muted);
		font-size: 0.85em;
		line-height: 1.5;
	}

	.foot {
		display: flex;
		gap: 0.9em;
		margin-top: auto;
		padding-top: 0.85em;
	}

	.foot a {
		position: relative;
		font-family: var(--font-mono);
		font-size: 0.72em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
		text-decoration: none;
	}

	.foot a:hover {
		color: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.folder:hover,
		.folder:focus-within {
			transform: none;
		}
	}
</style>
