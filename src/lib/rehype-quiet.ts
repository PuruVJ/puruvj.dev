// images go through @ogygia/image (responsive files the build makes). videos have no such step
// yet, so the prose drops them (the files stay in the content folders). outside links open in a
// new tab.
type Node = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: Node[];
};

const MEDIA = new Set(['video', 'source']);
const MEDIA_FILE = /\.(mp4|webm)$/i;
const RAW_MEDIA = /<video\b[\s\S]*?<\/video>|<source\b[^>]*>/gi;

function is_local_media(href: string) {
	return !/^[a-z]+:|^\/\//i.test(href) && MEDIA_FILE.test(href);
}

function walk(node: Node) {
	if (!node.children) return;
	const out: Node[] = [];
	for (const c of node.children) {
		if (c.type === 'element' && MEDIA.has(c.tagName!)) continue;
		if (c.type === 'raw' && c.value) {
			c.value = c.value.replace(RAW_MEDIA, '');
			if (!c.value.trim()) continue;
		}
		if (c.type === 'element' && c.tagName === 'a') {
			const href = String(c.properties?.href ?? '');
			// a link to a video beside the post: keep the words, drop the link
			if (is_local_media(href)) {
				walk(c);
				out.push(...(c.children ?? []));
				continue;
			}
			if (/^https?:\/\//.test(href) && !href.startsWith('https://puruvj.dev')) {
				c.properties!.target = '_blank';
				c.properties!.rel = ['noopener', 'noreferrer'];
			}
		}
		walk(c);
		out.push(c);
	}
	// a paragraph that only held a video is empty now: drop it
	node.children = out.filter(
		(c) =>
			!(
				c.type === 'element' &&
				c.tagName === 'p' &&
				(c.children ?? []).every((k) => k.type === 'text' && !String(k.value).trim())
			),
	);
}

export function rehypeQuiet() {
	return (tree: Node) => walk(tree);
}
