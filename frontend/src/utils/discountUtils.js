/**
 * Centralized discount resolution for menu items.
 *
 * Priority rule (enforced in one place):
 *   Item-level discount OVERRIDES global discount — never both.
 *
 * @param {object}       item    - MenuItem document from the API
 * @param {object|null}  global  - Currently active global Discount, or null
 * @returns {{ percentage, source, title?, appliesTo?, translations? } | null}
 */
export function getEffectiveDiscount(item, global) {
  if (!item) return null;

  // ── 1. Item-level discount takes full priority ───────────────────────────
  const d = item.discount;
  if (d?.isActive && Number(d.percentage) > 0) {
    return {
      percentage: Number(d.percentage),
      source: 'item',
    };
  }

  // ── 2. Fall back to global discount when item is targeted ────────────────
  if (global) {
    const cats    = global.categories ?? [];
    const itemIds = global.items ?? [];
    const noFilter        = !cats.length && !itemIds.length;
    const matchesCategory = cats.includes(item.category);
    const matchesItem     = itemIds.includes(item._id);
    if (noFilter || matchesCategory || matchesItem) {
      return {
        percentage:   global.percentage,
        source:       'global',
        title:        global.title,
        appliesTo:    global.appliesTo,
        translations: global.translations,
      };
    }
  }

  return null;
}
