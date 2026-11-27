/** 389312345 -> "389.3m", 111234 -> "111k", 3600 -> "3.6k" */
export function short(n: number): string {
	if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 1 : 2).replace(/\.0+$/, '') + 'b';
	if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
	if (n >= 1e4) return Math.round(n / 1e3) + 'k';
	if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
	return String(n);
}

/** 389312345 -> "389,312,345" */
export const full = (n: number) => n.toLocaleString('en-US');
