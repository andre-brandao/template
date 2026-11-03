<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Event } from '@template/core/event';
	import Header from '$lib/components/Header.svelte';
	import Timeline from '$lib/features/events/components/Timeline.svelte';
	import { getProject, linkProject, unlinkProject } from '../api/projects.remote';
	import Links from '$lib/components/Links.svelte';
	import GithubMark from '$lib/components/GithubMark.svelte';
	import { repos } from '../github';

	// The stages/todos sections come in as snippets so this slice never imports
	// the todos feature — the route composes the two.
	let {
		id,
		stages,
		todos,
		github
	}: { id: string; stages: Snippet; todos: Snippet; github?: Snippet } = $props();

	const eventLabels: Record<string, string> = {
		'project.created': 'Created',
		'project.updated': 'Updated',
		'project.removed': 'Removed'
	};
</script>

<svelte:boundary>
	{@const project = await getProject(id)}
	<Header title={project.name}>{project.description}</Header>
</svelte:boundary>

<!--
	Stages carry four columns of their own, so they take the long side of the split
	and the two narrower lists share the short one.
-->
<div class="split">
	<div class="col">
		<section>
			<h2>Stages</h2>
			{@render stages()}
		</section>
	</div>

	<div class="col">
		{@render github?.()}

		<svelte:boundary>
			{@const project = await getProject(id)}
			{@const list = repos(project.metadata.annotations)}
			{@const notes = Object.entries(project.metadata.annotations)}
			{#if list.length}
				<section>
					<h2>Repositories</h2>
					<ul class="repos">
						{#each list as repo (repo.name)}
							<li>
								<a href={repo.url} target="_blank" rel="noopener noreferrer">
									<GithubMark />
									{repo.name}
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<section>
				<h2>Links</h2>
				<Links
					id={project.id}
					links={project.metadata.links}
					add={linkProject.for(project.id)}
					drop={(url) => unlinkProject.for(`${project.id}:${url}`)}
					onsaved={() => getProject(project.id).refresh()}
				/>
			</section>

			{#if notes.length}
				<section>
					<h2>Annotations</h2>
					<dl>
						{#each notes as [key, value] (key)}
							<div>
								<dt>{key}</dt>
								<dd>{value}</dd>
							</div>
						{/each}
					</dl>
				</section>
			{/if}
		</svelte:boundary>

		<section>
			<h2>Recent todos</h2>
			{@render todos()}
		</section>

		<!-- Heading lives here rather than Timeline's `title`, so it shares the page's
		     scoped h2 style with the two lists above it. -->
		<section>
			<h2>Logs</h2>
			<Timeline source="project" sourceID={id}>
				{#snippet label(event: Event.Info)}
					{eventLabels[event.type] ?? event.type}
				{/snippet}
			</Timeline>
		</section>
	</div>
</div>

<style>
	h2 {
		margin: 0 0 0.75em;
		font-size: 0.78em;
		font-family: var(--font-mono);
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
	}

	/* Golden section: the long column is φ (1.618) times the short one. */
	.split {
		display: grid;
		grid-template-columns: 1.618fr 1fr;
		align-items: start;
		gap: 2.5em;
	}

	.col {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2.25em;
	}

	.repos {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
	}

	.repos a {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		border: 1px solid var(--border);
		background: var(--surface-2);
		border-radius: 999px;
		padding: 0.2em 0.65em;
		font-family: var(--font-mono);
		font-size: 0.75em;
		color: var(--ink);
		text-decoration: none;
	}

	.repos a:hover {
		color: var(--accent);
	}

	dl {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		font-family: var(--font-mono);
		font-size: 0.78em;
	}

	dt {
		color: var(--dim);
	}

	dd {
		margin: 0.1em 0 0;
		color: var(--muted);
		word-break: break-all;
	}

	@media (max-width: 900px) {
		.split {
			grid-template-columns: 1fr;
			gap: 2.25em;
		}
	}
</style>
