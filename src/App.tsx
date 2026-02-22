import { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import {
  BookTemplate,
  Check,
  Circle,
  Copy,
  Download,
  Layers,
  Moon,
  Palette as PaletteIcon,
  Plus,
  RotateCcw,
  Sun,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { defaultLanguage, parseLanguage, supportedLanguages } from './localization/config';
import {
  buildPromptPreview,
  CUSTOMIZATION_STORAGE_KEY,
  DEFAULT_CATEGORIES,
  DEFAULT_PALETTES,
  DEFAULT_STYLE_PRESETS,
  makeId,
  type CategoryTemplate,
  type ColorSet,
  type Palette,
  type PersistedCustomization,
  type SelectionMap,
  type StylePreset
} from './lib/customization';

type ColorMode = 'light' | 'dark';
type TabKey = 'generator' | 'templates';

const colorModeStorageKey = 'ui-color-mode';

type LoadedCustomizationState = {
  palettes: Palette[];
  styles: StylePreset[];
  categories: CategoryTemplate[];
  selectedPaletteId: string;
  selectedStyleId: string;
  colors: ColorSet;
  selections: SelectionMap;
};

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
  const raw = window.localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
  if (!raw) return baseState;

  try {
    const parsed = JSON.parse(raw) as PersistedCustomization | null;
    if (!parsed || parsed.version !== 1) return baseState;

    const customPalettes = Array.isArray(parsed.customPalettes)
      ? parsed.customPalettes.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            isColorSet(item.colors) &&
            item.isCustom === true
        )
      : [];

    const customStyles = Array.isArray(parsed.customStyles)
      ? parsed.customStyles.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.promptHint === 'string' &&
            item.isCustom === true
        )
      : [];

    const loadedCustomCategories = Array.isArray(parsed.categories)
      ? parsed.categories
          .filter(
            (item) =>
              item &&
              typeof item.id === 'string' &&
              typeof item.name === 'string' &&
              typeof item.multi === 'boolean' &&
              Array.isArray(item.options) &&
              item.isCustom === true
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            multi: item.multi,
            options: item.options.filter((option): option is string => typeof option === 'string'),
            isCustom: true
          }))
      : [];

    const categories = [
      ...defaultCategories,
      ...loadedCustomCategories.filter(
        (customCategory) => !defaultCategories.some((defaultCategory) => defaultCategory.id === customCategory.id)
      )
    ];
    const palettes = [...DEFAULT_PALETTES, ...customPalettes];
    const styles = [...DEFAULT_STYLE_PRESETS, ...customStyles];
    const selectedPaletteId = palettes.some((item) => item.id === parsed.selectedPaletteId)
      ? parsed.selectedPaletteId
      : palettes[0].id;
    const selectedStyleId = styles.some((item) => item.id === parsed.selectedStyleId)
      ? parsed.selectedStyleId
      : styles[0].id;
    const colors = isColorSet(parsed.colors)
      ? parsed.colors
      : palettes.find((item) => item.id === selectedPaletteId)?.colors ?? palettes[0].colors;
    const selections = sanitizeSelections(parsed.selections ?? {}, categories);

    return { palettes, styles, categories, selectedPaletteId, selectedStyleId, colors, selections };
  } catch {
    return baseState;
  }
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

function getLocalizedCategoryName(category: CategoryTemplate, t: TFunction): string {
  if (category.isCustom) return category.name;
  return t(`categoryTemplates.${category.id}.name`, { defaultValue: category.name });
}

function getLocalizedOptionLabel(
  category: CategoryTemplate,
  option: string,
  optionIndex: number,
  t: TFunction
): string {
  if (category.isCustom) return option;
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

  const activeLanguage = routeLanguage ?? defaultLanguage;
  const selectedStyle = styles.find((item) => item.id === selectedStyleId) ?? styles[0];
  const selectedPalette = palettes.find((item) => item.id === selectedPaletteId) ?? palettes[0];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorMode === 'dark');
    window.localStorage.setItem(colorModeStorageKey, colorMode);
  }, [colorMode]);

  useEffect(() => {
    setSelections((prev) => sanitizeSelections(prev, categories));
  }, [categories]);

  useEffect(() => {
    const payload: PersistedCustomization = {
      version: 1,
      customPalettes: palettes.filter((item) => item.isCustom),
      customStyles: styles.filter((item) => item.isCustom),
      categories: cloneCategories(categories),
      selectedPaletteId,
      selectedStyleId,
      colors,
      selections
    };
    window.localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(payload));
  }, [palettes, styles, categories, selectedPaletteId, selectedStyleId, colors, selections]);

  const generatedPrompt = useMemo(
    () =>
      buildPromptPreview({
        language: activeLanguage,
        colors,
        paletteName: getLocalizedPaletteName(selectedPalette, t),
        styleName: selectedStyle.name,
        styleHint: selectedStyle.promptHint,
        selections,
        categories
      }),
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
    window.localStorage.removeItem(CUSTOMIZATION_STORAGE_KEY);
  };

  const applyPalette = (palette: Palette) => {
    setSelectedPaletteId(palette.id);
    setColors({ ...palette.colors });
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
              <h1 className="font-['Space_Grotesk',_'Noto_Sans_TC',sans-serif] text-2xl font-semibold tracking-tight md:text-3xl">
                {t('appTitle')}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('appSubtitle')}</p>
            </div>

            <div className="flex flex-col gap-2 xl:items-end">
              <div className="flex flex-wrap gap-2">
                <label className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
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

              <div className="inline-flex rounded-full border border-white/70 bg-white/70 p-1 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/70">
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
                        onChange={(event) =>
                          setColors((prev) => ({
                            ...prev,
                            [key]: event.target.value
                          }))
                        }
                        className="h-8 w-8 rounded-full border-0 bg-transparent p-0"
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {`${t(`colorKeys.${key}`)} ${colors[key].toUpperCase()}`}
                      </span>
                    </div>
                  ))}
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
                          ? 'border-fuchsia-400 bg-fuchsia-100/70 dark:border-fuchsia-500/70 dark:bg-fuchsia-900/30'
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
        ) : (
          <section className="space-y-4 rounded-3xl border border-white/45 bg-white/55 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55">
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder={t('newCategoryPlaceholder')}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newCategoryMulti}
                    onChange={(event) => setNewCategoryMulti(event.target.checked)}
                    className="mr-1"
                  />
                  {t('allowMultiSelect')}
                </label>
                <button
                  type="button"
                  onClick={addCategory}
                  aria-label={t('addCategoryButton')}
                  title={t('addCategoryButton')}
                  className={`${iconButtonBase} border border-indigo-300 bg-indigo-100/80 text-indigo-700 dark:border-indigo-500/60 dark:bg-indigo-900/30 dark:text-indigo-200`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={category.name}
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
                      className={`${iconButtonBase} border border-sky-300 bg-sky-100/80 text-sky-700 dark:border-sky-500/60 dark:bg-sky-900/30 dark:text-sky-200`}
                    >
                      {category.multi ? <Layers className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
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
                          value={option}
                          onChange={(event) => updateOptionLabel(category.id, index, event.target.value)}
                          className="w-full rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80"
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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
