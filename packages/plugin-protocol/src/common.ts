import { z } from "zod";
import { PLUGIN_LIMITS } from "./limits.js";

/** Wraps z.string().max() so runtime validation counts Unicode code points like JSON Schema maxLength and Python len(). */
export function maxCodePoints(schema: z.ZodString, maxLength: number): z.ZodString {
  const next = schema.max(maxLength);
  const checks = (
    next as unknown as {
      _zod?: { def?: { checks?: { _zod?: { check?: (payload: { value: unknown }) => void } }[] } };
    }
  )._zod?.def?.checks;
  const last = checks?.at(-1)?._zod;
  const origCheck = last?.check;
  if (last && origCheck) {
    last.check = (payload) => {
      if (typeof payload.value === "string") {
        if ([...payload.value].length <= maxLength) return;
        origCheck({ ...payload, value: "x".repeat(maxLength + 1) });
        return;
      }
      origCheck(payload);
    };
  }
  return next;
}

// Wire schemas stay exportable to JSON Schema: no transform, coercion or custom refinement.
// Patterns avoid \d, \w, \s and \b so ECMAScript and Python regular expressions agree.
// eslint-disable-next-line no-control-regex -- the pattern rejects control characters.
export const SINGLE_LINE = /^[^\u0000-\u001F\u007F]*$/;
// eslint-disable-next-line no-control-regex -- allows tab and newline, rejects other controls.
export const MULTI_LINE = /^[^\u0000-\u0008\u000B-\u001F\u007F]*$/;

export const namespacedIdSchema = maxCodePoints(z.string().min(3), PLUGIN_LIMITS.idLength).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/,
);
export const semverSchema = maxCodePoints(z.string(), 64).regex(
  /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,
);
export const pluginLocaleSchema = z.enum(["en", "zh-TW"]);
export type PluginLocale = z.infer<typeof pluginLocaleSchema>;
export const permissionSchema = z.enum(["ui.notifications"]);
export type Permission = z.infer<typeof permissionSchema>;
const text = maxCodePoints(z.string().min(1), PLUGIN_LIMITS.textLength).regex(SINGLE_LINE);
export const localizedTextSchema = z.union([
  text,
  z.looseObject({ en: text, "zh-TW": text.optional() }),
]);
export type LocalizedText = z.infer<typeof localizedTextSchema>;
