type MapEntity = {
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  text?: string | null;
  [key: string]: unknown;
};

type MapPlan = {
  sections?: MapEntity[];
  metadata?: { labels?: MapEntity[] } | null;
};

const boundsOf = (entity: MapEntity) => {
  const x = Number(entity.x ?? 50);
  const y = Number(entity.y ?? 50);
  const width = Math.max(1, Number(entity.width ?? 20));
  const height = Math.max(1, Number(entity.height ?? 12));
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  };
};

const isStage = (entity: MapEntity) =>
  String(entity.text ?? "").toLowerCase().includes("stage");

/** Fits every visual entity into a padded 0..100 viewport using one scale. */
export function fitMapLayout(plan: MapPlan, padding = 10) {
  const sections = (plan.sections ?? []).map((section) => ({ ...section }));
  const labels = (plan.metadata?.labels ?? []).map((label) => ({ ...label }));
  const sectionBottom = sections.length
    ? Math.max(...sections.map((section) => boundsOf(section).bottom))
    : 50;

  // Imported/legacy plans sometimes store STAGE on top of chairs. Keep its
  // width/height but place it immediately below the seating envelope first.
  const separatedLabels = labels.map((label) => {
    if (!isStage(label)) return label;
    const height = Math.max(8, Number(label.height ?? 11));
    const current = boundsOf({ ...label, height });
    return current.top <= sectionBottom + 4
      ? { ...label, x: 50, y: sectionBottom + 6 + height / 2, height }
      : { ...label, height };
  });

  const entities = [...sections, ...separatedLabels];
  if (!entities.length) return { sections, labels: separatedLabels };
  const entityBounds = entities.map(boundsOf);
  const source = {
    left: Math.min(...entityBounds.map((item) => item.left)),
    right: Math.max(...entityBounds.map((item) => item.right)),
    top: Math.min(...entityBounds.map((item) => item.top)),
    bottom: Math.max(...entityBounds.map((item) => item.bottom)),
  };
  const sourceWidth = Math.max(1, source.right - source.left);
  const sourceHeight = Math.max(1, source.bottom - source.top);
  const available = 100 - padding * 2;
  const scale = Math.min(available / sourceWidth, available / sourceHeight);
  const sourceCenterX = (source.left + source.right) / 2;
  const sourceCenterY = (source.top + source.bottom) / 2;
  const transform = (entity: MapEntity) => ({
    ...entity,
    x: 50 + (Number(entity.x ?? 50) - sourceCenterX) * scale,
    y: 50 + (Number(entity.y ?? 50) - sourceCenterY) * scale,
    width: Math.max(1, Number(entity.width ?? 20) * scale),
    height: Math.max(1, Number(entity.height ?? 12) * scale),
  });
  return {
    sections: sections.map(transform),
    labels: separatedLabels.map(transform),
  };
}

// Deterministic visual-regression fixtures for a stage below seats and a
// dense 30x30 section. Both must remain inside the padded viewport.
export const STAGE_BELOW_FIT_FIXTURE = fitMapLayout({
  sections: [{ x: 50, y: 30, width: 80, height: 40 }],
  metadata: { labels: [{ text: "STAGE", x: 50, y: 92, width: 42, height: 12 }] },
});
export const DENSE_PLAN_FIT_FIXTURE = fitMapLayout({
  sections: [{ x: 50, y: 48, width: 96, height: 72, rows: 30, columns: 30 }],
  metadata: { labels: [{ text: "STAGE", x: 50, y: 90, width: 44, height: 10 }] },
});
