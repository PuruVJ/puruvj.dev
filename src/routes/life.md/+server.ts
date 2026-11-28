import { md, life } from '$lib/pages-md.server.ts';

export const prerender = true;
export const GET = () => md(life());
