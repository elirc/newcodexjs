/**
 * Joins truthy class names into a single string for CSS Module composition.
 *
 * @param {...(string | false | null | undefined)} names - Class name fragments.
 * @returns {string} A space-delimited className value.
 */
export function classNames(...names) {
  return names.filter(Boolean).join(" ");
}
