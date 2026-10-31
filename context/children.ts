import { ChildProfile } from '../types';
import { readItem, writeItem, removeItem } from '../utils/vault';

/**
 * Storage layout for more than one child:
 *   pedipulse_children           { activeId, children: [{ id, ...profile }] }
 *   pedipulse_history:<childId>  that child's medical history
 * Before any child is added, history is kept under the "guest" id.
 */
export interface ChildRecord extends ChildProfile {
  id: string;
}

export interface ChildrenState {
  activeId: string | null;
  children: ChildRecord[];
}

export const CHILDREN_KEY = 'pedipulse_children';
export const GUEST_ID = 'guest';
export const EMPTY_CHILDREN: ChildrenState = { activeId: null, children: [] };
const LEGACY_PROFILE_KEY = 'pedipulse_profile';
const LEGACY_HISTORY_KEY = 'pedipulse_history';

export const historyKey = (childId: string) => `pedipulse_history:${childId}`;

/** Drops fields from the old fake "account" (email, password) that should never be stored. */
const cleanProfile = (profile: any): ChildProfile => {
  const { email, password, stayLoggedIn, ...rest } = profile || {};
  return { medications: [], previousMedications: [], allergies: [], ...rest };
};

/**
 * One-off move from the single-child layout. Safe to call on every start:
 * it does nothing once pedipulse_children exists.
 */
export function migrateLegacyRecords(newId: () => string = () => crypto.randomUUID()): void {
  if (readItem(CHILDREN_KEY) !== null) return;
  const profileRaw = readItem(LEGACY_PROFILE_KEY);
  const historyRaw = readItem(LEGACY_HISTORY_KEY);

  let state: ChildrenState = EMPTY_CHILDREN;
  if (profileRaw) {
    const id = newId();
    state = { activeId: id, children: [{ ...cleanProfile(JSON.parse(profileRaw)), id }] };
    if (historyRaw) writeItem(historyKey(id), historyRaw);
  } else if (historyRaw) {
    writeItem(historyKey(GUEST_ID), historyRaw);
  }
  writeItem(CHILDREN_KEY, JSON.stringify(state));
  removeItem(LEGACY_PROFILE_KEY);
  removeItem(LEGACY_HISTORY_KEY);
}

export function addChild(state: ChildrenState, profile: ChildProfile, id: string): ChildrenState {
  // The first child takes over anything recorded before a profile existed.
  if (state.children.length === 0) {
    const guest = readItem(historyKey(GUEST_ID));
    if (guest !== null) {
      writeItem(historyKey(id), guest);
      removeItem(historyKey(GUEST_ID));
    }
  }
  return { activeId: id, children: [...state.children, { ...cleanProfile(profile), id }] };
}

export function updateChild(state: ChildrenState, id: string, profile: ChildProfile): ChildrenState {
  return { ...state, children: state.children.map(c => (c.id === id ? { ...cleanProfile(profile), id } : c)) };
}

export function removeChild(state: ChildrenState, id: string): ChildrenState {
  removeItem(historyKey(id));
  const children = state.children.filter(c => c.id !== id);
  const activeId = state.activeId === id ? (children[0]?.id ?? null) : state.activeId;
  return { activeId, children };
}
