<span class="spinner" aria-hidden="true"></span>

<style>
	.spinner {
		width: 0.8em;
		height: 0.8em;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		opacity: 0.8;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation-duration: 1.4s;
		}
	}
</style>
