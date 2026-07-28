<script lang="ts">
	import { FormBoundary } from '@template/ui';
	import { user } from '$lib/context/user';
	import { org } from '$lib/context/org';
	import { getMembers } from '../api/members.remote';
	import { getRoles } from '../api/roles.remote';
	import MemberRow from './MemberRow.svelte';

	const me = user();
	const ctx = org();
	const members = $derived(await getMembers());
	const roles = $derived(await getRoles());
	const manage = $derived(ctx.can('member:manage'));
</script>

<FormBoundary>
	<table>
		<thead>
			<tr>
				<th>Member</th>
				<th>Role</th>
				{#if manage}
					<th></th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each members as member (member.id)}
				<MemberRow {member} {roles} {manage} self={member.email === me.current?.email} />
			{/each}
		</tbody>
	</table>
</FormBoundary>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		font-family: var(--font-mono);
		font-size: 0.78em;
		font-weight: 500;
		color: var(--dim);
		padding: 0 0.6em 0.5em;
	}
</style>
