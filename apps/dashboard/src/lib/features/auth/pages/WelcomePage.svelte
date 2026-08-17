<script lang="ts">
	import { Button, Card, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { onboard } from '../api/profile.remote';

	let { email }: { email: string } = $props();

	const issues = $derived(onboard.fields.allIssues() ?? []);
</script>

<div class="welcome">
	<h1>Welcome</h1>
	<p class="sub">Signed in as {email}. What should everyone else call you?</p>

	<Card>
		<FormBoundary>
			{#each issues as issue (issue)}
				<Issue>{issue.message}</Issue>
			{/each}

			<form {...onboard}>
				<Field label="Display name">
					<Input {...onboard.fields.name.as('text', '')} autocomplete="name" />
				</Field>
				<Button type="submit" pending={!!onboard.pending}>Continue</Button>
			</form>
		</FormBoundary>
	</Card>

	<p class="hint">You can add a password later from Settings — the emailed code always works.</p>
</div>

<style>
	.welcome {
		display: flex;
		flex-direction: column;
		gap: 1em;
		width: min(420px, 100%);
		margin: 3.5em auto 0;
	}

	h1 {
		margin: 0;
		font-size: 1.4em;
	}

	.sub {
		margin: -0.6em 0 0;
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
