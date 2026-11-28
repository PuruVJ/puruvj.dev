// the life page's words, shared by the page and its markdown (life.md), so the two never drift

export const LIFE_LEDE = 'cycling, mountains, hostels, films, hans zimmer, books. and jaipur at twilight.';

export const ANNECY = [
	'in 2020 i broke my spine in a cycling accident. cycling had been my passion. i never fully recovered from it in my head. i stayed away for years, became sedentary, gained weight, and was afraid to ride.',
	'in october 2025, in annecy, i rented a bike. i kept telling myself: just 5 km out, 5 km back, that should be enough. if i go longer i may not be able to come back.',
	'something in me enjoyed it, relished it so much that i cycled like i never stopped. 50 km, all the way around the lake. it changed me.',
];

export const TREKS_NOTE = 'even the treks are solo. i join an organised group of strangers.';

export const TREKS = [
	{
		name: 'kedarkantha',
		when: 'dec 2025',
		facts: ['20 kg on my back', '12k ft', '24 km', '4 days'],
		text: 'my first, and it changed me. i was extremely fearful. emotional, hard times. i came out different.',
	},
	{
		name: 'brahmatal',
		when: 'dec 2025',
		facts: ['over new year'],
		text: 'i got ams, altitude sickness, for the first time. i overcame it.',
	},
	{
		name: 'dayara bugyal',
		when: 'jan 2026',
		facts: ['20 kg again', '+ an oxygen cylinder', '3 days to the top'],
		text: "i also carried my trek leader's oxygen cylinder, all the way up, over the 3 days of summiting.",
	},
] as const;

export const ALONE =
	'on every trek i find an hour or two to disappear to a hidden corner of the mountain and just stare. think. reflect. no phone, no songs. just me and the mountains.';
export const BAGS =
	'a habit i learnt: on local treks in jaipur i always carry garbage bags and collect garbage. it makes no difference to the mountain really. people pollute what i collect within a day. but it gives me satisfaction.';

export const SOLO = 'solo travel is the greatest influence in my life.';
export const CITIES = [
	{ name: 'interlaken', country: 'switzerland' },
	{ name: 'lucerne', country: 'switzerland' },
	{ name: 'salzburg', country: 'austria' },
];

/** lucerne, from mt pilatus */
export const PILATUS = 'from mt pilatus, above lucerne: a lone church on the mountain. so lonely, yet so powerful. the king of all churches. alone, yet mighty.';

/** a trek in switzerland */
export const GRINDELWALD = [
	'grindelwald, switzerland',
	'i went on a trek despite falling suddenly ill. one step after another, and i got graced with utmost beauty.',
] as const;

export const DUNE = 'the greatest film of my lifetime. i hold it in almost religious reverence.';
export const WATCH_QUOTE = "for me it's the details, always the details.";
export const WATCH = [
	{ k: 'first watch', v: 'the story.' },
	{ k: 'every rewatch', v: 'the details, and the making of it.' },
] as const;
export const NOTICE = [
	'i can spot exactly where a cgi camera move blends with real footage.',
	"i put myself in the camera. a move no camera operator could make pulls me out a little. it doesn't spoil the film.",
	'i love close-ups, and silent acting.',
	'i catch the leitmotifs, usually on the second viewing.',
];

export const ZIMMER = "the one composer i keep coming back to. i've listened to him consistently since i found him in 2018.";
export const TRACKS = [
	{ t: 'kiss the ring', f: 'dune: part two' },
	{ t: 'a time of quiet between the storms', f: 'dune' },
	{ t: 'flight', f: 'man of steel' },
	{ t: 'honor', f: 'the pacific' },
	{ t: 'one day', f: "pirates of the caribbean: at world's end" },
	{ t: 'final ascent', f: 'no time to die' },
] as const;
export const DRIVE =
	"when one of these comes on while i'm driving, i find a slow lane and drive very slowly. or i stop, and just listen.";

export const BOOKS = 'i grew up reading harry potter, the mahabharata, the ramayana and agatha christie. a novel addict.';

export const BUILDING = [
	'as a kid i cycled a lot. i built mud bridges and castles, and put cardboard together into boxes and machine-like things. it brought me a lot of joy.',
	"now i've always got science videos on, veritasium, startalk, or real engineering marvels, the civil kind. an engineer at heart. always looking for something inspiring.",
];

export const HOME = [
	'i live in jaipur. twilight is the time of day that feels like home.',
];

/** neapolitan pizza, the favourite */
export const PIZZA = [
	'neapolitan pizza. my favourite food.',
	'one every week, from the same place. i had about 4 on the europe trip alone.',
];

/** a word of hindi beside each part of the page: plain hindi, not urdu loanwords */
export const HI = {
	life: ['जीवन', 'life'],
	annecy: ['फिर से', 'again'],
	mountains: ['पहाड़', 'mountains'],
	solo: ['यात्रा', 'journey'],
	cinema: ['सिनेमा', 'cinema'],
	zimmer: ['संगीत', 'music'],
	books: ['पुस्तकें', 'books'],
	building: ['निर्माण', 'building'],
	pizza: ['पिज़्ज़ा', 'pizza'],
	jaipur: ['गोधूलि', 'twilight, the hour of cow-dust'],
	human: ['मनुष्य', 'human'],
} as const;

export const SCARED = ['in the age of ai, what makes a human a human?'];
