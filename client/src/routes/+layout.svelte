<script>
	import '../app.css';
	import '../font.css';
	import 'iconify-icon';

	import { page } from '$app/stores';

	$: use_greenscreen = $page.url.searchParams.has('greenscreen');
</script>

<div class="{use_greenscreen ? 'bg-[#00ff00]' : 'bg-surface-900'} w-full min-h-[100vh] block">
	<slot></slot>
</div>