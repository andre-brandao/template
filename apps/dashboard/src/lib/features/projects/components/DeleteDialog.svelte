<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input, Modal } from '@template/ui';
	import { removeProject } from '../api/projects.remote';

	let { id, name }: { id: string; name: string } = $props();

	const remove = $derived(removeProject.for(id));

	let open = $state(false);
	let typed = $state('');
	const ok = $derived(typed.trim() === name);
</script>

<Button
	variant="danger"
	onclick={() => {
		typed = '';
		open = true;
	}}
>
	Delete project
</Button>

<Modal bind:open>
	<h2>Delete project</h2>

	<p class="warn">
		This removes <b>{name}</b> along with its stages and its insights. Todos filed under it are kept
		and stay in the Todos list.
	</p>

	<form
		{...remove.enhance(async (f) => {
			await f.submit();
			goto('/projects');
		})}
	>
		<input {...remove.fields.id.as('hidden', id)} />

		<label class="confirm">
			<span>Type <code>{name}</code> to confirm</span>
			<Input
				value={typed}
				autocomplete="off"
				autocapitalize="off"
				spellcheck={false}
				oninput={(e) => (typed = e.currentTarget.value)}
			/>
		</label>

		<div class="foot">
			<Button variant="ghost" type="button" onclick={() => (open = false)}>Cancel</Button>
			<Button variant="danger" type="submit" disabled={!ok} pending={!!remove.pending}>
				Delete project
			</Button>
		</div>
	</form>
</Modal>

<style>
	h2 {
		margin: 0 0 0.6em;
		font-size: 1.1em;
	}

	.warn {
		margin: 0 0 1.25em;
		color: var(--muted);
		font-size: 0.9em;
		line-height: 1.55;
	}

	.warn b {
		color: var(--ink);
		font-weight: 600;
	}

	.confirm {
		display: flex;
		flex-direction: column;
		gap: 0.45em;
	}

	/* Deliberately not the global `.field` label, which uppercases its text — the name
	   has to be shown exactly as it must be typed. */
	.confirm > span {
		color: var(--muted);
		font-size: 0.85em;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.92em;
		padding: 0.1em 0.35em;
		border-radius: 4px;
		background: var(--surface-2);
		color: var(--ink);
	}

	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 0.6em;
		margin-top: 1.25em;
	}
</style>
