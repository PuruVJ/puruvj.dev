import { md, stats } from '#lib/pages-md.server.ts';

export const prerender = true;
export const GET = async () => md(await stats());
