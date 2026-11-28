import { md, work } from '#lib/pages-md.server.ts';

export const prerender = true;
export const GET = async () => md(await work());
