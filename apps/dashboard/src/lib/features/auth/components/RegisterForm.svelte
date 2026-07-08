<script lang="ts">
	import { dev } from '$app/environment';
	import { Button, Card } from '@template/ui';
	import { register } from '../api/login.remote';
</script>

{#each register.fields.allIssues() ?? [] as issue}
	<p class="error">{issue.message}</p>
{/each}

<Card>
	<form {...register}>
		<label class="field">
			<span>Name</span>
			<input {...dev ? register.fields.name.as('text', 'Dev User') : register.fields.name.as('text')} />
		</label>
		<label class="field">
			<span>Email</span>
			<input
				{...dev ? register.fields.email.as('email', 'dev@example.com') : register.fields.email.as('email')}
			/>
		</label>
		<label class="field">
			<span>Password</span>
			<input
				{...dev
					? register.fields.password.as('password', 'password123')
					: register.fields.password.as('password')}
			/>
		</label>
		<Button type="submit" pending={!!register.pending}>Register</Button>
	</form>
</Card>
