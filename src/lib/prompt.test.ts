import { describe, expect, it } from 'vitest';
import { generateSlidePrompt } from './prompt';

describe('generateSlidePrompt', () => {
  it('includes selected platform and directives', () => {
    const result = generateSlidePrompt({
      style: 'storytelling',
      theme: 'violet',
      content: 'Launch new product line in Q3 with 3 market segments.',
      targetPlatform: 'NotebookLM',
      outputLanguage: 'ja'
    });

    expect(result).toContain('Target Platform: NotebookLM');
    expect(result).toContain('Use narrative flow');
    expect(result).toContain('Launch new product line in Q3');
    expect(result).toContain('日本語で作成');
  });

  it('returns empty string for blank content', () => {
    const result = generateSlidePrompt({
      style: 'professional',
      theme: 'ocean',
      content: '   ',
      targetPlatform: 'Gemini',
      outputLanguage: 'en'
    });

    expect(result).toBe('');
  });
});
