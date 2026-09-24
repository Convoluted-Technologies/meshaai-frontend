import {
  getPresetsFromStore,
  savePresetsToStore,
  getPresetHistory,
  rollbackPresetVersion,
} from '@/lib/db/store';
import { PresetMeal, PresetVersionHistory } from '@/lib/types';

export function getActivePresets(): PresetMeal[] {
  const presets = getPresetsFromStore();
  return presets.filter((p) => p.isAvailable);
}

export function getAllPresets(): PresetMeal[] {
  return getPresetsFromStore();
}

export function getPresetById(id: string): PresetMeal | undefined {
  const presets = getPresetsFromStore();
  return presets.find((p) => p.id === id);
}

export function createPreset(
  preset: Omit<PresetMeal, 'id' | 'createdAt' | 'updatedAt'>,
  actor = 'ADMIN'
): PresetMeal {
  const presets = getPresetsFromStore();
  const newId = `preset-${Date.now()}`;
  const now = new Date().toISOString();

  const newPreset: PresetMeal = {
    ...preset,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newPreset, ...presets];
  savePresetsToStore(updated, actor, `Created preset "${newPreset.name}"`);
  return newPreset;
}

export function updatePreset(
  id: string,
  updates: Partial<Omit<PresetMeal, 'id' | 'createdAt'>>,
  actor = 'ADMIN'
): PresetMeal {
  const presets = getPresetsFromStore();
  const idx = presets.findIndex((p) => p.id === id);
  if (idx < 0) {
    throw new Error(`Preset with ID ${id} not found`);
  }

  const updatedPreset: PresetMeal = {
    ...presets[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  presets[idx] = updatedPreset;
  savePresetsToStore(presets, actor, `Updated preset "${updatedPreset.name}"`);
  return updatedPreset;
}

export function togglePresetAvailability(
  id: string,
  isAvailable: boolean,
  actor = 'ADMIN'
): PresetMeal {
  return updatePreset(
    id,
    { isAvailable },
    actor
  );
}

export function getCatalogVersions(): PresetVersionHistory[] {
  return getPresetHistory();
}

export function rollbackCatalog(versionId: string, actor = 'ADMIN'): PresetMeal[] {
  return rollbackPresetVersion(versionId, actor);
}
