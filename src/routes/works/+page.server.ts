import { redirect } from '@sveltejs/kit';

// the old address. vercel.json answers it with a real 308; this covers previews and local builds.
export const load = () => redirect(308, '/work');
