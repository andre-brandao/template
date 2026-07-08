<script lang="ts">
	import { dev } from '$app/environment';
	import { Button, Card } from '@template/ui';
	import { login } from '../api/login.remote';
</script>

{#each login.fields.allIssues() ?? [] as issue}
	<p class="error">{issue.message}</p>
{/each}

<Card>
	<form {...login}>
		<label class="field">
			<span>Email</span>
			<input {...dev ? login.fields.email.as('email', 'dev@example.com') : login.fields.email.as('email')} />
		</label>
		<label class="field">
			<span>Password</span>
			<input
				{...dev
					? login.fields.password.as('password', 'password123')
					: login.fields.password.as('password')}
			/>
		</label>
		<Button type="submit" pending={!!login.pending}>Log in</Button>
	</form>
</Card>
