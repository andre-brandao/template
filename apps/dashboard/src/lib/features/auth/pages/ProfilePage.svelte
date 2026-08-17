<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { getMe, getProviders } from '../api/profile.remote';
	import PasswordForm from '../components/PasswordForm.svelte';
	import ProfileForm from '../components/ProfileForm.svelte';
	import ProviderList from '../components/ProviderList.svelte';

	const user = $derived(await getMe());
	const providers = $derived(await getProviders());
	const set = $derived(providers.some((one) => one.id === 'password' && one.connected));
</script>

<Header title="Profile" />

<ProfileForm {user} />

<h2>Login providers</h2>

<p class="lead">
	How you sign in. An account is made by emailed code or by an OAuth provider; a password is
	something you add here afterwards.
</p>

<ProviderList {providers} />

<h2>{set ? 'Change your password' : 'Add a password'}</h2>

<p class="lead">
	{set
		? 'Replaces the one you have. The old password stops working immediately.'
		: 'Lets you sign in without waiting for a code. Optional — the code always works.'}
</p>

<PasswordForm {set} />

<style>
	h2 {
		margin: 2.25em 0 0.4em;
		font-size: 1.1em;
	}

	.lead {
		margin: 0 0 1.25em;
		color: var(--muted);
		max-width: 60ch;
	}
</style>
