import { get_list } from '@utils/blog';
import { OGImageRoute } from 'astro-og-canvas';

const list = await get_list();

const obj = list.reduce((acc, item) => {
	acc['blog/' + item.slug] = {
		title: item.title,
	};
	return acc;
}, {} as Record<string, any>);

export const { getStaticPaths, GET } = OGImageRoute({
	// Tell us the name of your dynamic route segment.
	// In this case it’s `route`, because the file is named `[...route].ts`.
	param: 'route',

	// A collection of pages to generate images for.
	// The keys of this object are used to generate the path for that image.
	// In this example, we generate one image at `/open-graph/example.png`.
	pages: {
		blog: {
			title: 'blog',
			description: "Read about web development, designing and programming on Puru Vijay's blog.",
		},
		...obj,
		home: {
			title: "Puru's blog",
			description: "Read about web development, designing and programming on Puru Vijay's blog.",
		},
		work: {
			title: 'work',
			description: "all of Puru's projects and work.",
		},
		speaking: {
			title: 'speaking',
			description: "all of Puru's speaking engagements.",
		},
	},

	// For each page, this callback will be used to customize the OpenGraph image.
	getImageOptions: (path, page) => {
		const scale = page.title.length > 20 ? 0.8 : 1;

		return {
			title: page.title,
			description: page.description,
			logo: {
				path: './src/assets/og-logo.png',
				size: [507, 117.4],
			},
			bgImage: { path: './src/assets/og-background.png', fit: 'cover' },
			fonts: [
				'https://cdn.jsdelivr.net/fontsource/fonts/monaspace-neon@latest/latin-400-normal.ttf',
			],
			font: {
				title: {
					families: ['Monaspace Neon'],
					weight: 'Normal',
					size: 78 * scale,
					lineHeight: 1.4,
				},
				description: {
					families: ['Comfortaa'],
					weight: 'Normal',
					size: 36 * scale,
					color: [190, 190, 190],
				},
			},
			// There are a bunch more options you can use here!
			format: 'PNG',
			quality: 100,
		};
	},
});
