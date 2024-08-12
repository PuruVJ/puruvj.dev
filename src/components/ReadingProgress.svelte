<script lang="ts">
	import { onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';

	const reading_progress = tweened(0, {
		easing: quintOut,
	});

	/**
	 * Reduce calls to the passed function with throttle.
	 *
	 * @param func - Function to throttle.
	 * @param threshold - The delay to avoid recalling the function.
	 */
	function throttle<T extends (...args: any[]) => any>(func: T, threshold: number): T {
		let last_args: Parameters<T> | null;
		let should_wait = false;
		function timeout_function(self: any) {
			if (last_args) {
				func.apply(self, last_args);
				setTimeout(timeout_function, threshold, self);
				last_args = null;
				return;
			}
			should_wait = false;
		}

		return function throttled(this: any, ...args: Parameters<T>): any {
			const self = this;

			if (should_wait) {
				last_args = args;
				return;
			}

			func.apply(self, args);
			should_wait = true;
			setTimeout(timeout_function, threshold, self);
		} as T;
	}

	function handle_progress_bar() {
		const { scrollHeight, clientHeight, scrollTop } = document.documentElement;

		$reading_progress = scrollTop / (scrollHeight - clientHeight);
	}

	onMount(() => {
		const abort_controller = new AbortController();

		document.addEventListener('scroll', throttle(handle_progress_bar, 50), {
			signal: abort_controller.signal,
		});

		return () => {
			$reading_progress = 0;
		};
	});
</script>

<div class="progress" aria-roledescription="progress">
	<div class="indicator" style="scale: {$reading_progress} 1" />
</div>

<style>
	.progress {
		position: fixed;
		left: 0;
		top: 0;
		z-index: 21000;

		margin: 0;

		width: 100%;
		height: 4px;
	}

	.indicator {
		height: 4px;
		width: 100%;

		background-color: var(--app-color-primary);

		scale: 0 1;
		transform-origin: 0 0;
	}
</style>
