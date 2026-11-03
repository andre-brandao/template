<script lang="ts">
	import { Section } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { getMe, getProviders } from '../api/profile.remote';
	import PasswordForm from '../components/PasswordForm.svelte';
	import ProfileForm from '../components/ProfileForm.svelte';
	import ProviderList from '../components/ProviderList.svelte';

	const user = $derived(await getMe());
	const providers = $derived(await getProviders());
	const set = $derived(providers.some((one) => one.id === 'password' && one.connected));
</script>

<Header.Root title="Profile" lead="How you appear to others and how you sign in." />

<Section title="Account" description="Your avatar and the name shown on todos and comments.">
	<ProfileForm {user} />
</Section>

<Section
	divider
	title="Login providers"
	description="An emailed code or an OAuth provider makes the account; a password is optional."
>
	<ProviderList {providers} />
</Section>

<Section
	divider
	title={set ? 'Change password' : 'Add a password'}
	description={set
		? 'The old password stops working immediately.'
		: 'Sign in without waiting for a code. The code always works.'}
>
	<PasswordForm {set} />
</Section>
