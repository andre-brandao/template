<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { getMe, getProviders } from '../api/profile.remote';
	import ProfileForm from '../components/ProfileForm.svelte';
	import ProviderList from '../components/ProviderList.svelte';

	const user = $derived(await getMe());
	const providers = $derived(await getProviders());
</script>

<Header title="Profile" />

<ProfileForm {user} />

<h2>Login providers</h2>

<p class="lead">How you sign in. Email and password is the only provider wired up today.</p>

<ProviderList {providers} />

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
