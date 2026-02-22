import type { UILanguage } from '../types';
import settingsCatalog from '../config/settings-catalog.json';

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
type SettingsCatalog = {
  settings_version: string;
  palettes: Array<{ name: string; colors: ColorSet }>;
  styles: Array<{ name: string; promptHint: string }>;
  categories: Array<{ id: string; name: string; multi: boolean; options: string[] }>;
};

const settings = settingsCatalog as SettingsCatalog;

export const SETTINGS_VERSION = settings.settings_version;
export const SETTINGS_VERSIONS = {
  paletteLibrary: SETTINGS_VERSION,
  stylePresets: SETTINGS_VERSION,
  categoryTags: SETTINGS_VERSION
} as const;

export const DEFAULT_PALETTES: Palette[] = settings.palettes.map((item, index) => ({
  id: `palette-default-${index + 1}`,
  name: item.name,
  colors: {
    ...item.colors,
    otherColors: item.colors.otherColors ? [...item.colors.otherColors] : undefined
  },
  isCustom: false
}));

export const DEFAULT_STYLE_PRESETS: StylePreset[] = settings.styles.map((item, index) => ({
  id: `style-default-${index + 1}`,
  name: item.name,
  promptHint: item.promptHint,
  isCustom: false
}));

export const DEFAULT_CATEGORIES: CategoryTemplate[] = settings.categories.map((category) => ({
  ...category,
  options: [...category.options],
  isCustom: false
}));

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
