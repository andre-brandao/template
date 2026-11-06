<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { importBoard } from '../api/github.remote';
	import Mark from '$lib/components/GithubMark.svelte';

	// Pulls a GitHub Project v2 board in as a project, then opens it.
	let { onsuccess }: { onsuccess?: () => void } = $props();
</script>

<FormBoundary>
	<h2><Mark /> Import GitHub project</h2>
	<p>Creates a project with a todo per issue, connected to the board's repositories.</p>

	{#each importBoard.fields.allIssues() ?? [] as issue, i (i)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		{...importBoard.enhance(async (f) => {
			await f.submit();
			const id = (await importBoard.result)?.project.id;
			if (!id) return;
			onsuccess?.();
			await goto(`/projects/${id}`);
		})}
	>
		<Field label="Owner">
			<Input placeholder="acme" {...importBoard.fields.owner.as('text')} />
		</Field>

		<Field label="Project number">
			<Input placeholder="3" {...importBoard.fields.number.as('number')} />
		</Field>

		<div class="footer">
			<Button type="submit" pending={!!importBoard.pending}><Mark /> Import</Button>
		</div>
	</form>
</FormBoundary>

<style>
	h2 {
		display: flex;
		align-items: center;
		gap: 0.45em;
		margin: 0 0 0.4em;
		font-size: 1.15em;
	}

	p {
		margin: 0 0 1em;
		font-size: 0.85em;
		color: var(--muted);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
	}
</style>
