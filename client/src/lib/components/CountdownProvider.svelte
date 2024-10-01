<script lang="ts">
	import { createEventDispatcher } from 'svelte'; 	
	import { onMount, onDestroy, afterUpdate } from 'svelte';

	export let end_time: number = 0;
	const dispatch = createEventDispatcher();
	
	type TimerId = ReturnType<typeof setInterval> | undefined;
	let timer_id: TimerId = undefined;
	let ms_left = 0;
	
	const updateTimer = () => {
		ms_left = end_time - Date.now();
	}

	onMount(() => {
		updateTimer();
		timer_id = setInterval(updateTimer, 100);
	});
	
	onDestroy(() => {
		if (timer_id) clearInterval(timer_id);
	});
	
	$: {
		console.log(ms_left, timer_id)
		if (ms_left <= 0 && timer_id) {
			clearInterval(timer_id);
			timer_id = undefined;
			dispatch('completed');
		}
	}
</script>

<style>
	ul {
		display: inline-block;
		list-style: none;
		padding-left: 0;
		height: 94px;
		overflow: hidden;
	}

	.num {
    font-size: 94px;
	}
</style>

<slot {ms_left} />