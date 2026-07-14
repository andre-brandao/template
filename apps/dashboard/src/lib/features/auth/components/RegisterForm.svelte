<script lang="ts">
	import { dev } from '$app/environment';
	import { Button, Card } from '@template/ui';
	import { register } from '../api/login.remote';

	const seed = (v: string) => (dev ? v : '');
</script>

{#each register.fields.allIssues() ?? [] as issue}
	<p class="error">{issue.message}</p>
{/each}

<Card>
	<form {...register}>
		<label class="field">
			<span>Name</span>
			<input {...register.fields.name.as('text', seed('Dev User'))} />
		</label>
		<label class="field">
			<span>Email</span>
			<input {...register.fields.email.as('email', seed('dev@example.com'))} />
		</label>
		<label class="field">
			<span>Password</span>
			<input {...register.fields.password.as('password', seed('password123'))} />
		</label>
		<Button type="submit" pending={!!register.pending}>Register</Button>
	</form>
</Card>
