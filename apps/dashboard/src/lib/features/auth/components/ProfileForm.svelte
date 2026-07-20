<script lang="ts">
	import type { User } from '@template/core/user';
	import { Button, FormBoundary, Input } from '@template/ui';
	import Avatar from '$lib/components/Avatar.svelte';
	import { rename } from '../api/profile.remote';

	let { user }: { user: User.Info } = $props();

	const issues = $derived(rename.fields.allIssues() ?? []);
	const pending = $derived(!!rename.pending);
	const verified = $derived(user.emailVerified ? 'verified' : 'unverified');
</script>

<div class="head">
	<Avatar name={user.name} image={user.image} size={56} />
	<div class="who">
		<span class="email">{user.email}</span>
		<span class="sub">{verified}</span>
	</div>
</div>

<FormBoundary>
	{#each issues as issue (issue)}
		<p class="error">{issue.message}</p>
	{/each}

	<form {...rename}>
		<label class="field name">
			<span>Display name</span>
			<div class="row">
				<Input {...rename.fields.name.as('text', user.name)} />
				<Button type="submit" {pending}>Save</Button>
			</div>
		</label>
	</form>
</FormBoundary>

<style>
	.head {
		display: flex;
		align-items: center;
		gap: 1em;
		margin-bottom: 1.5em;
	}

	.who {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
	}

	.email {
		font-weight: 600;
	}

	.sub {
		font-family: var(--font-mono);
		font-size: 0.72em;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--dim);
	}

	.name {
		max-width: 24em;
	}

	.row {
		display: flex;
		gap: 0.6em;
	}
</style>
