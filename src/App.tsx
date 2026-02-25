import { useEffect, useMemo, useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import type { TFunction } from 'i18next';
import {
  BookTemplate,
  Check,
  Circle,
  Copy,
  Download,
  Layers,
  Languages,
  Moon,
  Palette as PaletteIcon,
  Plus,
  RotateCcw,
  Sun,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { defaultLanguage, languageStorageKey, parseLanguage, supportedLanguages } from './localization/config';
import {
  buildPromptPreview,
  CUSTOMIZATION_STORAGE_KEY,
  DEFAULT_CATEGORIES,
  DEFAULT_PALETTES,
  DEFAULT_STYLE_PRESETS,
  isPromptPreviewCopy,
  makeId,
  SETTINGS_VERSION,
  type CategoryTemplate,
  type ColorSet,
  type Palette,
  type PersistedCustomization,
  type SelectionMap,
  type StylePreset
} from './lib/customization';

type ColorMode = 'light' | 'dark';
type TabKey = 'generator' | 'templates' | 'guide';

const colorModeStorageKey = 'ui-color-mode';
const recentColorsStorageKey = 'slide-style-prompt-recent-colors';
const recentColorsLimit = 12;
const systemSettingsStorageKey = 'slide-style-prompt-system-settings';
const customPalettesStorageKey = 'slide-style-prompt-custom-palettes';
const customStylesStorageKey = 'slide-style-prompt-custom-styles';
const customCategoriesStorageKey = 'slide-style-prompt-custom-categories';
const customStateStorageKey = 'slide-style-prompt-custom-state';

type LoadedCustomizationState = {
  palettes: Palette[];
  styles: StylePreset[];
  categories: CategoryTemplate[];
  selectedPaletteId: string;
  selectedStyleId: string;
  colors: ColorSet;
  selections: SelectionMap;
};

type PersistedSystemSettings = {
  version: 1;
  settingsVersion: string;
  palettes: Palette[];
  styles: StylePreset[];
  categories: CategoryTemplate[];
};

type PersistedCustomState = {
  version: 1;
  selectedPaletteId: string;
  selectedStyleId: string;
  colors: ColorSet;
  selections: SelectionMap;
};

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(withHash)) return null;
  if (withHash.length === 4) {
    const expanded = withHash
      .slice(1)
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }
  return withHash.toUpperCase();
}

function loadRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(recentColorsStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .map((value) => (typeof value === 'string' ? normalizeHexColor(value) : null))
      .filter((value): value is string => value !== null);
    return normalized.filter((value, index) => normalized.indexOf(value) === index).slice(0, recentColorsLimit);
  } catch {
    return [];
  }
}

function cloneCategories(categories: CategoryTemplate[]): CategoryTemplate[] {
  return categories.map((category) => ({ ...category, options: [...category.options] }));
}

function sanitizeSelections(selections: SelectionMap, categories: CategoryTemplate[]): SelectionMap {
  return categories.reduce<SelectionMap>((acc, category) => {
    const raw = selections[category.id] ?? [];
    const valid = raw.filter((option) => category.options.includes(option));
    acc[category.id] = category.multi ? valid : valid.slice(0, 1);
    return acc;
  }, {});
}

function isColorSet(value: unknown): value is ColorSet {
  if (!value || typeof value !== 'object') return false;
  const typed = value as Record<string, unknown>;
  return (
    typeof typed.background === 'string' &&
    typeof typed.text === 'string' &&
    typeof typed.title === 'string' &&
    typeof typed.highlight === 'string' &&
    (!('otherColors' in typed) ||
      (Array.isArray(typed.otherColors) && typed.otherColors.every((color) => typeof color === 'string')))
  );
}

function cloneColorSet(value: ColorSet): ColorSet {
  return {
    ...value,
    otherColors: value.otherColors ? [...value.otherColors] : undefined
  };
}

function isCustomPalette(value: unknown): value is Palette {
  if (!value || typeof value !== 'object') return false;
  const typed = value as Record<string, unknown>;
  return (
    typeof typed.id === 'string' &&
    typeof typed.name === 'string' &&
    typed.isCustom === true &&
    isColorSet(typed.colors)
  );
}

function isCustomStylePreset(value: unknown): value is StylePreset {
  if (!value || typeof value !== 'object') return false;
  const typed = value as Record<string, unknown>;
  return (
    typeof typed.id === 'string' &&
    typeof typed.name === 'string' &&
    typeof typed.promptHint === 'string' &&
    typed.isCustom === true
  );
}

function isCustomCategoryTemplate(value: unknown): value is CategoryTemplate {
  if (!value || typeof value !== 'object') return false;
  const typed = value as Record<string, unknown>;
  return (
    typeof typed.id === 'string' &&
    typeof typed.name === 'string' &&
    typeof typed.multi === 'boolean' &&
    Array.isArray(typed.options) &&
    typed.options.every((option) => typeof option === 'string') &&
    typed.isCustom === true
  );
}

function loadCustomPalettes(): Palette[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(customPalettesStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Palette => isCustomPalette(item))
      .map((item) => ({
        ...item,
        colors: cloneColorSet(item.colors)
      }));
  } catch {
    return [];
  }
}

function loadCustomStyles(): StylePreset[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(customStylesStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StylePreset => isCustomStylePreset(item));
  } catch {
    return [];
  }
}

function loadCustomCategories(): CategoryTemplate[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(customCategoriesStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CategoryTemplate => isCustomCategoryTemplate(item))
      .map((item) => ({
        ...item,
        options: [...item.options]
      }));
  } catch {
    return [];
  }
}

function loadCustomState(): PersistedCustomState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(customStateStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const typed = parsed as Record<string, unknown>;
    if (typed.version !== 1) return null;
    if (typeof typed.selectedPaletteId !== 'string' || typeof typed.selectedStyleId !== 'string') return null;
    if (!isColorSet(typed.colors)) return null;
    if (!typed.selections || typeof typed.selections !== 'object') return null;
    const selections = typed.selections as Record<string, unknown>;
    const normalizedSelections = Object.entries(selections).reduce<SelectionMap>((acc, [key, value]) => {
      if (!Array.isArray(value)) return acc;
      acc[key] = value.filter((option): option is string => typeof option === 'string');
      return acc;
    }, {});
    return {
      version: 1,
      selectedPaletteId: typed.selectedPaletteId,
      selectedStyleId: typed.selectedStyleId,
      colors: cloneColorSet(typed.colors),
      selections: normalizedSelections
    };
  } catch {
    return null;
  }
}

function ensureSystemSettingsSnapshot() {
  if (typeof window === 'undefined') return;
  const latestSettings: PersistedSystemSettings = {
    version: 1,
    settingsVersion: SETTINGS_VERSION,
    palettes: DEFAULT_PALETTES.map((palette) => ({ ...palette, colors: cloneColorSet(palette.colors) })),
    styles: DEFAULT_STYLE_PRESETS.map((style) => ({ ...style })),
    categories: cloneCategories(DEFAULT_CATEGORIES)
  };
  const raw = window.localStorage.getItem(systemSettingsStorageKey);
  if (!raw) {
    window.localStorage.setItem(systemSettingsStorageKey, JSON.stringify(latestSettings));
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSystemSettings> | null;
    if (!parsed || parsed.version !== 1 || parsed.settingsVersion !== SETTINGS_VERSION) {
      window.localStorage.setItem(systemSettingsStorageKey, JSON.stringify(latestSettings));
    }
  } catch {
    window.localStorage.setItem(systemSettingsStorageKey, JSON.stringify(latestSettings));
  }
}

function migrateLegacyCustomization() {
  if (typeof window === 'undefined') return;
  const hasCustomKeys =
    window.localStorage.getItem(customPalettesStorageKey) !== null ||
    window.localStorage.getItem(customStylesStorageKey) !== null ||
    window.localStorage.getItem(customCategoriesStorageKey) !== null ||
    window.localStorage.getItem(customStateStorageKey) !== null;
  if (hasCustomKeys) return;

  const raw = window.localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as PersistedCustomization | null;
    if (!parsed || parsed.version !== 1) return;

    const legacyCustomPalettes = Array.isArray(parsed.customPalettes)
      ? parsed.customPalettes.filter((item) => isCustomPalette(item)).map((item) => ({
          ...item,
          colors: cloneColorSet(item.colors)
        }))
      : [];
    const legacyCustomStyles = Array.isArray(parsed.customStyles)
      ? parsed.customStyles.filter((item) => isCustomStylePreset(item))
      : [];
    const legacyCustomCategories = Array.isArray(parsed.categories)
      ? parsed.categories
          .filter((item) => isCustomCategoryTemplate(item))
          .map((item) => ({ ...item, options: [...item.options] }))
      : [];
    const legacyState: PersistedCustomState = {
      version: 1,
      selectedPaletteId: parsed.selectedPaletteId,
      selectedStyleId: parsed.selectedStyleId,
      colors: isColorSet(parsed.colors) ? cloneColorSet(parsed.colors) : cloneColorSet(DEFAULT_PALETTES[0].colors),
      selections:
        parsed.selections && typeof parsed.selections === 'object'
          ? Object.entries(parsed.selections).reduce<SelectionMap>((acc, [key, value]) => {
              if (!Array.isArray(value)) return acc;
              acc[key] = value.filter((option): option is string => typeof option === 'string');
              return acc;
            }, {})
          : {}
    };

    window.localStorage.setItem(customPalettesStorageKey, JSON.stringify(legacyCustomPalettes));
    window.localStorage.setItem(customStylesStorageKey, JSON.stringify(legacyCustomStyles));
    window.localStorage.setItem(customCategoriesStorageKey, JSON.stringify(legacyCustomCategories));
    window.localStorage.setItem(customStateStorageKey, JSON.stringify(legacyState));
  } catch {
    return;
  }
}

function loadCustomizationState(): LoadedCustomizationState {
  const defaultCategories = cloneCategories(DEFAULT_CATEGORIES);
  const baseState: LoadedCustomizationState = {
    palettes: [...DEFAULT_PALETTES],
    styles: [...DEFAULT_STYLE_PRESETS],
    categories: defaultCategories,
    selectedPaletteId: DEFAULT_PALETTES[0].id,
    selectedStyleId: DEFAULT_STYLE_PRESETS[0].id,
    colors: { ...DEFAULT_PALETTES[0].colors },
    selections: sanitizeSelections({}, defaultCategories)
  };

  if (typeof window === 'undefined') return baseState;
  ensureSystemSettingsSnapshot();
  migrateLegacyCustomization();

  const customPalettes = loadCustomPalettes();
  const customStyles = loadCustomStyles();
  const customCategories = loadCustomCategories();
  const customState = loadCustomState();

  const palettes = [
    ...DEFAULT_PALETTES,
    ...customPalettes.filter((item) => !DEFAULT_PALETTES.some((defaultItem) => defaultItem.id === item.id))
  ];
  const styles = [
    ...DEFAULT_STYLE_PRESETS,
    ...customStyles.filter((item) => !DEFAULT_STYLE_PRESETS.some((defaultItem) => defaultItem.id === item.id))
  ];
  const categories = [
    ...defaultCategories,
    ...customCategories.filter((item) => !defaultCategories.some((defaultItem) => defaultItem.id === item.id))
  ];

  const selectedPaletteId = customState && palettes.some((item) => item.id === customState.selectedPaletteId)
    ? customState.selectedPaletteId
    : palettes[0].id;
  const selectedStyleId = customState && styles.some((item) => item.id === customState.selectedStyleId)
    ? customState.selectedStyleId
    : styles[0].id;
  const selectedPalette = palettes.find((item) => item.id === selectedPaletteId) ?? palettes[0];
  const colors = customState ? cloneColorSet(customState.colors) : cloneColorSet(selectedPalette.colors);
  const selections = sanitizeSelections(customState?.selections ?? {}, categories);

  return { palettes, styles, categories, selectedPaletteId, selectedStyleId, colors, selections };
}

function getInitialColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'light';
  const storedValue = window.localStorage.getItem(colorModeStorageKey);
  if (storedValue === 'light' || storedValue === 'dark') return storedValue;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getLocalizedStyle(style: StylePreset, t: TFunction): Pick<StylePreset, 'name' | 'promptHint'> {
  if (style.isCustom) return { name: style.name, promptHint: style.promptHint };
  return {
    name: t(`stylePresets.${style.id}.name`, { defaultValue: style.name }),
    promptHint: t(`stylePresets.${style.id}.promptHint`, { defaultValue: style.promptHint })
  };
}

function getLocalizedPaletteName(palette: Palette, t: TFunction): string {
  if (palette.isCustom) return palette.name;
  return t(`paletteNames.${palette.id}`, { defaultValue: palette.name });
}

function getDefaultCategoryById(categoryId: string): CategoryTemplate | undefined {
  return DEFAULT_CATEGORIES.find((item) => item.id === categoryId && !item.isCustom);
}

function getLocalizedCategoryName(category: CategoryTemplate, t: TFunction): string {
  if (category.isCustom) return category.name;
  const defaultCategory = getDefaultCategoryById(category.id);
  if (!defaultCategory) return category.name;
  if (category.name !== defaultCategory.name) return category.name;
  return t(`categoryTemplates.${category.id}.name`, { defaultValue: defaultCategory.name });
}

function getLocalizedOptionLabel(
  category: CategoryTemplate,
  option: string,
  optionIndex: number,
  t: TFunction
): string {
  if (category.isCustom) return option;
  const defaultCategory = getDefaultCategoryById(category.id);
  if (!defaultCategory) return option;
  const defaultOption = defaultCategory.options[optionIndex];
  if (!defaultOption || option !== defaultOption) return option;
  return t(`categoryTemplates.${category.id}.options.${optionIndex}`, { defaultValue: option });
}

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const routeLanguage = parseLanguage(lang);
  const loadedState = useMemo(loadCustomizationState, []);

  useEffect(() => {
    if (!routeLanguage) {
      navigate(`/${defaultLanguage}`, { replace: true });
      return;
    }
    if (i18n.language !== routeLanguage) {
      void i18n.changeLanguage(routeLanguage);
    }
  }, [i18n, navigate, routeLanguage]);

  useEffect(() => {
    if (!routeLanguage || typeof window === 'undefined') return;
    window.localStorage.setItem(languageStorageKey, routeLanguage);
  }, [routeLanguage]);

  const [activeTab, setActiveTab] = useState<TabKey>('generator');
  const [copied, setCopied] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);
  const [palettes, setPalettes] = useState<Palette[]>(loadedState.palettes);
  const [styles, setStyles] = useState<StylePreset[]>(loadedState.styles);
  const [categories, setCategories] = useState<CategoryTemplate[]>(loadedState.categories);
  const [selectedPaletteId, setSelectedPaletteId] = useState(loadedState.selectedPaletteId);
  const [selectedStyleId, setSelectedStyleId] = useState(loadedState.selectedStyleId);
  const [colors, setColors] = useState<ColorSet>(loadedState.colors);
  const [selections, setSelections] = useState<SelectionMap>(loadedState.selections);
  const [paletteNameInput, setPaletteNameInput] = useState('');
  const [styleNameInput, setStyleNameInput] = useState('');
  const [styleHintInput, setStyleHintInput] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryMulti, setNewCategoryMulti] = useState(true);
  const [newOptionDrafts, setNewOptionDrafts] = useState<Record<string, string>>({});
  const [otherColorInput, setOtherColorInput] = useState('');
  const [recentColors, setRecentColors] = useState<string[]>(loadRecentColors);
  const [draggingOtherColor, setDraggingOtherColor] = useState<string | null>(null);

  const activeLanguage = routeLanguage ?? defaultLanguage;
  const selectedStyle = styles.find((item) => item.id === selectedStyleId) ?? styles[0];
  const selectedPalette = palettes.find((item) => item.id === selectedPaletteId) ?? palettes[0];
  const normalizedOtherColorInput = normalizeHexColor(otherColorInput);
  const hasOtherColorInput = otherColorInput.trim().length > 0;
  const canAddOtherColor = normalizedOtherColorInput !== null;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorMode === 'dark');
    window.localStorage.setItem(colorModeStorageKey, colorMode);
  }, [colorMode]);

  useEffect(() => {
    window.localStorage.setItem(recentColorsStorageKey, JSON.stringify(recentColors));
  }, [recentColors]);

  useEffect(() => {
    setSelections((prev) => sanitizeSelections(prev, categories));
  }, [categories]);

  useEffect(() => {
    const customPalettes = palettes
      .filter((item) => item.isCustom)
      .map((item) => ({ ...item, colors: cloneColorSet(item.colors) }));
    const customStyles = styles.filter((item) => item.isCustom).map((item) => ({ ...item }));
    const customCategories = categories
      .filter((item) => item.isCustom)
      .map((item) => ({ ...item, options: [...item.options] }));
    const selectionSnapshot = Object.entries(selections).reduce<SelectionMap>((acc, [key, value]) => {
      acc[key] = [...value];
      return acc;
    }, {});

    const statePayload: PersistedCustomState = {
      version: 1,
      selectedPaletteId,
      selectedStyleId,
      colors: cloneColorSet(colors),
      selections: selectionSnapshot
    };
    window.localStorage.setItem(customPalettesStorageKey, JSON.stringify(customPalettes));
    window.localStorage.setItem(customStylesStorageKey, JSON.stringify(customStyles));
    window.localStorage.setItem(customCategoriesStorageKey, JSON.stringify(customCategories));
    window.localStorage.setItem(customStateStorageKey, JSON.stringify(statePayload));

    const systemPayload: PersistedSystemSettings = {
      version: 1,
      settingsVersion: SETTINGS_VERSION,
      palettes: DEFAULT_PALETTES.map((item) => ({ ...item, colors: cloneColorSet(item.colors) })),
      styles: DEFAULT_STYLE_PRESETS.map((item) => ({ ...item })),
      categories: cloneCategories(DEFAULT_CATEGORIES)
    };
    window.localStorage.setItem(systemSettingsStorageKey, JSON.stringify(systemPayload));

    const legacyPayload: PersistedCustomization = {
      version: 1,
      settingVersions: {
        paletteLibrary: SETTINGS_VERSION,
        stylePresets: SETTINGS_VERSION,
        categoryTags: SETTINGS_VERSION
      },
      customPalettes,
      customStyles,
      categories: cloneCategories(categories),
      selectedPaletteId,
      selectedStyleId,
      colors: cloneColorSet(colors),
      selections: selectionSnapshot
    };
    window.localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(legacyPayload));
  }, [palettes, styles, categories, selectedPaletteId, selectedStyleId, colors, selections]);

  const generatedPrompt = useMemo(
    () => {
      const localizedStyle = getLocalizedStyle(selectedStyle, t);
      const promptPreviewRaw = t('promptPreview', { returnObjects: true });
      const promptPreviewCopy = isPromptPreviewCopy(promptPreviewRaw)
        ? promptPreviewRaw
        : {
            outputLanguage: t('promptPreview.outputLanguage'),
            palette: t('promptPreview.palette'),
            stylePreset: t('promptPreview.stylePreset'),
            styleDirection: t('promptPreview.styleDirection'),
            colors: t('promptPreview.colors'),
            colorKeys: {
              background: t('promptPreview.colorKeys.background'),
              text: t('promptPreview.colorKeys.text'),
              title: t('promptPreview.colorKeys.title'),
              highlight: t('promptPreview.colorKeys.highlight'),
              otherColors: t('promptPreview.colorKeys.otherColors')
            },
            none: t('promptPreview.none')
          };
      const localizedCategories = categories.map((category) => ({
        ...category,
        name: getLocalizedCategoryName(category, t),
        options: category.options.map((option, optionIndex) => getLocalizedOptionLabel(category, option, optionIndex, t))
      }));
      const localizedSelections = categories.reduce<SelectionMap>((accumulator, category) => {
        const picked = selections[category.id] ?? [];
        if (picked.length === 0) return accumulator;
        accumulator[category.id] = picked.map((option) => {
          const optionIndex = category.options.indexOf(option);
          return optionIndex >= 0 ? getLocalizedOptionLabel(category, option, optionIndex, t) : option;
        });
        return accumulator;
      }, {});

      return buildPromptPreview({
        language: activeLanguage,
        colors,
        paletteName: getLocalizedPaletteName(selectedPalette, t),
        styleName: localizedStyle.name,
        styleHint: localizedStyle.promptHint,
        selections: localizedSelections,
        categories: localizedCategories
      }, promptPreviewCopy);
    },
    [activeLanguage, colors, selectedPalette, selectedStyle, selections, categories, t]
  );

  const onCopy = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const onExport = () => {
    if (!generatedPrompt) return;
    const blob = new Blob([generatedPrompt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `slide-prompt-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const resetAllCustomizations = () => {
    setPalettes([...DEFAULT_PALETTES]);
    setStyles([...DEFAULT_STYLE_PRESETS]);
    const resetCategories = cloneCategories(DEFAULT_CATEGORIES);
    setCategories(resetCategories);
    setSelections(sanitizeSelections({}, resetCategories));
    setSelectedPaletteId(DEFAULT_PALETTES[0].id);
    setSelectedStyleId(DEFAULT_STYLE_PRESETS[0].id);
    setColors({ ...DEFAULT_PALETTES[0].colors });
    setPaletteNameInput('');
    setStyleNameInput('');
    setStyleHintInput('');
    setNewCategoryName('');
    setNewOptionDrafts({});
    setOtherColorInput('');
    window.localStorage.removeItem(customPalettesStorageKey);
    window.localStorage.removeItem(customStylesStorageKey);
    window.localStorage.removeItem(customCategoriesStorageKey);
    window.localStorage.removeItem(customStateStorageKey);
    window.localStorage.removeItem(CUSTOMIZATION_STORAGE_KEY);
  };

  const applyPalette = (palette: Palette) => {
    setSelectedPaletteId(palette.id);
    setColors({ ...palette.colors });
    setOtherColorInput('');
  };

  const addCustomPalette = () => {
    const name = paletteNameInput.trim();
    if (!name) return;
    const customPalette: Palette = {
      id: makeId('palette-custom'),
      name,
      colors: { ...colors },
      isCustom: true
    };
    setPalettes((prev) => [...prev, customPalette]);
    setSelectedPaletteId(customPalette.id);
    setPaletteNameInput('');
  };

  const onPaletteNameInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.key !== 'Enter') return;
    event.preventDefault();
    addCustomPalette();
  };

  const addOtherColor = () => {
    if (!normalizedOtherColorInput) return;
    setColors((prev) => {
      const current = prev.otherColors ?? [];
      if (current.includes(normalizedOtherColorInput)) return prev;
      return { ...prev, otherColors: [...current, normalizedOtherColorInput] };
    });
    setRecentColors((prev) =>
      [normalizedOtherColorInput, ...prev.filter((color) => color !== normalizedOtherColorInput)].slice(0, recentColorsLimit)
    );
    setOtherColorInput('');
  };

  const removeOtherColor = (color: string) => {
    setColors((prev) => {
      const next = (prev.otherColors ?? []).filter((item) => item !== color);
      return next.length > 0 ? { ...prev, otherColors: next } : { ...prev, otherColors: [] };
    });
  };

  const onOtherColorInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.key !== 'Enter') return;
    event.preventDefault();
    addOtherColor();
  };

  const addRecentColorToPalette = (color: string) => {
    const normalized = normalizeHexColor(color);
    if (!normalized) return;
    setColors((prev) => {
      const current = prev.otherColors ?? [];
      if (current.includes(normalized)) return prev;
      return { ...prev, otherColors: [...current, normalized] };
    });
    setRecentColors((prev) => [normalized, ...prev.filter((item) => item !== normalized)].slice(0, recentColorsLimit));
  };

  const onOtherColorDragStart = (event: DragEvent<HTMLSpanElement>, color: string) => {
    setDraggingOtherColor(color);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onOtherColorDrop = (targetColor: string) => {
    if (!draggingOtherColor || draggingOtherColor === targetColor) {
      setDraggingOtherColor(null);
      return;
    }
    setColors((prev) => {
      const list = prev.otherColors ?? [];
      const from = list.indexOf(draggingOtherColor);
      const to = list.indexOf(targetColor);
      if (from < 0 || to < 0) return prev;
      const next = [...list];
      next.splice(from, 1);
      next.splice(to, 0, draggingOtherColor);
      return { ...prev, otherColors: next };
    });
    setDraggingOtherColor(null);
  };

  const deletePalette = (paletteId: string) => {
    setPalettes((prev) => prev.filter((item) => item.id !== paletteId));
    if (selectedPaletteId === paletteId) {
      setSelectedPaletteId(DEFAULT_PALETTES[0].id);
      setColors({ ...DEFAULT_PALETTES[0].colors });
    }
  };

  const addCustomStyle = () => {
    const name = styleNameInput.trim();
    const hint = styleHintInput.trim();
    if (!name || !hint) return;
    const customStyle: StylePreset = {
      id: makeId('style-custom'),
      name,
      promptHint: hint,
      isCustom: true
    };
    setStyles((prev) => [...prev, customStyle]);
    setSelectedStyleId(customStyle.id);
    setStyleNameInput('');
    setStyleHintInput('');
  };

  const deleteStyle = (styleId: string) => {
    setStyles((prev) => prev.filter((item) => item.id !== styleId));
    if (selectedStyleId === styleId) {
      setSelectedStyleId(DEFAULT_STYLE_PRESETS[0].id);
    }
  };

  const toggleCategoryOption = (category: CategoryTemplate, option: string) => {
    setSelections((prev) => {
      const current = prev[category.id] ?? [];
      if (category.multi) {
        const next = current.includes(option)
          ? current.filter((item) => item !== option)
          : [...current, option];
        return { ...prev, [category.id]: next };
      }
      const next = current.includes(option) ? [] : [option];
      return { ...prev, [category.id]: next };
    });
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const newCategory: CategoryTemplate = {
      id: makeId('category'),
      name,
      multi: newCategoryMulti,
      options: [],
      isCustom: true
    };
    setCategories((prev) => [...prev, newCategory]);
    setNewCategoryName('');
    setNewCategoryMulti(true);
  };

  const updateCategory = (categoryId: string, updater: (category: CategoryTemplate) => CategoryTemplate) => {
    setCategories((prev) => prev.map((category) => (category.id === categoryId ? updater(category) : category)));
  };

  const removeCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== categoryId));
    setSelections((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const addOptionToCategory = (categoryId: string) => {
    const draft = (newOptionDrafts[categoryId] ?? '').trim();
    if (!draft) return;
    updateCategory(categoryId, (category) => {
      if (category.options.includes(draft)) return category;
      return { ...category, options: [...category.options, draft] };
    });
    setNewOptionDrafts((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const onAddOptionInputKeyDown = (event: KeyboardEvent<HTMLInputElement>, categoryId: string) => {
    if (event.nativeEvent.isComposing || event.key !== 'Enter') return;
    event.preventDefault();
    addOptionToCategory(categoryId);
  };

  const onAddCategoryInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.key !== 'Enter') return;
    event.preventDefault();
    addCategory();
  };

  const removeOptionFromCategory = (categoryId: string, optionLabel: string) => {
    updateCategory(categoryId, (category) => ({
      ...category,
      options: category.options.filter((option) => option !== optionLabel)
    }));
    setSelections((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] ?? []).filter((option) => option !== optionLabel)
    }));
  };

  const updateOptionLabel = (categoryId: string, index: number, value: string) => {
    updateCategory(categoryId, (category) => {
      const nextOptions = [...category.options];
      nextOptions[index] = value;
      return { ...category, options: nextOptions };
    });
  };

  const pillBase =
    'rounded-full border px-3 py-1.5 text-xs font-medium transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02]';
  const iconButtonBase = 'inline-flex h-8 w-8 items-center justify-center rounded-full';
  const tabButtonBase =
    'inline-flex h-8 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.25),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.2),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.18),transparent_32%)] bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-7 md:py-10">
        <header className="rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_18px_50px_rgba(30,41,59,0.12)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55 dark:shadow-[0_22px_56px_rgba(2,6,23,0.48)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-fuchsia-500 via-sky-500 to-indigo-500 bg-clip-text font-['Space_Grotesk',_'Noto_Sans_TC',sans-serif] text-2xl font-semibold tracking-tight text-transparent md:text-3xl">
                {t('appTitle')}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('appSubtitle')}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex w-full flex-wrap justify-end gap-2">
                <label className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                  <Languages className="h-3.5 w-3.5" />
                  <span>{t('interfaceLanguage')}</span>
                  <select
                    name="language"
                    value={activeLanguage}
                    onChange={(event) => navigate(`/${event.target.value}`)}
                    className="rounded-full bg-transparent text-xs font-medium outline-none"
                  >
                    {supportedLanguages.map((language) => (
                      <option key={language} value={language}>
                        {t(`languages.${language}`)}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => setColorMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
                  aria-label={colorMode === 'light' ? t('darkMode') : t('lightMode')}
                  title={colorMode === 'light' ? t('darkMode') : t('lightMode')}
                  className={`${iconButtonBase} border border-white/70 bg-white/70 text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.05] dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100`}
                >
                  {colorMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={resetAllCustomizations}
                  aria-label={t('resetButton')}
                  title={t('resetButton')}
                  className={`${pillBase} inline-flex items-center gap-1.5 border-fuchsia-300/80 bg-fuchsia-100/75 text-fuchsia-700 dark:border-fuchsia-600/70 dark:bg-fuchsia-900/30 dark:text-fuchsia-200`}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{t('resetButton')}</span>
                </button>
              </div>

              <div className="inline-flex w-fit rounded-full border border-white/70 bg-white/70 p-1 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/70">
                <button
                  type="button"
                  onClick={() => setActiveTab('generator')}
                  aria-label={t('tabGenerator')}
                  title={t('tabGenerator')}
                  className={`${tabButtonBase} ${
                    activeTab === 'generator'
                      ? 'border-transparent bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500 text-white shadow-md'
                      : 'border-white/70 bg-white/70 text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <PaletteIcon className="h-4 w-4" />
                    <span>{t('tabGenerator')}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  aria-label={t('tabTemplates')}
                  title={t('tabTemplates')}
                  className={`${tabButtonBase} ${
                    activeTab === 'templates'
                      ? 'border-transparent bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500 text-white shadow-md'
                      : 'border-white/70 bg-white/70 text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <BookTemplate className="h-4 w-4" />
                    <span>{t('tabTemplates')}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  aria-label={t('usageGuideButton')}
                  title={t('usageGuideButton')}
                  className={`${tabButtonBase} ${
                    activeTab === 'guide'
                      ? 'border-transparent bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500 text-white shadow-md'
                      : 'border-white/70 bg-white/70 text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <span>{t('usageGuideButton')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'generator' ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <article className="rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('colorPickersTitle')}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(['background', 'text', 'title', 'highlight'] as const).map((key) => (
                    <div key={key} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
                      <input
                        type="color"
                        aria-label={t(`colorKeys.${key}`)}
                        value={colors[key]}
                        onChange={(event) => {
                          const nextColor = event.target.value.toUpperCase();
                          setColors((prev) => ({
                            ...prev,
                            [key]: nextColor
                          }));
                          setRecentColors((prev) =>
                            [nextColor, ...prev.filter((color) => color !== nextColor)].slice(0, recentColorsLimit)
                          );
                        }}
                        className="h-8 w-8 border-0 bg-transparent p-0"
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {`${t(`colorKeys.${key}`)} ${colors[key].toUpperCase()}`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('otherColorsLabel')}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('dragReorderHint')}</p>
                  {(colors.otherColors ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(colors.otherColors ?? []).map((color) => (
                        <span
                          key={`other-color-${color}`}
                          draggable
                          onDragStart={(event) => onOtherColorDragStart(event, color)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => onOtherColorDrop(color)}
                          onDragEnd={() => setDraggingOtherColor(null)}
                          className={`inline-flex cursor-grab items-center gap-2 rounded-full border bg-white/80 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 ${
                            draggingOtherColor === color
                              ? 'border-indigo-400 dark:border-indigo-500'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="h-3 w-3 rounded-full border border-white/60" style={{ backgroundColor: color }} />
                          <span>{color}</span>
                          <button
                            type="button"
                            onClick={() => removeOtherColor(color)}
                            aria-label={t('delete')}
                            title={t('delete')}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-rose-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('recentColorsLabel')}</p>
                    {recentColors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {recentColors.map((color) => (
                          <button
                            key={`recent-color-${color}`}
                            type="button"
                            onClick={() => addRecentColorToPalette(color)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                          >
                            <span className="h-3 w-3 rounded-full border border-white/60" style={{ backgroundColor: color }} />
                            <span>{color}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('recentColorsEmpty')}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={otherColorInput}
                      onChange={(event) => setOtherColorInput(event.target.value)}
                      onKeyDown={onOtherColorInputKeyDown}
                      placeholder={t('otherColorHexPlaceholder')}
                      className="min-w-[12rem] flex-1 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80"
                    />
                    <button
                      type="button"
                      onClick={addOtherColor}
                      disabled={!canAddOtherColor}
                      aria-label={t('addOtherColorButton')}
                      title={t('addOtherColorButton')}
                      className={`${iconButtonBase} border border-indigo-300 bg-indigo-100/80 text-indigo-700 disabled:opacity-50 dark:border-indigo-500/60 dark:bg-indigo-900/30 dark:text-indigo-200`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {hasOtherColorInput && !canAddOtherColor ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">{t('invalidHexHint')}</p>
                  ) : null}
                </div>
              </article>

              <article className="rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('paletteLibraryTitle')}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {palettes.map((palette) => (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => applyPalette(palette)}
                      className={`rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:scale-[1.01] ${
                        selectedPaletteId === palette.id
                          ? 'border-indigo-400 bg-indigo-100/70 dark:border-indigo-500/70 dark:bg-indigo-900/30'
                          : 'border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-100">
                          {getLocalizedPaletteName(palette, t)}
                        </span>
                        {palette.isCustom ? (
                          <span
                            onClick={(event) => {
                              event.stopPropagation();
                              deletePalette(palette.id);
                            }}
                            className="inline-flex h-4 w-4 cursor-pointer items-center justify-center text-rose-500"
                            role="button"
                            aria-label={t('delete')}
                            title={t('delete')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </span>
                        ) : null}
                      </div>
                      <div className="flex gap-1">
                        {[
                          palette.colors.background,
                          palette.colors.text,
                          palette.colors.title,
                          palette.colors.highlight,
                          ...(palette.colors.otherColors ?? [])
                        ].map((color) => (
                          <span
                            key={`${palette.id}-${color}`}
                            className="h-6 min-w-0 flex-1 rounded-md border border-white/60 shadow-sm"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={paletteNameInput}
                    onChange={(event) => setPaletteNameInput(event.target.value)}
                    onKeyDown={onPaletteNameInputKeyDown}
                    placeholder={t('addPalettePlaceholder')}
                    className="min-w-[11rem] flex-1 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80"
                  />
                  <button
                    type="button"
                    onClick={addCustomPalette}
                    aria-label={t('addPaletteButton')}
                    title={t('addPaletteButton')}
                    className={`${iconButtonBase} border border-indigo-300 bg-indigo-100/80 text-indigo-700 dark:border-indigo-500/60 dark:bg-indigo-900/40 dark:text-indigo-200`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </article>

              <article className="rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('slideStyleTitle')}
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {styles.map((styleItem) => (
                    <button
                      key={styleItem.id}
                      type="button"
                      onClick={() => setSelectedStyleId(styleItem.id)}
                      className={`rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:scale-[1.01] ${
                        selectedStyleId === styleItem.id
                          ? 'border-indigo-400 bg-indigo-100/70 dark:border-indigo-500/70 dark:bg-indigo-900/30'
                          : 'border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-100">
                          {getLocalizedStyle(styleItem, t).name}
                        </span>
                        {styleItem.isCustom ? (
                          <span
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteStyle(styleItem.id);
                            }}
                            className="inline-flex h-4 w-4 cursor-pointer items-center justify-center text-rose-500"
                            role="button"
                            aria-label={t('delete')}
                            title={t('delete')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getLocalizedStyle(styleItem, t).promptHint}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={styleNameInput}
                    onChange={(event) => setStyleNameInput(event.target.value)}
                    placeholder={t('addStyleNamePlaceholder')}
                    className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80"
                  />
                  <input
                    value={styleHintInput}
                    onChange={(event) => setStyleHintInput(event.target.value)}
                    placeholder={t('addStyleHintPlaceholder')}
                    className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80"
                  />
                  <button
                    type="button"
                    onClick={addCustomStyle}
                    aria-label={t('addStyleButton')}
                    title={t('addStyleButton')}
                    className={`${iconButtonBase} border border-sky-300 bg-sky-100/80 text-sky-700 dark:border-sky-500/60 dark:bg-sky-900/30 dark:text-sky-200`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </article>

              <article className="rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('categoriesTitle')}
                </h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.id}>
                      <p className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {getLocalizedCategoryName(category, t)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {category.options.map((option, optionIndex) => {
                          const selected = (selections[category.id] ?? []).includes(option);
                          return (
                            <button
                              key={`${category.id}-${option}`}
                              type="button"
                              onClick={() => toggleCategoryOption(category, option)}
                              className={`${pillBase} ${
                                selected
                                  ? 'border-indigo-400 bg-indigo-100 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-200'
                                  : 'border-slate-200 bg-white/80 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300'
                              }`}
                            >
                              {getLocalizedOptionLabel(category, option, optionIndex, t)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <article className="rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('previewExportTitle')}
                </h3>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onCopy}
                    disabled={!generatedPrompt}
                    aria-label={copied ? t('copiedButton') : t('copyButton')}
                    title={copied ? t('copiedButton') : t('copyButton')}
                    className={`${pillBase} inline-flex items-center gap-1.5 border-indigo-400 bg-indigo-500 text-white disabled:opacity-50`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? t('copiedButton') : t('copyButton')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExport}
                    disabled={!generatedPrompt}
                    aria-label={t('exportButton')}
                    title={t('exportButton')}
                    className={`${pillBase} inline-flex items-center gap-1.5 border-fuchsia-400 bg-fuchsia-500 text-white disabled:opacity-50`}
                  >
                    <Download className="h-4 w-4" />
                    <span>{t('exportButton')}</span>
                  </button>
                </div>
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                  {generatedPrompt ? t('resultReadyHint') : t('resultEmptyHint')}
                </p>
                <pre className="min-h-[18rem] whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
                  {generatedPrompt || t('emptyPrompt')}
                </pre>
              </article>
            </aside>
          </section>
        ) : activeTab === 'templates' ? (
          <section className="space-y-4 rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55">
            <p className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200">
              {t('customOptionTranslationHint')}
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={getLocalizedCategoryName(category, t)}
                      onChange={(event) =>
                        updateCategory(category.id, (current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateCategory(category.id, (current) => ({ ...current, multi: !current.multi }))
                      }
                      aria-label={category.multi ? t('multi') : t('single')}
                      title={category.multi ? t('multi') : t('single')}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-sky-300 bg-sky-100/80 px-3 text-xs font-medium text-sky-700 dark:border-sky-500/60 dark:bg-sky-900/30 dark:text-sky-200"
                    >
                      {category.multi ? <Layers className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      <span>{category.multi ? t('multi') : t('single')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      aria-label={t('delete')}
                      title={t('delete')}
                      className={`${iconButtonBase} border border-rose-300 bg-rose-100/80 text-rose-700 dark:border-rose-500/60 dark:bg-rose-900/30 dark:text-rose-200`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {category.options.map((option, index) => (
                      <div key={`${category.id}-${index}`} className="flex items-center gap-2">
                        <input
                          value={category.isCustom ? option : getLocalizedOptionLabel(category, option, index, t)}
                          onChange={(event) => {
                            if (!category.isCustom) return;
                            updateOptionLabel(category.id, index, event.target.value);
                          }}
                          readOnly={!category.isCustom}
                          className="w-full rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none read-only:cursor-not-allowed read-only:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:read-only:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => removeOptionFromCategory(category.id, option)}
                          aria-label={t('delete')}
                          title={t('delete')}
                          className={`${iconButtonBase} border border-rose-300 text-rose-600 dark:border-rose-500/60 dark:text-rose-300`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={newOptionDrafts[category.id] ?? ''}
                      onChange={(event) =>
                        setNewOptionDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))
                      }
                      onKeyDown={(event) => onAddOptionInputKeyDown(event, category.id)}
                      placeholder={t('newOptionPlaceholder')}
                      className="w-full rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80"
                    />
                    <button
                      type="button"
                      onClick={() => addOptionToCategory(category.id)}
                      aria-label={t('addOptionButton')}
                      title={t('addOptionButton')}
                      className={`${iconButtonBase} border border-indigo-300 bg-indigo-100/80 text-indigo-700 dark:border-indigo-500/60 dark:bg-indigo-900/30 dark:text-indigo-200`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}

              <article className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('newCategoryPlaceholder')}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    onKeyDown={onAddCategoryInputKeyDown}
                    placeholder={t('newCategoryPlaceholder')}
                    className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80"
                  />
                  <button
                    type="button"
                    onClick={() => setNewCategoryMulti((prev) => !prev)}
                    aria-label={newCategoryMulti ? t('multi') : t('single')}
                    title={t('allowMultiSelect')}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-sky-300 bg-sky-100/80 px-3 text-xs font-medium text-sky-700 dark:border-sky-500/60 dark:bg-sky-900/30 dark:text-sky-200"
                    >
                      {newCategoryMulti ? <Layers className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      <span>{newCategoryMulti ? t('multi') : t('single')}</span>
                    </button>
                  <button
                    type="button"
                    onClick={addCategory}
                    aria-label={t('addCategoryButton')}
                    title={t('addCategoryButton')}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-100/80 px-2.5 text-xs font-medium text-indigo-700 dark:border-indigo-500/60 dark:bg-indigo-900/30 dark:text-indigo-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('addCategoryButton')}</span>
                  </button>
                </div>
              </article>
            </div>
          </section>
        ) : (
          <section className="space-y-4 rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              {t('usageGuideTitle')}
            </h2>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <p>
                <span className="mr-1 font-semibold">1.</span>
                {t('usageGuideStep1')}
              </p>
              <p>
                <span className="mr-1 font-semibold">2.</span>
                {t('usageGuideStep2')}
              </p>
              <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 text-xs font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                {`${t('usageGuideWireframeLabel')} 1`}
              </div>
              <p>
                <span className="mr-1 font-semibold">3.</span>
                {t('usageGuideStep3')}
              </p>
              <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 text-xs font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                {`${t('usageGuideWireframeLabel')} 2`}
              </div>
            </div>
          </section>
        )}
        <footer className="grid w-full gap-2 pt-1 text-[11px] text-slate-400 dark:text-slate-500 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <span className="justify-self-center sm:col-start-2">{SETTINGS_VERSION}</span>
          <span className="inline-flex flex-wrap items-center justify-end gap-3 text-right sm:col-start-3 sm:justify-self-end">
            <a
              href="https://github.com/dubiety/slide-styling-prompt-generator/issues"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              provide feedback
            </a>
            <a
              href="https://github.com/dubiety/slide-styling-prompt-generator"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              Copyright © dubiety
            </a>
          </span>
        </footer>
      </div>
    </main>
  );
}

export default App;
