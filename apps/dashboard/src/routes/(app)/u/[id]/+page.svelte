<script lang="ts">
	import UserPage from '$lib/features/people/pages/UserPage.svelte';
	import { get } from '$lib/features/people/api/people.query';
	import ProfileForm from '$lib/features/auth/components/ProfileForm.svelte';
	import { getMe } from '$lib/features/auth/api/profile.remote';
	import AppEditForm from '$lib/features/developers/components/app/AppEditForm.svelte';
	import AppPanel from '$lib/features/developers/components/app/AppPanel.svelte';
	import { invalidate } from '$lib/query';

	let { params } = $props();
</script>

<!--
	One page per account. The people slice owns the profile; editing comes from whichever
	slice owns that account's fields — your own from auth, an App's from developers.
	`params` swaps to the next route's mid-navigation; the guard keeps `id` defined.
-->
{#if params.id}
	{@const id = params.id}
	<UserPage {id}>
		{#snippet edit(profile)}
			{#if profile.self}
				<ProfileForm user={await getMe()} onchange={() => invalidate(get(id).queryKey)} />
			{:else}
				<AppEditForm
					{id}
					name={profile.name}
					image={profile.image}
					onchange={() => invalidate(get(id).queryKey)}
				/>
			{/if}
		{/snippet}
		{#snippet app()}
			<AppPanel {id} />
		{/snippet}
	</UserPage>
{/if}
