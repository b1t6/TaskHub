const PREFIX = "taskhub:sidebar-projects:";

export type SidebarProjectPref = {
  order: string[];
};

const EMPTY: SidebarProjectPref = { order: [] };

export function loadSidebarPref(userId: string): SidebarProjectPref {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(PREFIX + userId);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as { order?: unknown };
    return {
      order: Array.isArray(parsed.order) ? parsed.order.filter((id) => typeof id === "string") : [],
    };
  } catch {
    return EMPTY;
  }
}

export function saveSidebarPref(userId: string, pref: SidebarProjectPref) {
  window.localStorage.setItem(PREFIX + userId, JSON.stringify(pref));
}

export function sortSidebarProjects<T extends { id: string; createdAt: string }>(
  projects: T[],
  pref: SidebarProjectPref
): T[] {
  const byId = new Map(projects.map((project) => [project.id, project]));
  const seen = new Set<string>();
  const ordered: T[] = [];
  for (const id of pref.order) {
    const project = byId.get(id);
    if (!project || seen.has(id)) continue;
    seen.add(id);
    ordered.push(project);
  }
  const fresh = projects
    .filter((project) => !seen.has(project.id))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return [...fresh, ...ordered];
}
