/**
 * @module @dreamer/middlewares/i18n
 *
 * Middlewares package i18n: error messages and log messages for request-signature,
 * compression, security-headers, request-validator, csrf, error-handler,
 * performance-analyzer, static-files. Locale is detected from LANGUAGE/LC_ALL/LANG.
 */

import {
  createI18n,
  type I18n,
  type TranslationData,
  type TranslationParams,
} from "@dreamer/i18n";
import { getEnv } from "@dreamer/runtime-adapter";
import enUS from "./locales/en-US.json" with { type: "json" };
import zhCN from "./locales/zh-CN.json" with { type: "json" };

export type Locale = "en-US" | "zh-CN";
export const DEFAULT_LOCALE: Locale = "en-US";

const MIDDLEWARES_LOCALES: Locale[] = ["en-US", "zh-CN"];
const LOCALE_DATA: Record<string, TranslationData> = {
  "en-US": enUS as TranslationData,
  "zh-CN": zhCN as TranslationData,
};

let middlewaresI18n: I18n | null = null;

/**
 * Detect locale from environment (LANGUAGE, LC_ALL, LANG).
 */
export function detectLocale(): Locale {
  const langEnv = getEnv("LANGUAGE") || getEnv("LC_ALL") || getEnv("LANG");
  if (!langEnv) return DEFAULT_LOCALE;
  const first = langEnv.split(/[:\s]/)[0]?.trim();
  if (!first) return DEFAULT_LOCALE;
  const match = first.match(/^([a-z]{2})[-_]([A-Z]{2})/i);
  if (match) {
    const normalized = `${match[1].toLowerCase()}-${
      match[2].toUpperCase()
    }` as Locale;
    if (MIDDLEWARES_LOCALES.includes(normalized)) return normalized;
  }
  const primary = first.substring(0, 2).toLowerCase();
  if (primary === "zh") return "zh-CN";
  if (primary === "en") return "en-US";
  return DEFAULT_LOCALE;
}

function initMiddlewaresI18n(): void {
  if (middlewaresI18n) return;
  const i18n = createI18n({
    defaultLocale: DEFAULT_LOCALE,
    fallbackBehavior: "default",
    locales: [...MIDDLEWARES_LOCALES],
    translations: LOCALE_DATA as Record<string, TranslationData>,
  });
  i18n.setLocale(detectLocale());
  middlewaresI18n = i18n;
}

initMiddlewaresI18n();

/**
 * Set middlewares package locale (affects $tr for subsequent calls).
 */
export function setMiddlewaresLocale(lang: Locale): void {
  initMiddlewaresI18n();
  if (middlewaresI18n) middlewaresI18n.setLocale(lang);
}

/**
 * Translate a key. Keys are under "middlewares.*" (e.g. middlewares.requestSignature.missingSignature).
 */
export function $tr(
  key: string,
  params?: TranslationParams,
  lang?: Locale,
): string {
  if (!middlewaresI18n) initMiddlewaresI18n();
  if (!middlewaresI18n) return key;
  if (lang !== undefined) {
    const prev = middlewaresI18n.getLocale();
    middlewaresI18n.setLocale(lang);
    try {
      return middlewaresI18n.t(key, params);
    } finally {
      middlewaresI18n.setLocale(prev);
    }
  }
  return middlewaresI18n.t(key, params);
}
