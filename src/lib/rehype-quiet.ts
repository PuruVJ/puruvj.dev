// images and videos wait for ogygia's image package. until then the prose drops them
// (the files stay in the content folders), and outside links open in a new tab.
type Node = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: Node[] };

const MEDIA = new Set(['img', 'video', 'picture', 'figure']);

function walk(node: Node) {
	if (!node.children) return;
	node.children = node.children.filter((c) => !(c.type === 'element' && MEDIA.has(c.tagName!)));
	for (const c of node.children) {
		walk(c);
		if (c.type === 'element' && c.tagName === 'a') {
			const href = String(c.properties?.href ?? '');
			if (/^https?:\/\//.test(href) && !href.startsWith('https://puruvj.dev')) {
				c.properties!.target = '_blank';
				c.properties!.rel = ['noopener', 'noreferrer'];
			}
		}
	}
	// a paragraph that only held an image is now empty: drop it
	node.children = node.children.filter(
		(c) =>
			!(c.type === 'element' && c.tagName === 'p' && (c.children ?? []).every((k) => k.type === 'text' && !String((k as any).value).trim())),
	);
}

export function rehypeQuiet() {
	return (tree: Node) => walk(tree);
}
