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

export const CUSTOMIZATION_STORAGE_KEY = 'slide-prompt-glass-customization-v1';

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
  { name: 'Executive Insight', promptHint: 'Sharp business framing with concise decisions and outcomes.' },
  { name: 'Story Arc', promptHint: 'Narrative-first flow with a hook, tension, and payoff.' },
  { name: 'Analyst Brief', promptHint: 'Data-driven structure with chart-friendly reasoning.' },
  { name: 'Launch Pitch', promptHint: 'Problem-solution-market storyline for product launches.' },
  { name: 'Teaching Deck', promptHint: 'Explain concepts progressively with recap moments.' },
  { name: 'Workshop Guide', promptHint: 'Interactive format with exercises and checkpoints.' },
  { name: 'Board Update', promptHint: 'Top-level strategic summary with risks and next actions.' },
  { name: 'Sales Enablement', promptHint: 'Value proposition, objections, and conversion-oriented framing.' },
  { name: 'Investor Narrative', promptHint: 'Traction metrics, growth logic, and funding rationale.' },
  { name: 'Product Walkthrough', promptHint: 'Feature-benefit storyline with visual demonstration cues.' },
  { name: 'Research Report', promptHint: 'Hypothesis, method, findings, and implications sequence.' },
  { name: 'Roadmap Sync', promptHint: 'Timeline-driven structure with dependencies and milestones.' },
  { name: 'Case Study', promptHint: 'Context-action-result format with measurable impact.' },
  { name: 'Training Sprint', promptHint: 'Fast practical learning path with short retention prompts.' },
  { name: 'Design Review', promptHint: 'Design intent, trade-offs, alternatives, and final direction.' },
  { name: 'Campaign Plan', promptHint: 'Audience-message-channel-measurement orchestration.' },
  { name: 'Change Proposal', promptHint: 'Current pain, proposed shift, expected gains, rollout plan.' },
  { name: 'Technical Deep Dive', promptHint: 'Architecture-focused sequence with clear abstraction layers.' },
  { name: 'Quarterly Recap', promptHint: 'Wins, misses, learnings, and upcoming focus.' },
  { name: 'Customer Journey', promptHint: 'Map stages, friction points, and value moments.' }
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
    options: ['Neutral Professional', 'Sci-Fi Futuristic', 'Friendly Minimal', 'Elegant Premium', 'Bold Startup']
  }
];

export type PersistedCustomization = {
  version: 1;
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

export function buildPromptPreview(input: PromptBuilderInput): string {
  const selectedCategoryText = input.categories
    .map((category) => {
      const picked = input.selections[category.id] ?? [];
      if (picked.length === 0) return null;
      return `${category.name}: ${picked.join(', ')}`;
    })
    .filter((item): item is string => Boolean(item))
    .join('\n');

  return [
    `Output Language: ${input.language}`,
    `Palette: ${input.paletteName}`,
    `Style Preset: ${input.styleName}`,
    `Style Direction: ${input.styleHint}`,
    `Colors: background ${input.colors.background}, text ${input.colors.text}, title ${input.colors.title}, highlight ${input.colors.highlight}, other colors ${
      input.colors.otherColors && input.colors.otherColors.length > 0 ? input.colors.otherColors.join(', ') : 'none'
    }`,
    selectedCategoryText ? `Category Selections:\n${selectedCategoryText}` : 'Category Selections: none',
    '',
    'Output Requirements:',
    '- Build a slide-by-slide outline with concise titles and actionable bullets.',
    '- Mention layout guidance and visual emphasis per slide.',
    '- Keep message hierarchy clear and avoid repetitive phrasing.'
  ].join('\n');
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
