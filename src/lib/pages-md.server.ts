// every page as markdown, for agents: humans touch, agents read.
import { posts, projects, talks } from './content.server.ts';
import { read_stats } from './stats/source.server.ts';
import { project_numbers } from './project-stats.ts';
import { CAREER, span } from './career.ts';
import { EMAIL, ELSEWHERE, SITE } from './site.ts';
import { full } from './numbers.ts';

const link = (l: { name: string; href: string }) => `[${l.name}](${l.href.startsWith('/') ? SITE + l.href : l.href})`;

export function md(body: string) {
	return new Response(body.trim() + '\n', { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}

export async function home() {
	const [p, w, s] = await Promise.all([posts(), projects(), read_stats()]);
	return `# puru vijayvargia

small, fast things for the web. on the svelte team.

- work: ${w.slice(0, 3).map((x) => `${x.title} (${x.tagline})`).join(', ')}. all of it: ${SITE}/work.md
- career: ${CAREER.slice(0, 3).map((j) => `${j.org}, ${span(j)}`).join('; ')}. all of it: ${SITE}/career.md
- latest writing: ${p.slice(0, 2).map((x) => `[${x.title}](${SITE}/blog/${x.slug}.md)`).join(', ')}. all ${p.length} posts: ${SITE}/blog.md
${s?.npm ? `- ${full(s.npm.total)} npm downloads, all time: ${SITE}/stats.md\n` : ''}- talks: ${SITE}/speaking.md

## say hi

${EMAIL} · ${ELSEWHERE.map(link).join(' · ')}
`;
}

export async function blog() {
	const p = await posts();
	let out = `# writing\n\n${p.length} posts since ${p.at(-1)!.date.slice(0, 4)}. each one is also markdown at its url plus \`.md\`.\n`;
	let year = '';
	for (const x of p) {
		if (x.date.slice(0, 4) !== year) {
			year = x.date.slice(0, 4);
			out += `\n## ${year}\n\n`;
		}
		out += `- ${x.date} [${x.title}](${SITE}/blog/${x.slug}.md): ${x.description}\n`;
	}
	return out;
}

export async function work() {
	const [w, s] = await Promise.all([projects(), read_stats()]);
	let out = `# work\n`;
	for (const x of w) {
		const n = project_numbers(x, s);
		const nums = [n.downloads && `${full(n.downloads)} npm downloads, all time`, n.stars && `${full(n.stars)} github stars`]
			.filter(Boolean)
			.join(', ');
		out += `\n## ${x.title}\n\n${x.tagline}. since ${x.date.slice(0, 4)}.\n\n- site: ${x.url}\n- source: ${x.repo.url}\n${x.npm ? `- npm: ${x.npm}\n` : ''}- stack: ${x.stack}\n${nums ? `- ${nums}\n` : ''}`;
	}
	return out;
}

export function career() {
	return `# career\n\nresume: ${SITE}/resume.pdf\n\n${CAREER.map(
		(j) => `- **${j.org}**, ${j.role}, ${j.from} to ${j.to ?? 'now'}${j.note ? `. ${j.note}` : ''}`,
	).join('\n')}\n`;
}

export async function speaking() {
	const t = await talks();
	const row = (x: (typeof t)[number]) => `- ${x.date.slice(0, 7)} [${x.title}](${x.url}), ${x.event}`;
	return `# talks\n\n## on stage\n\n${t.filter((x) => x.kind === 'talk').map(row).join('\n')}\n\n## on air\n\n${t
		.filter((x) => x.kind === 'podcast')
		.map(row)
		.join('\n')}\n`;
}

export async function stats() {
	const [w, s] = await Promise.all([projects(), read_stats()]);
	if (!s) return `# stats\n\nnot counted yet.\n`;
	let out = `# stats\n\ncounted ${s.fetchedAt}, refreshed once a day.\n\n`;
	if (s.npm) {
		out += `## npm downloads, all time\n\n- every package: ${full(s.npm.total)} (${Object.keys(s.npm.packages).length} packages)\n`;
		for (const x of w) {
			const n = project_numbers(x, s);
			if (n.downloads) out += `- ${x.title}: ${full(n.downloads)}\n`;
		}
	}
	if (s.github) out += `\n## github\n\n- stars: ${full(s.github.stars)} across ${s.github.repos} repos\n`;
	if (s.code)
		out += `- lines added: ${full(s.code.additions)}\n- lines deleted: ${full(s.code.deletions)}\n- commits: ${full(s.code.commits)}\n`;
	return out;
}
