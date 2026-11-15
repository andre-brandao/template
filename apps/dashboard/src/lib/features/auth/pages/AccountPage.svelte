<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Issue, Section } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { providers } from '../api/profile.query';
	import PasswordForm from '../components/PasswordForm.svelte';
	import ProviderList from '../components/ProviderList.svelte';

	const q = createQuery(providers);
	const set = $derived(!!q.data?.some((one) => one.id === 'password' && one.connected));
</script>

<!-- How you sign in. Name and avatar live on your profile, where others see them. -->
<Header.Root title="Account" lead="How you sign in." />

{#if q.error}
	<Issue>{q.error.message}</Issue>
{:else if q.data}
	<Section
		title="Login providers"
		description="An emailed code or an OAuth provider makes the account; a password is optional."
	>
		<ProviderList providers={q.data} />
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
{/if}
