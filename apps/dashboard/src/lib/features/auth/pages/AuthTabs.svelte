<script lang="ts">
	import LoginForm from '../components/LoginForm.svelte';
	import RegisterForm from '../components/RegisterForm.svelte';

	let tab = $state<'login' | 'register'>('login');
</script>

<div class="auth">
	<h1>{tab === 'login' ? 'Log in' : 'Create an account'}</h1>

	<div class="tabs">
		<button class="tab" class:active={tab === 'login'} onclick={() => (tab = 'login')}>Log in</button>
		<button class="tab" class:active={tab === 'register'} onclick={() => (tab = 'register')}>
			Register
		</button>
	</div>

	{#if tab === 'login'}
		<LoginForm />
	{:else}
		<RegisterForm />
	{/if}
</div>

<style>
	.auth {
		max-width: 380px;
		margin: 2.5em auto 0;
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	h1 {
		font-size: 1.3em;
		margin: 0;
	}
</style>
