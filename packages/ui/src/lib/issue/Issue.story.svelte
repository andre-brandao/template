<script module lang="ts">
	import type { Story } from '../story';
	import Issue from './Issue.svelte';

	export const story: Story = {
		title: 'Issue',
		blurb:
			'One thing that went wrong, said in place. Forms render one per entry in `fields.allIssues()`, so a submit that fails validation lists its reasons above the controls rather than replacing them.',
		of: Issue,
		slot: 'Enter a valid URL.'
	};
</script>
