export const SERIES = {
	'how-i-created-personal-site': 'how i created my personal site',
	typescript: 'get to know typescript',
	macos: 'building macos web',
	'go-for-js-devs': 'golang for javascript developers',
} as const;

export type SeriesKey = keyof typeof SERIES;
