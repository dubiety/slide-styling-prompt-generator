import type { PromptStyle, PromptTheme, TargetPlatform, UILanguage } from '../types';

export type PromptInput = {
  style: PromptStyle;
  theme: PromptTheme;
  content: string;
  targetPlatform: TargetPlatform;
  outputLanguage: UILanguage;
};

export const styleOptions: PromptStyle[] = [
  'professional',
  'minimal',
  'storytelling',
  'educational',
  'startup'
];

export const themeOptions: PromptTheme[] = ['ocean', 'sunset', 'mono', 'forest', 'violet'];

const styleDirectives: Record<PromptStyle, string> = {
  professional: 'Use a business-ready structure with concise slide titles and clean hierarchy.',
  minimal: 'Use a minimal style with short phrases, whitespace-first layout, and low visual noise.',
  storytelling: 'Use narrative flow with hook, conflict, insight, and clear takeaways.',
  educational: 'Use teaching-first organization with progressive explanation and recap slides.',
  startup: 'Use startup pitch logic: problem, solution, market, product, traction, and ask.'
};

const themeDirectives: Record<PromptTheme, string> = {
  ocean: 'Use deep blue and cyan accents with calm visual tone.',
  sunset: 'Use warm orange and magenta accents with energetic tone.',
  mono: 'Use grayscale palette with one restrained accent color.',
  forest: 'Use green and earthy tones with natural, trustworthy mood.',
  violet: 'Use purple gradient accents with modern and creative mood.'
};

const languageDirectives: Record<UILanguage, string> = {
  en: 'Write the final slide plan in English.',
  'zh-TW': '請以繁體中文撰寫最終的簡報內容。',
  'zh-CN': '请以简体中文撰写最终的演示内容。',
  ja: '最終的スライド内容は日本語で作成してください。',
  ko: '최종 슬라이드 내용은 한국어로 작성해 주세요.',
  es: 'Escribe el plan final de diapositivas en español.',
  de: 'Schreibe den finalen Foliensatz auf Deutsch.',
  fr: 'Rédige le plan final des slides en français.',
  ru: 'Напиши итоговый план слайдов на русском языке.',
  pt: 'Escreva o plano final dos slides em português.'
};

export function generateSlidePrompt(input: PromptInput): string {
  const cleanedContent = input.content.trim();
  if (!cleanedContent) return '';

  return [
    `Target Platform: ${input.targetPlatform}`,
    'You are a presentation design assistant.',
    styleDirectives[input.style],
    themeDirectives[input.theme],
    languageDirectives[input.outputLanguage],
    '',
    'User source content:',
    cleanedContent,
    '',
    'Output requirements:',
    '- Return a slide-by-slide outline with titles and bullet points.',
    '- Include design notes for each slide (layout, icon/image suggestion, visual emphasis).',
    '- Keep transitions smooth and avoid repeating the same sentence structures.'
  ].join('\n');
}
