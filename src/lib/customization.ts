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
  {
    name: 'Garnet Sunrise',
    colors: {
      background: '#FFF1F5',
      text: '#4A1D2D',
      title: '#B4234E',
      highlight: '#F97393',
      otherColors: ['#FDE2E4', '#7A2846']
    }
  },
  {
    name: 'Royal Gemstone Dusk',
    colors: {
      background: '#EEF2FF',
      text: '#1E1B4B',
      title: '#4338CA',
      highlight: '#8B5CF6',
      otherColors: ['#22D3EE', '#C4B5FD']
    }
  },
  {
    name: 'Ruby Charcoal Twilight',
    colors: {
      background: '#F8FAFC',
      text: '#1F2937',
      title: '#7F1D1D',
      highlight: '#EF4444',
      otherColors: ['#374151', '#FCA5A5']
    }
  },
  {
    name: 'Emerald Ruby Dawn',
    colors: {
      background: '#ECFDF5',
      text: '#14532D',
      title: '#059669',
      highlight: '#BE123C',
      otherColors: ['#FDE68A', '#FCA5A5']
    }
  },
  {
    name: 'Crimson Amethyst Nightfall',
    colors: {
      background: '#FDF2F8',
      text: '#3F1D2E',
      title: '#BE123C',
      highlight: '#9333EA',
      otherColors: ['#F472B6', '#C4B5FD']
    }
  },
  {
    name: 'Emerald Sapphire Daybreak',
    colors: {
      background: '#EFF6FF',
      text: '#0F172A',
      title: '#0F766E',
      highlight: '#2563EB',
      otherColors: ['#34D399', '#93C5FD']
    }
  },
  {
    name: 'Rose Quartz Evening',
    colors: {
      background: '#FFF7FB',
      text: '#4C1D3D',
      title: '#DB2777',
      highlight: '#F59EB2',
      otherColors: ['#E9D5FF', '#FDA4AF']
    }
  },
  {
    name: 'Amber Obsidian Autumn',
    colors: {
      background: '#FFFBEB',
      text: '#292524',
      title: '#B45309',
      highlight: '#F59E0B',
      otherColors: ['#D97706', '#57534E']
    }
  },
  {
    name: 'Sunset Topaz Skies',
    colors: {
      background: '#FFF7ED',
      text: '#1E293B',
      title: '#EA580C',
      highlight: '#F97316',
      otherColors: ['#38BDF8', '#FDBA74']
    }
  },
  {
    name: 'Rose Garnet Meadow',
    colors: {
      background: '#FDF2F8',
      text: '#3F3F46',
      title: '#BE185D',
      highlight: '#16A34A',
      otherColors: ['#FB7185', '#86EFAC']
    }
  },
  {
    name: 'Cherry Onyx Sundown',
    colors: {
      background: '#FAFAF9',
      text: '#0B0F1A',
      title: '#9F1239',
      highlight: '#E11D48',
      otherColors: ['#1F2937', '#FDB4BF']
    }
  },
  {
    name: 'Autumn Ruby Harmony',
    colors: {
      background: '#FFFBF0',
      text: '#3F2A1D',
      title: '#C2410C',
      highlight: '#DC2626',
      otherColors: ['#F59E0B', '#FED7AA']
    }
  },
  {
    name: 'Mermaid Garnet Symphony',
    colors: {
      background: '#ECFEFF',
      text: '#164E63',
      title: '#0E7490',
      highlight: '#BE123C',
      otherColors: ['#5EEAD4', '#FDA4AF']
    }
  },
  {
    name: 'Mulberry Topaz Harvest',
    colors: {
      background: '#FAF5FF',
      text: '#3B0764',
      title: '#A21CAF',
      highlight: '#F59E0B',
      otherColors: ['#D946EF', '#FDE68A']
    }
  },
  {
    name: 'Magma Obsidian Spectrum',
    colors: {
      background: '#FFF7ED',
      text: '#1C1917',
      title: '#C2410C',
      highlight: '#EF4444',
      otherColors: ['#0F172A', '#FDBA74']
    }
  },
  {
    name: 'Jeweled Autumn Shades',
    colors: {
      background: '#F8FAFC',
      text: '#3F3F46',
      title: '#B45309',
      highlight: '#0F766E',
      otherColors: ['#A855F7', '#F59E0B']
    }
  },
  {
    name: 'Sapphire Coral Breeze',
    colors: {
      background: '#F0F9FF',
      text: '#1E3A8A',
      title: '#2563EB',
      highlight: '#FB7185',
      otherColors: ['#22D3EE', '#FDA4AF']
    }
  },
  {
    name: 'Aqua Ruby Nightfall',
    colors: {
      background: '#ECFEFF',
      text: '#083344',
      title: '#0E7490',
      highlight: '#BE123C',
      otherColors: ['#22D3EE', '#F43F5E']
    }
  },
  {
    name: 'Ocean Ruby Radiance',
    colors: {
      background: '#EFF6FF',
      text: '#1E3A8A',
      title: '#1D4ED8',
      highlight: '#DC2626',
      otherColors: ['#38BDF8', '#FCA5A5']
    }
  },
  {
    name: 'Emerald Lapis Twilight',
    colors: {
      background: '#ECFDF5',
      text: '#064E3B',
      title: '#059669',
      highlight: '#1D4ED8',
      otherColors: ['#22C55E', '#93C5FD']
    }
  }
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
