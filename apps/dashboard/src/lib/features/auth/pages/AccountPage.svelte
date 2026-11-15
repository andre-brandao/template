<script lang="ts">
	import { Section } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { getProviders } from '../api/profile.remote';
	import PasswordForm from '../components/PasswordForm.svelte';
	import ProviderList from '../components/ProviderList.svelte';

	const providers = $derived(await getProviders());
	const set = $derived(providers.some((one) => one.id === 'password' && one.connected));
</script>

<!-- How you sign in. Name and avatar live on your profile, where others see them. -->
<Header.Root title="Account" lead="How you sign in." />

<Section
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
