<script lang="ts">
	import { Input, Select } from '@template/ui';
	import type { doc } from './api.remote';

	type Param = Awaited<ReturnType<typeof doc>>[number]['params'][number];

	// Bindable because the form edits the bag in place — that is the whole job.
	let { params, values = $bindable({}) }: { params: Param[]; values?: Record<string, string> } =
		$props();
</script>

{#if params.length}
	<section>
		{#each params as one (one.name)}
			<label class="field">
				<span>{one.name}{one.required ? ' *' : ''}</span>
				{#if one.options}
					<Select
						options={[
							{ value: '', label: '—' },
							...one.options.map((choice) => ({ value: choice, label: choice }))
						]}
						value={values[one.name] ?? ''}
						onchange={(e) => (values[one.name] = e.currentTarget.value)}
					/>
				{:else}
					<Input
						value={values[one.name] ?? ''}
						oninput={(e) => (values[one.name] = e.currentTarget.value)}
					/>
				{/if}
			</label>
		{/each}
	</section>
{/if}

<style>
	section {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13em, 1fr));
		gap: 0.8em;
		margin-bottom: 1.2em;
	}
</style>
