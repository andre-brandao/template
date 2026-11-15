<script lang="ts">
	import { Button, Card, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { onboard } from '../api/profile.remote';
	import Frame from '../components/Frame.svelte';

	let { email }: { email: string } = $props();

	const issues = $derived(onboard.fields.allIssues() ?? []);
</script>

<Frame>
	<header>
		<h1>Welcome</h1>
		<p class="sub">Signed in as {email}. What should everyone else call you?</p>
	</header>

	<Card>
		<FormBoundary>
			{#each issues as issue (issue)}
				<Issue>{issue.message}</Issue>
			{/each}

			<form {...onboard}>
				<Field label="Display name">
					<Input {...onboard.fields.name.as('text', '')} autocomplete="name" />
				</Field>
				<Button variant="primary" type="submit" pending={!!onboard.pending}>Continue</Button>
			</form>
		</FormBoundary>
	</Card>

	<p class="hint">You can add a password later from Settings — the emailed code always works.</p>
</Frame>

<style>
	header {
		margin-bottom: 0.4em;
	}

	h1 {
		margin: 0 0 0.35em;
		font-size: 1.4em;
		font-weight: 600;
		letter-spacing: -0.015em;
	}

	.sub {
		margin: 0;
		font-size: 0.88em;
		line-height: 1.45;
		color: var(--muted);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
	}

	.hint {
		margin: 0;
		font-size: 0.8em;
		color: var(--dim);
	}
</style>
