import { useSyncExternalStore } from 'react';
import { getStorageVersion, subscribeStorage } from '../services/storageService';

/** Re-renders the caller whenever any operational collection is written. */
export function useStorageVersion(): number {
  return useSyncExternalStore(subscribeStorage, getStorageVersion);
}
