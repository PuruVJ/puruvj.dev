<script lang="ts">
	// india time. the server renders the label; this fills the time in, writing straight to the DOM.
	const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
	function tick(el: HTMLElement) {
		const write = () => (el.textContent = `india ${fmt.format(new Date())}`);
		write();
		const t = setInterval(write, 15000);
		return () => clearInterval(t);
	}
</script>

<span class="clock" {@attach tick}>india</span>
