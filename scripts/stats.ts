// count the stats now and refresh the shared cache: `pnpm stats`. `--force` ignores the one-day
// cache, `--full` also recounts every npm download since 2015 instead of adding the new days.
// builds do the same on their own, at most once a day.
import { get_stats } from '../src/lib/stats/cache.ts';

const s = await get_stats({ force: process.argv.includes('--force'), full: process.argv.includes('--full') });
console.log(JSON.stringify(s && { ...s, npm: s.npm && { ...s.npm, packages: Object.keys(s.npm.packages).length } }, null, 2));
