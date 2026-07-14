<script lang="ts">
	import type { User } from '@template/core/user';
	import { Button } from '@template/ui';
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

{#each issues as issue}
	<p class="error">{issue.message}</p>
{/each}

<form {...rename}>
	<label for="name">Display name</label>
	<div class="row">
		<input id="name" {...rename.fields.name.as('text', user.name)} />
		<Button type="submit" {pending}>Save</Button>
	</div>
</form>

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

	label {
		display: block;
		margin-bottom: 0.4em;
		font-size: 0.82em;
		color: var(--muted);
	}

	.row {
		display: flex;
		gap: 0.6em;
	}

	input {
		flex: 1;
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.error {
		margin: 0 0 0.6em;
		color: var(--danger, crimson);
	}
</style>
