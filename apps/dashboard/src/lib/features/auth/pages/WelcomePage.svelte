<script lang="ts">
	import { Button, Card, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { onboard } from '../api/profile.remote';
	import Frame from '../components/Frame.svelte';

	let { email }: { email: string } = $props();

	const issues = $derived(onboard.fields.allIssues() ?? []);
</script>

<Frame title="Welcome" lead="Signed in as {email}. What should everyone else call you?">
	<Card>
		<FormBoundary>
			{#each issues as issue (issue)}
				<Issue>{issue.message}</Issue>
			{/each}

			<form {...onboard}>
				<Field label="Display name">
					<Input {...onboard.fields.name.as('text', '')} autocomplete="name" {@attach (el) => el.focus()} />
				</Field>
				<Button variant="primary" type="submit" pending={!!onboard.pending}>Continue</Button>
			</form>
		</FormBoundary>
	</Card>

	<!-- Every other route waits behind this page, so it is the only way out of a wrong address. -->
	<a class="out" href="/logout" data-sveltekit-reload>Not {email}? Log out</a>
</Frame>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
	}

	.out {
		font-size: 0.8em;
		color: var(--dim);
	}

	.out:hover {
		color: var(--ink);
	}
</style>
