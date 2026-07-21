<script lang="ts">
	import { Button, Card, FormBoundary, Issues } from '@template/ui';
	import { user } from '$lib/features/auth/context';
	import { acceptInvite, getInvite } from '../api/invite.remote';

	let { token }: { token: string } = $props();

	const me = user();
	const invite = $derived(await getInvite(token));
	const mismatch = $derived(
		!!invite && !!me.current && me.current.email.toLowerCase() !== invite.email.toLowerCase()
	);
</script>

<section>
	<Card>
		{#if !invite}
			<p class="note">This invitation doesn't exist.</p>
		{:else if invite.status !== 'pending'}
			<p class="note">This invitation is no longer valid.</p>
		{:else if invite.expired}
			<p class="note">This invitation has expired.</p>
		{:else}
			<h1>Join {invite.org}</h1>
			<p class="note">You've been invited to join {invite.org} as {invite.email}.</p>
			{#if me.current}
				{#if mismatch}
					<p class="note">
						You're signed in as {me.current.email} — this invite was sent to {invite.email}.
					</p>
				{/if}
				<FormBoundary>
					<Issues of={acceptInvite.fields.allIssues()} />
					<form {...acceptInvite}>
						<input type="hidden" name="token" value={token} />
						<Button type="submit" pending={!!acceptInvite.pending}>Accept invitation</Button>
					</form>
				</FormBoundary>
			{:else}
				<a class="login" href="/login?next={encodeURIComponent(`/invite/${token}`)}">
					Log in to accept
				</a>
			{/if}
		{/if}
	</Card>
</section>

<style>
	section {
		max-width: 420px;
		margin: 4em auto 0;
		text-align: center;
	}

	h1 {
		margin: 0 0 0.5em;
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: 1.4em;
	}

	.note {
		margin: 0 0 1em;
		color: var(--muted);
		line-height: 1.6;
	}

	form {
		margin-top: 0.5em;
	}

	.login {
		display: inline-block;
		margin-top: 0.5em;
		font-family: var(--font-mono);
		font-size: 0.85em;
		text-decoration: none;
		color: var(--ink);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.55em 1.1em;
	}

	.login:hover {
		border-color: var(--border-bright);
	}
</style>
