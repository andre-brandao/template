<script lang="ts">
	import { dev } from '$app/environment';
	import { Button, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { start, verify } from '../api/login.remote';

	// The password is the escape hatch, not the default: its field only mounts once asked
	// for, which leaves the mailed code and the OAuth buttons as the obvious way in. Unmounting
	// it is also what tells the server which half of `start` to run.
	let pw = $state(false);

	const seed = (v: string) => (dev ? v : '');
	const sent = $derived((await start.result)?.sent);
	const issues = $derived([
		...(start.fields.allIssues() ?? []),
		...(verify.fields.allIssues() ?? [])
	]);
</script>

<FormBoundary>
	{#each issues as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	{#if sent}
		<form {...verify}>
			<input {...verify.fields.email.as('hidden', sent)} />
			<Field label="Code">
				<Input
					{...verify.fields.code.as('text', '')}
					inputmode="numeric"
					maxlength={6}
					autocomplete="one-time-code"
					placeholder="000000"
				/>
			</Field>
			<Button type="submit" pending={!!verify.pending}>Log in</Button>
			<p class="hint">Sent to {sent}. A wrong code retires it — ask for another.</p>
		</form>
	{:else}
		<form {...start}>
			<Field label="Email">
				<Input
					{...start.fields.email.as('email', seed('dev@example.com'))}
					autocomplete="username"
				/>
			</Field>

			{#if pw}
				<Field label="Password">
					<Input
						{...start.fields._password.as('password', seed('password123'))}
						autocomplete="current-password"
					/>
				</Field>
				<!-- Only the code signs anyone up, so a new visitor who types a password they'd
				     like would otherwise just get "Invalid email or password" and no reason why. -->
				<p class="hint">Signing up? Use the code — passwords are added later, in Settings.</p>
			{/if}

			<Button type="submit" pending={!!start.pending}>
				{pw ? 'Log in' : 'Email me a code'}
			</Button>
		</form>

		<button class="alt" type="button" onclick={() => (pw = !pw)}>
			{pw ? 'Email me a code instead' : 'Use a password'}
		</button>
	{/if}
</FormBoundary>

<style>
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

	.alt {
		margin-top: 0.9em;
		padding: 0;
		border: none;
		background: none;
		color: var(--dim);
		font: inherit;
		font-size: 0.8em;
		text-decoration: underline;
		cursor: pointer;
	}

	.alt:hover {
		color: var(--ink);
	}
</style>
