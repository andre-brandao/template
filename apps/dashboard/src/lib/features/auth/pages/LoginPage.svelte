<script lang="ts">
	import { Card } from '@template/ui';
	import type { ProviderId } from '@template/core/user/provider.sql';
	import LoginForm from '../components/LoginForm.svelte';
	import OauthList from '../components/OauthList.svelte';

	let { oauth }: { oauth: ProviderId[] } = $props();
</script>

<div class="auth">
	<!-- One box for both: there is no separate signup, because a code for an address nobody
	     holds creates the account. Saying so is the only thing that makes that discoverable. -->
	<h1>Log in or sign up</h1>
	<p class="sub">Enter your email. If you're new, the code creates your account.</p>

	<Card>
		<LoginForm />
	</Card>

	<OauthList providers={oauth} />
</div>

<style>
	.auth {
		display: flex;
		flex-direction: column;
		gap: 1em;
		width: min(380px, 100%);
		margin: 2.5em auto 0;
	}

	h1 {
		margin: 0;
		font-size: 1.3em;
	}

	.sub {
		margin: -0.6em 0 0;
		font-size: 0.85em;
		color: var(--dim);
	}
</style>
