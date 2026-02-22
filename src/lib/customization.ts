import type { UILanguage } from '../types';

export type ColorSet = {
  background: string;
  text: string;
  title: string;
  highlight: string;
  otherColors?: string[];
};

export type Palette = {
  id: string;
  name: string;
  colors: ColorSet;
  isCustom: boolean;
};

export type StylePreset = {
  id: string;
  name: string;
  promptHint: string;
  isCustom: boolean;
};

export type CategoryTemplate = {
  id: string;
  name: string;
  multi: boolean;
  options: string[];
  isCustom: boolean;
};

export type SelectionMap = Record<string, string[]>;

export const CUSTOMIZATION_STORAGE_KEY = 'slide-style-prompt-customization';
export const SETTINGS_VERSION = 'v0.0.1';
export const SETTINGS_VERSIONS = {
  paletteLibrary: SETTINGS_VERSION,
  stylePresets: SETTINGS_VERSION,
  categoryTags: SETTINGS_VERSION
} as const;

const paletteData: Array<{ name: string; colors: ColorSet }> = [
  { name: 'Pacific Reef', colors: { background: '#0B3C5D', text: '#328CC1', title: '#0CAADC', highlight: '#F7F9FB', otherColors: ['#D9EEF7'] } },
  { name: 'Aurora Sunset', colors: { background: '#FF6B6B', text: '#FFA94D', title: '#FFD166', highlight: '#FFECCF', otherColors: ['#F5F0E3'] } },
  { name: 'Forest Mist', colors: { background: '#1B4332', text: '#2D6A4F', title: '#52B788', highlight: '#95D5B2', otherColors: ['#D8F3DC'] } },
  { name: 'Lavender Night', colors: { background: '#2E1F47', text: '#5E3B76', title: '#8E6BA1', highlight: '#C1A3D6', otherColors: ['#F2E9FB'] } },
  { name: 'Sand Dune', colors: { background: '#5C4B3B', text: '#8C6A4A', title: '#C8A27E', highlight: '#E6CBA8', otherColors: ['#F7E9D7'] } },
  { name: 'Neon Pulse', colors: { background: '#0F172A', text: '#312E81', title: '#7C3AED', highlight: '#EC4899', otherColors: ['#F472B6'] } },
  { name: 'Arctic Sky', colors: { background: '#0EA5E9', text: '#38BDF8', title: '#7DD3FC', highlight: '#E0F2FE', otherColors: ['#F8FAFC'] } },
  { name: 'Citrus Pop', colors: { background: '#FF6B35', text: '#FFA62B', title: '#FFC971', highlight: '#FFE8C2', otherColors: ['#F7F7F7'] } },
  { name: 'Minimal Mono', colors: { background: '#0F172A', text: '#1F2937', title: '#334155', highlight: '#CBD5E1', otherColors: ['#E2E8F0'] } },
  { name: 'Rose Cloud', colors: { background: '#7F1D1D', text: '#E11D48', title: '#F472B6', highlight: '#F9A8D4', otherColors: ['#FDF2F8'] } },
  { name: 'Jade Garden', colors: { background: '#0F766E', text: '#15803D', title: '#22C55E', highlight: '#4ADE80', otherColors: ['#BBF7D0'] } },
  { name: 'Indigo Drift', colors: { background: '#1E3A8A', text: '#4338CA', title: '#6366F1', highlight: '#A5B4FC', otherColors: ['#E0E7FF'] } },
  { name: 'Amber Glow', colors: { background: '#854D0E', text: '#B45309', title: '#D97706', highlight: '#FBBF24', otherColors: ['#FEF3C7'] } },
  { name: 'Glacier Lake', colors: { background: '#0B6E4F', text: '#168AAD', title: '#1A9FBF', highlight: '#52B2CF', otherColors: ['#D8EEFA'] } },
  { name: 'Slate Neon', colors: { background: '#111827', text: '#1F2937', title: '#06B6D4', highlight: '#22D3EE', otherColors: ['#67E8F9'] } },
  { name: 'Coral Mint', colors: { background: '#9F1239', text: '#E11D48', title: '#FB7185', highlight: '#10B981', otherColors: ['#99F6E4'] } },
  { name: 'Mocha Cream', colors: { background: '#3F2E2B', text: '#6B4F4F', title: '#A47148', highlight: '#D4B483', otherColors: ['#F3E9DC'] } },
  { name: 'Royal Velvet', colors: { background: '#2C1348', text: '#4C1D95', title: '#7C3AED', highlight: '#A78BFA', otherColors: ['#DDD6FE'] } },
  { name: 'Coastal Breeze', colors: { background: '#0F172A', text: '#1D4ED8', title: '#38BDF8', highlight: '#A5F3FC', otherColors: ['#E0F2FE'] } },
  { name: 'Desert Twilight', colors: { background: '#1F1300', text: '#7C2D12', title: '#EA580C', highlight: '#F97316', otherColors: ['#FED7AA'] } }
];

const styleData: Array<{ name: string; promptHint: string }> = [
  { name: 'Photorealistic', promptHint: 'Use realistic lighting, precise materials, and high-detail textures for premium product-grade visuals' },
  { name: 'Cinematic Lighting', promptHint: 'Use dramatic key light, rich shadows, and film-like contrast to create narrative tension and depth' },
  { name: 'Minimalist', promptHint: 'Use large whitespace, restrained color usage, and simple composition to emphasize one core message' },
  { name: 'Flat Design', promptHint: 'Use clean 2D shapes, clear iconography, and balanced spacing for modern and readable slides' },
  { name: 'Isometric', promptHint: 'Use isometric 2.5D perspective with clear geometry for systems, architecture, and process storytelling' },
  { name: '3D Render / C4D Style', promptHint: 'Use polished 3D forms, soft reflections, and controlled depth for a futuristic tech presentation look' },
  { name: 'Memphis Design', promptHint: 'Use playful geometric accents, bold color blocking, and energetic layout rhythm for creative storytelling' },
  { name: 'Cyberpunk', promptHint: 'Use neon highlights, dark atmosphere, and high-tech urban mood for future-focused product narratives' },
  { name: 'Line Art', promptHint: 'Use precise monoline strokes and minimal fill to keep diagrams, flows, and concepts clean and legible' },
  { name: 'Synthwave', promptHint: 'Use retro-futuristic gradients, grid motifs, and purple-blue glow to evoke nostalgic digital energy' },
  { name: 'Pixel Art', promptHint: 'Use deliberate pixel edges, low-resolution charm, and playful retro game aesthetics for approachable visuals' },
  { name: 'Risograph', promptHint: 'Use grain texture, offset color layers, and print-like imperfection for editorial and artistic presentation tone' },
  { name: 'Bauhaus', promptHint: 'Use strong geometry, primary color hierarchy, and strict functional composition for modernist clarity' },
  { name: 'Low Poly', promptHint: 'Use faceted polygon surfaces, simplified forms, and crisp lighting for abstract modern visuals' },
  { name: 'Watercolor', promptHint: 'Use soft pigment diffusion, gentle gradients, and organic edges for warm and human storytelling' },
  { name: 'Oil Painting', promptHint: 'Use rich brush texture, layered pigment depth, and classical color balance for serious timeless mood' },
  { name: 'Ukiyo-e', promptHint: 'Use flat planes, stylized contour lines, and traditional Japanese balance for refined cultural storytelling' },
  { name: 'Pop Art', promptHint: 'Use saturated contrast, comic-inspired shapes, and bold repetition for high-impact attention-grabbing slides' },
  { name: 'Paper Cutout', promptHint: 'Use layered paper depth, soft shadows, and handcrafted silhouettes for tactile friendly visuals' },
  { name: 'Charcoal Sketch', promptHint: 'Use rough charcoal strokes, tonal shading, and conceptual composition for ideation-first storytelling' }
];

export const DEFAULT_PALETTES: Palette[] = paletteData.map((item, index) => ({
  id: `palette-default-${index + 1}`,
  name: item.name,
  colors: item.colors,
  isCustom: false
}));

export const DEFAULT_STYLE_PRESETS: StylePreset[] = styleData.map((item, index) => ({
  id: `style-default-${index + 1}`,
  name: item.name,
  promptHint: item.promptHint,
  isCustom: false
}));

export const DEFAULT_CATEGORIES: CategoryTemplate[] = [
  {
    id: 'typography',
    name: 'Typography',
    multi: true,
    isCustom: false,
    options: ['Bold Sans', 'Serif Mix', 'Mono Accent', 'Editorial', 'Clean Geometric', 'High Contrast']
  },
  {
    id: 'mood',
    name: 'Mood',
    multi: true,
    isCustom: false,
    options: ['Confident', 'Playful', 'Calm', 'Energetic', 'Luxury', 'Minimal']
  },
  {
    id: 'audience',
    name: 'Audience',
    multi: true,
    isCustom: false,
    options: ['Executives', 'Product Team', 'Design Team', 'Students', 'Customers', 'Investors']
  },
  {
    id: 'purpose',
    name: 'Purpose',
    multi: true,
    isCustom: false,
    options: ['Pitch', 'Teaching', 'Report', 'Workshop', 'Decision Review', 'Roadmap']
  },
  {
    id: 'character-theme',
    name: 'Character Theme',
    multi: false,
    isCustom: false,
    options: [
      'Harry Potter',
      'Crayon Shin-chan',
      'Dragon Ball',
      'Luffy (One Piece)',
      'Doraemon',
      'Spider-Man',
      'Iron Man',
      'Sherlock Holmes'
    ]
  }
];

export type PersistedCustomization = {
  version: 1;
  settingVersions?: {
    paletteLibrary: string;
    stylePresets: string;
    categoryTags: string;
  };
  customPalettes: Palette[];
  customStyles: StylePreset[];
  categories: CategoryTemplate[];
  selectedPaletteId: string;
  selectedStyleId: string;
  colors: ColorSet;
  selections: SelectionMap;
};

export type PromptBuilderInput = {
  language: UILanguage;
  colors: ColorSet;
  paletteName: string;
  styleName: string;
  styleHint: string;
  selections: SelectionMap;
  categories: CategoryTemplate[];
};

export type PromptPreviewCopy = {
  outputLanguage: string;
  palette: string;
  stylePreset: string;
  styleDirection: string;
  colors: string;
  colorKeys: {
    background: string;
    text: string;
    title: string;
    highlight: string;
    otherColors: string;
  };
  none: string;
};

export function isPromptPreviewCopy(value: unknown): value is PromptPreviewCopy {
  if (!value || typeof value !== 'object') return false;
  const typed = value as Record<string, unknown>;
  const colorKeys = typed.colorKeys as Record<string, unknown> | undefined;
  return (
    typeof typed.outputLanguage === 'string' &&
    typeof typed.palette === 'string' &&
    typeof typed.stylePreset === 'string' &&
    typeof typed.styleDirection === 'string' &&
    typeof typed.colors === 'string' &&
    typeof typed.none === 'string' &&
    colorKeys !== undefined &&
    typeof colorKeys.background === 'string' &&
    typeof colorKeys.text === 'string' &&
    typeof colorKeys.title === 'string' &&
    typeof colorKeys.highlight === 'string' &&
    typeof colorKeys.otherColors === 'string'
  );
}

export function buildPromptPreview(input: PromptBuilderInput, copy: PromptPreviewCopy): string {
  const categorySelections = input.categories
    .map((category) => {
      const picked = input.selections[category.id] ?? [];
      if (picked.length === 0) return null;
      return `${category.name}: ${picked.join(', ')}`;
    })
    .filter((item): item is string => item !== null);

  return [
    `${copy.outputLanguage}: ${input.language}`,
    `${copy.palette}: ${input.paletteName}`,
    `${copy.colors}: ${copy.colorKeys.background} ${input.colors.background}, ${copy.colorKeys.text} ${input.colors.text}, ${copy.colorKeys.title} ${input.colors.title}, ${copy.colorKeys.highlight} ${input.colors.highlight}, ${copy.colorKeys.otherColors} ${
      input.colors.otherColors && input.colors.otherColors.length > 0 ? input.colors.otherColors.join(', ') : copy.none
    }`,
    `${copy.stylePreset}: ${input.styleName}`,
    `${copy.styleDirection}: ${input.styleHint}`,
    ...categorySelections
  ].join('\n');
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
