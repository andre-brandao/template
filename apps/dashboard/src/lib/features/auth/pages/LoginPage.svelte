<script lang="ts">
	import { Card } from '@template/ui';
	import type { ProviderId } from '@template/core/auth/provider.sql';
	import Frame from '../components/Frame.svelte';
	import LoginForm from '../components/LoginForm.svelte';
	import OauthList from '../components/OauthList.svelte';

	let { oauth }: { oauth: ProviderId[] } = $props();
</script>

<!-- One box for both: a code for an address nobody holds creates the account, and the lead
     is the only thing that makes that discoverable. -->
<Frame title="Log in or sign up" lead="Enter your email. If you're new, the code creates your account.">
	<Card>
		<LoginForm />
	</Card>

	<OauthList providers={oauth} />
</Frame>
