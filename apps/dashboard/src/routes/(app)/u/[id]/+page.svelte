<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import UserPage from '$lib/features/people/pages/UserPage.svelte';
	import { get } from '$lib/features/people/api/people.query';
	import ProfileForm from '$lib/features/auth/components/ProfileForm.svelte';
	import { me } from '$lib/features/auth/api/profile.query';
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';
	import AppName from '$lib/features/developers/components/app/AppName.svelte';
	import AppPanel from '$lib/features/developers/components/app/AppPanel.svelte';
	import { invalidate } from '$lib/query';
	import { createQuery } from '@tanstack/svelte-query';

	let { params } = $props();

	const account = createQuery(me);

	// The layout's crumbs and rail carry the name too, so a rename reruns its load.
	const changed = (id: string) => Promise.all([invalidate(get(id).queryKey), invalidateAll()]);
</script>

<!--
	One page per account. The people slice owns the profile; editing comes from whichever
	slice owns that account's fields — your own from auth, an App's from developers.
	`params` swaps to the next route's mid-navigation; the guard keeps `id` defined.
-->
{#if params.id}
	{@const id = params.id}
	<UserPage {id}>
		{#snippet name(profile)}
			{#if profile.manage}
				<AppName {id} name={profile.name} onchange={() => changed(id)} />
			{:else}
				{profile.name}
			{/if}
		{/snippet}
		{#snippet edit(profile)}
			{#if profile.self}
				{#if account.data}<ProfileForm user={account.data} onchange={() => changed(id)} />{/if}
			{:else}
				<AvatarUpload
					name={profile.name}
					image={profile.image}
					url="/avatars/user/{id}"
					onchange={() => changed(id)}
				/>
			{/if}
		{/snippet}
		{#snippet app()}
			<AppPanel {id} />
		{/snippet}
	</UserPage>
{/if}
