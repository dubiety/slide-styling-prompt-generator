import type { UILanguage } from '../types';

export type ColorSet = {
  background: string;
  text: string;
  title: string;
  highlight: string;
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
  { name: 'Indigo Sky', colors: { background: '#eef2ff', text: '#1e293b', title: '#3730a3', highlight: '#0ea5e9' } },
  { name: 'Fuchsia Pulse', colors: { background: '#fdf4ff', text: '#334155', title: '#c026d3', highlight: '#7c3aed' } },
  { name: 'Dusk Sapphire', colors: { background: '#eff6ff', text: '#1f2937', title: '#1d4ed8', highlight: '#a855f7' } },
  { name: 'Aurora Mist', colors: { background: '#f8fafc', text: '#334155', title: '#6366f1', highlight: '#d946ef' } },
  { name: 'Nebula Glow', colors: { background: '#eef2ff', text: '#0f172a', title: '#4338ca', highlight: '#f43f5e' } },
  { name: 'Sky Violet', colors: { background: '#f0f9ff', text: '#1e293b', title: '#6366f1', highlight: '#e879f9' } },
  { name: 'Plasma Arc', colors: { background: '#faf5ff', text: '#312e81', title: '#a21caf', highlight: '#06b6d4' } },
  { name: 'Night Iris', colors: { background: '#f8fafc', text: '#0f172a', title: '#4f46e5', highlight: '#ec4899' } },
  { name: 'Comet Trail', colors: { background: '#eff6ff', text: '#172554', title: '#2563eb', highlight: '#d946ef' } },
  { name: 'Lunar Haze', colors: { background: '#f5f3ff', text: '#334155', title: '#7c3aed', highlight: '#0284c7' } },
  { name: 'Electric Bloom', colors: { background: '#fff7ed', text: '#1f2937', title: '#4f46e5', highlight: '#d946ef' } },
  { name: 'Ocean Neon', colors: { background: '#ecfeff', text: '#0f172a', title: '#312e81', highlight: '#0ea5e9' } },
  { name: 'Prism Dust', colors: { background: '#faf5ff', text: '#334155', title: '#6366f1', highlight: '#f472b6' } },
  { name: 'Ink Spark', colors: { background: '#f8fafc', text: '#111827', title: '#1e1b4b', highlight: '#a855f7' } },
  { name: 'Royal Breeze', colors: { background: '#eef2ff', text: '#1e293b', title: '#4338ca', highlight: '#38bdf8' } },
  { name: 'Velvet Dawn', colors: { background: '#fdf2f8', text: '#334155', title: '#be185d', highlight: '#6366f1' } },
  { name: 'Crystal Byte', colors: { background: '#f0f9ff', text: '#1f2937', title: '#1d4ed8', highlight: '#c026d3' } },
  { name: 'Gradient Orbit', colors: { background: '#f5f3ff', text: '#1f2937', title: '#4f46e5', highlight: '#ec4899' } },
  { name: 'Midnight Air', colors: { background: '#e2e8f0', text: '#0f172a', title: '#1e3a8a', highlight: '#9333ea' } },
  { name: 'Aurora Core', colors: { background: '#ecfeff', text: '#1f2937', title: '#312e81', highlight: '#db2777' } }
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
    `Colors: background ${input.colors.background}, text ${input.colors.text}, title ${input.colors.title}, highlight ${input.colors.highlight}`,
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
