export function debounce<A extends unknown[]>(fn: (...args: A) => void, delay: number) {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: A) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
}
