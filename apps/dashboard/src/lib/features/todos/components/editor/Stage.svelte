<!-- A todo's stage, saved on pick: suggests the project's stages and creates whatever is new. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Status } from '@template/ui';
	import { update } from '../../api/todos.query';
	import StagePicker from '../StagePicker.svelte';

	let { todo }: { todo: Todo.Info } = $props();

	const save = update();
</script>

<span class="stage">
	<StagePicker
		scope={{ source: todo.source ?? undefined, sourceID: todo.sourceID ?? undefined }}
		value={todo.stage ?? ''}
		onchange={(stage) =>
			stage !== (todo.stage ?? '') &&
			save.mutate({ path: { id: todo.id }, body: { stage: stage || null } })}
	/>
	<Status of={save} />
</span>

<style>
	.stage {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		min-width: 0;
	}
</style>
