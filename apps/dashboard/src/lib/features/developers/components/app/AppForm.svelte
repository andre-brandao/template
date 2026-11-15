<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { createApp } from '../../api/apps.remote';
</script>

<!-- Creating redirects to the new App, so there is no success state to show here. -->
<FormBoundary>
	{#each createApp.fields.allIssues() ?? [] as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form {...createApp}>
		<Field label="Name">
			<Input placeholder="e.g. Billing, CI" {...createApp.fields.name.as('text')} />
		</Field>
		<p class="hint">
			Registers a system account you own. Its keys act as it, never above your role.
		</p>
		<Button type="submit" pending={!!createApp.pending}>Create app</Button>
	</form>
</FormBoundary>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.8em;
	}

	.hint {
		margin: 0;
		font-size: 0.8em;
		color: var(--muted);
	}
</style>
