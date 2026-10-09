import { describe, expect, it } from "vitest";
import {
  deriveColorVariants,
  generateThemeFromBaseColor,
  getLuminance,
  hexToRgb,
  hexToRgba,
  hslToHex,
  isColorDark,
  rgbToHex,
  rgbToHsl,
  toggleThemeMode,
  DEFAULT_PINK_THEME,
  THEME_COLOR_PRESETS,
} from "./custom-theme.js";

describe("custom-theme color algorithms", () => {
  it("converts hex to rgb and rgb to hex accurately", () => {
    expect(hexToRgb("#22c55e")).toEqual([34, 197, 94]);
    expect(rgbToHex(34, 197, 94)).toBe("#22c55e");
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(hexToRgba("#22c55e", 0.5)).toBe("rgba(34, 197, 94, 0.5)");
  });

  it("converts rgb to hsl and hsl to hex accurately", () => {
    const [h, s, l] = rgbToHsl(34, 197, 94);
    expect(h).toBeGreaterThanOrEqual(140);
    expect(h).toBeLessThanOrEqual(145);
    expect(s).toBeGreaterThan(0.6);
    expect(l).toBeGreaterThan(0.4);

    const hex = hslToHex(h, s, l);
    expect(hex).toBe("#22c55e");
  });

  it("calculates luminance and dark threshold correctly", () => {
    expect(getLuminance("#ffffff")).toBeCloseTo(1.0, 2);
    expect(getLuminance("#000000")).toBeCloseTo(0.0, 2);
    expect(isColorDark("#1e101b")).toBe(true);
    expect(isColorDark("#ffffff")).toBe(false);
  });

  it("derives color variants with high contrast onAccent (no white on bright)", () => {
    const greenVariants = deriveColorVariants("#22c55e");
    expect(greenVariants.accent).toBe("#22c55e");
    expect(greenVariants.onAccent).toBe("#0f172a"); // Dark text on bright green

    const yellowVariants = deriveColorVariants("#eab308");
    expect(yellowVariants.accent).toBe("#eab308");
    expect(yellowVariants.onAccent).toBe("#0f172a"); // Dark text on yellow

    const deepBlueVariants = deriveColorVariants("#1e3a8a");
    expect(deepBlueVariants.accent).toBe("#1e3a8a");
    expect(deepBlueVariants.onAccent).toBe("#ffffff"); // White text on dark blue
  });

  it("pulls background dark and sets accent when generating theme from green", () => {
    const theme = generateThemeFromBaseColor("#22c55e", "Green Immersion");
    expect(theme.accent).toBe("#22c55e");
    expect(theme.onAccent).toBe("#0f172a"); // Dark text on green button

    // Background surfaces must be pulled dark
    expect(isColorDark(theme.surface!)).toBe(true);
    expect(isColorDark(theme.editorBg!)).toBe(true);
    expect(isColorDark(theme.raised!)).toBe(true);
    expect(theme.textColor).toBe("#f8fafc"); // Crisp light text on dark surfaces
  });

  it("generates light variant for green without losing accent", () => {
    const theme = generateThemeFromBaseColor("#22c55e", "Green Light", "light");
    expect(theme.accent).toBe("#22c55e");
    expect(isColorDark(theme.surface!)).toBe(false);
    expect(theme.textColor).toBe("#0f172a"); // Dark text on light background
    expect(theme.editorBg).toBe("#ffffff");
  });

  it("toggles between dark and light without jumping back to pink for custom colors", () => {
    const darkGreen = generateThemeFromBaseColor("#22c55e", "Green Dark", "dark");
    const lightGreen = toggleThemeMode(darkGreen, "light");
    expect(lightGreen.accent).toBe("#22c55e");
    expect(isColorDark(lightGreen.surface!)).toBe(false);

    const backToDark = toggleThemeMode(lightGreen, "dark");
    expect(backToDark.accent).toBe("#22c55e");
    expect(isColorDark(backToDark.surface!)).toBe(true);
  });

  it("toggles between sakura pink and sweet peach", () => {
    const lightPink = toggleThemeMode(DEFAULT_PINK_THEME, "light");
    expect(lightPink.name).toContain("Sweet Peach");
    expect(isColorDark(lightPink.surface!)).toBe(false);

    const darkPink = toggleThemeMode(lightPink, "dark");
    expect(darkPink.name).toBe(DEFAULT_PINK_THEME.name);
    expect(isColorDark(darkPink.surface!)).toBe(true);
  });

  it("ensures all 2-in-1 presets contain valid dark and light mode themes", () => {
    expect(THEME_COLOR_PRESETS.length).toBeGreaterThanOrEqual(7);

    for (const preset of THEME_COLOR_PRESETS) {
      expect(preset.darkTheme).toBeDefined();
      expect(preset.lightTheme).toBeDefined();

      // Dark theme surface must be dark
      expect(isColorDark(preset.darkTheme.surface!)).toBe(true);
      // Light theme surface must be light
      expect(isColorDark(preset.lightTheme.surface!)).toBe(false);

      // Toggling darkTheme with 'light' should give its lightTheme
      const toLight = toggleThemeMode(preset.darkTheme, "light");
      expect(toLight.name).toBe(preset.lightTheme.name);
      expect(isColorDark(toLight.surface!)).toBe(false);

      // Toggling lightTheme with 'dark' should give its darkTheme
      const toDark = toggleThemeMode(preset.lightTheme, "dark");
      expect(toDark.name).toBe(preset.darkTheme.name);
      expect(isColorDark(toDark.surface!)).toBe(true);
    }
  });
});
