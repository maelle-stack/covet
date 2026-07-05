import { colorTokens, darkColorTokens } from '@covet/design-tokens';

import { buildTheme, STATUS_LABELS, statusVisual } from './theme';

describe('buildTheme', () => {
  it('resolves the light palette by default and the dark palette for dark scheme', () => {
    expect(buildTheme('light').color).toBe(colorTokens);
    expect(buildTheme('dark').color).toBe(darkColorTokens);
  });

  it('dark mode is a distinct night palette, not an inversion of light', () => {
    const dark = buildTheme('dark');
    expect(dark.color.background.primary).toBe('#0D0D0F');
    expect(dark.color.status.letsNot).not.toBe(colorTokens.status.letsNot);
  });
});

describe('statusVisual', () => {
  const theme = buildTheme('light');

  it('maps every engine status to the design-doc treatment', () => {
    expect(statusVisual('YOURE_GOOD', theme).aura).toBe(theme.color.aura.primary);
    expect(statusVisual('TAKE_IT_EASY', theme).aura).toBe(theme.color.aura.warning);
    expect(statusVisual('WAIT_UNTIL_PAYDAY', theme).aura).toBe(theme.color.status.waitUntilPayday);
    expect(statusVisual('LETS_NOT', theme).dimmed).toBe(true);
  });

  it('never uses bright green or aggressive red anywhere in the status palette', () => {
    for (const status of ['YOURE_GOOD', 'TAKE_IT_EASY', 'WAIT_UNTIL_PAYDAY', 'LETS_NOT'] as const) {
      const { aura, accent } = statusVisual(status, theme);
      for (const hex of [aura, accent]) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // "Bright green": green channel dominating both others by a wide margin.
        expect(g > r + 80 && g > b + 80).toBe(false);
        // "Aggressive red": near-pure saturated red.
        expect(r > 200 && g < 80 && b < 80).toBe(false);
      }
    }
  });

  it('status wording matches the product language', () => {
    expect(STATUS_LABELS.YOURE_GOOD).toBe("YOU'RE GOOD");
    expect(STATUS_LABELS.LETS_NOT).toBe('LET’S NOT…');
  });
});
