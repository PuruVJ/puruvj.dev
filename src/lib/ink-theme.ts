// black-and-white shiki themes: weight, slant and grey do the work colour usually does.
type Ink = { fg: string; dim: string; mid: string };

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
				settings: { foreground: c.fg, fontStyle: 'bold' },
			},
			{ scope: ['string', 'string.template', 'markup.inline.raw'], settings: { foreground: c.mid } },
			{ scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: c.fg } },
			{ scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: c.fg } },
			{ scope: ['entity.name.type', 'support.type', 'entity.name.class', 'entity.other.inherited-class'], settings: { foreground: c.fg, fontStyle: 'italic' } },
			{ scope: ['entity.name.tag', 'support.class.component'], settings: { foreground: c.fg, fontStyle: 'bold' } },
			{ scope: ['entity.other.attribute-name'], settings: { foreground: c.mid, fontStyle: 'italic' } },
			{ scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: c.mid } },
			{ scope: ['markup.deleted'], settings: { foreground: c.dim } },
			{ scope: ['markup.inserted'], settings: { foreground: c.fg, fontStyle: 'bold' } },
		],
	};
}

export const ink = {
	light: theme('ink-light', 'light', { fg: '#0d0d0c', mid: '#5f5e5a', dim: '#8a8983' }),
	dark: theme('ink-dark', 'dark', { fg: '#ecebe6', mid: '#a9a8a2', dim: '#77766f' }),
};
