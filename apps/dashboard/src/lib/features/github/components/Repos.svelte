<script lang="ts">
	import Issues from '$lib/components/Issues.svelte';
	import { resets } from '$lib/utils/form';
	import { Button, Input } from '@template/ui';
	import { connectRepo, disconnectRepo, getRepos } from '../api/github.remote';
	import Mark from '$lib/components/GithubMark.svelte';

	// Repos whose issues sync into this project, one project per repo.
	let { id }: { id: string } = $props();

	const add = $derived(connectRepo.for(id));
</script>

<section>
	<h2><Mark /> GitHub</h2>

	<svelte:boundary>
		{@const repos = await getRepos(id)}
		{#if repos.length}
			<ul>
				{#each repos as repo (repo)}
					{@const drop = disconnectRepo.for(`${id}:${repo}`)}
					<li>
						<Mark />
						<a href="https://github.com/{repo}" target="_blank" rel="noopener noreferrer">{repo}</a>
						<form
							{...drop.enhance(async (f) => {
								await f.submit();
								await getRepos(id).refresh();
							})}
						>
							<input {...drop.fields.projectID.as('hidden', id)} />
							<input {...drop.fields.repo.as('hidden', repo)} />
							<button type="submit" aria-label="Disconnect {repo}" disabled={!!drop.pending}>
								×
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p>Connect a repository to sync its issues into this project.</p>
		{/if}

		{#snippet pending()}
			<p>Loading repositories…</p>
		{/snippet}
	</svelte:boundary>

	<Issues issues={add.fields.allIssues()} />

	<form
		class="add"
		{...add.enhance(resets(() => getRepos(id).refresh()))}
	>
		<input {...add.fields.projectID.as('hidden', id)} />
		<Input placeholder="owner/name" {...add.fields.repo.as('text')} />
		<Button type="submit" variant="secondary" pending={!!add.pending}>
			<Mark /> Connect
		</Button>
	</form>
</section>

<style>
	h2 {
		display: flex;
		align-items: center;
		gap: 0.45em;
		margin: 0 0 1.25em;
		font-size: 0.95em;
		color: var(--ink);
	}

	p {
		margin: 0 0 0.75em;
		font-size: 0.85em;
		color: var(--muted);
	}

	ul {
		list-style: none;
		margin: 0 0 0.75em;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.45em;
		font-family: var(--font-mono);
		font-size: 0.8em;
		color: var(--dim);
	}

	li a {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--ink);
		text-decoration: none;
	}

	li a:hover {
		color: var(--accent);
	}

	li form {
		display: contents;
	}

	li button {
		border: 0;
		background: none;
		padding: 0 0.3em;
		color: var(--dim);
		cursor: pointer;
		font: inherit;
		line-height: 1;
	}

	li button:hover {
		color: var(--danger);
	}

	.add {
		display: flex;
		gap: 0.5em;
	}
</style>
