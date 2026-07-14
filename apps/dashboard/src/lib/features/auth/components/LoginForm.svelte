<script lang="ts">
	import { dev } from '$app/environment';
	import { Button, Card } from '@template/ui';
	import { login } from '../api/login.remote';


	const seed = (v: string) => (dev ? v : '');
</script>

{#each login.fields.allIssues() ?? [] as issue}
	<p class="error">{issue.message}</p>
{/each}

<Card>
	<form {...login}>
		<label class="field">
			<span>Email</span>
			<input {...login.fields.email.as('email', seed('dev@example.com'))} />
		</label>
		<label class="field">
			<span>Password</span>
			<input
				{...login.fields.password.as('password', seed('password123'))}
			/>
		</label>
		<Button type="submit" pending={!!login.pending}>Log in</Button>
	</form>
</Card>
