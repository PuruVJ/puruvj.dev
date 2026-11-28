// shiki themes: ink, with a splash of colour on the four things a reader looks for first.
// keywords in pink, strings in teal, function names in blue, types and numbers in amber.
// comments and punctuation stay grey, so the colour never turns into a rainbow. the light set is
// a cleaner, deeper twin of the dark one, so it doesn't go muddy on paper.
type Ink = { fg: string; dim: string; mid: string; kw: string; str: string; fn: string; ty: string };

function theme(name: string, type: 'light' | 'dark', c: Ink) {
	return {
		name,
		type,
		colors: { 'editor.background': '#00000000', 'editor.foreground': c.fg },
		tokenColors: [
			{ settings: { foreground: c.fg } },
			{ scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.dim, fontStyle: 'italic' } },
			{
				scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator.new', 'keyword.operator.expression', 'variable.language'],
				settings: { foreground: c.kw, fontStyle: 'bold' },
			},
			{ scope: ['string', 'string.template', 'markup.inline.raw'], settings: { foreground: c.str } },
			{ scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: c.ty } },
			{ scope: ['entity.name.function', 'support.function', 'meta.function-call', 'variable.function'], settings: { foreground: c.fn } },
			{ scope: ['entity.name.type', 'support.type', 'entity.name.class', 'entity.other.inherited-class'], settings: { foreground: c.ty, fontStyle: 'italic' } },
			{ scope: ['entity.name.tag', 'support.class.component'], settings: { foreground: c.kw, fontStyle: 'bold' } },
			{ scope: ['entity.other.attribute-name'], settings: { foreground: c.mid, fontStyle: 'italic' } },
			{ scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: c.mid } },
			{ scope: ['markup.deleted'], settings: { foreground: c.dim } },
			{ scope: ['markup.inserted'], settings: { foreground: c.str, fontStyle: 'bold' } },
		],
	};
}

export const ink = {
	light: theme('ink-light', 'light', { fg: '#0d0d0c', mid: '#6d6b64', dim: '#8f8d86', kw: '#c42b7a', str: '#0f7d8c', fn: '#2f55c9', ty: '#a3620a' }),
	dark: theme('ink-dark', 'dark', { fg: '#ecebe6', mid: '#9a988f', dim: '#77756f', kw: '#ff79c0', str: '#5fd7e0', fn: '#8fb0ff', ty: '#ffc46b' }),
};
