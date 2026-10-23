import type { RecipeRecord } from "@/lib/recipes/schema";

import {
  META_STORE,
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  PHOTOS_STORE,
  RECIPES_STORE,
} from "./constants";

type OfflineRecipe = Pick<RecipeRecord, "id" | "title" | "ingredients" | "steps" | "version"> & {
  /** Ordered ids of the recipe's photos, so the reader knows which ones should exist. */
  photoIds: string[];
  savedAt: number;
};

export type OfflinePhoto = { id: string; recipeId: string; position: number; blob: Blob };

type OfflineOwner = { key: "owner"; userId: string };

const openConnections = new Set<IDBDatabase>();

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECIPES_STORE)) {
        db.createObjectStore(RECIPES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Could not open offline storage."));
    request.onblocked = () => reject(new Error("Offline storage upgrade is blocked by another tab."));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        openConnections.delete(db);
      };
      openConnections.add(db);
      resolve(db);
    };
  });
}

function withDatabase<T>(operation: (db: IDBDatabase) => Promise<T>): Promise<T> {
  return openDatabase().then(async (db) => {
    try {
      return await operation(db);
    } finally {
      openConnections.delete(db);
      db.close();
    }
  });
}

function updateOwner(db: IDBDatabase, userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECIPES_STORE, PHOTOS_STORE, META_STORE], "readwrite");
    const recipes = transaction.objectStore(RECIPES_STORE);
    const photos = transaction.objectStore(PHOTOS_STORE);
    const metadata = transaction.objectStore(META_STORE);
    const ownerRequest = metadata.get("owner");

    ownerRequest.onsuccess = () => {
      const owner = ownerRequest.result as OfflineOwner | undefined;
      if (owner?.userId !== userId) {
        recipes.clear();
        photos.clear();
        metadata.put({ key: "owner", userId } satisfies OfflineOwner);
      }
    };
    ownerRequest.onerror = () =>
      reject(ownerRequest.error ?? new Error("Could not read offline account ownership."));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not update offline account ownership."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Offline account ownership update was aborted."));
  });
}

export async function ensureOfflineOwner(userId: string): Promise<void> {
  if (!userId) throw new Error("An authenticated user is required for offline storage.");
  await withDatabase((db) => updateOwner(db, userId));
}

export async function saveOpenedRecipe(
  userId: string,
  recipe: RecipeRecord,
  photoIds: string[] = [],
): Promise<void> {
  if (!userId) throw new Error("An authenticated user is required for offline storage.");
  await ensureOfflineOwner(userId);

  await withDatabase(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([RECIPES_STORE, PHOTOS_STORE, META_STORE], "readwrite");
        const recipes = transaction.objectStore(RECIPES_STORE);
        const photos = transaction.objectStore(PHOTOS_STORE);
        const metadata = transaction.objectStore(META_STORE);
        const ownerRequest = metadata.get("owner");

        ownerRequest.onsuccess = () => {
          const owner = ownerRequest.result as OfflineOwner | undefined;
          if (owner?.userId !== userId) {
            recipes.clear();
            photos.clear();
            metadata.put({ key: "owner", userId } satisfies OfflineOwner);
          }
          recipes.put({
            id: recipe.id,
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            version: recipe.version,
            photoIds,
            savedAt: Date.now(),
          } satisfies OfflineRecipe);
        };
        ownerRequest.onerror = () =>
          reject(ownerRequest.error ?? new Error("Could not verify offline account ownership."));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error("Could not save the recipe for offline reading."));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error("Saving the offline recipe was aborted."));
      }),
  );
}

/**
 * Replaces the stored photos of one opened recipe (so photos removed since are dropped). Only
 * photos of recipes the member has opened are ever stored (D-38).
 */
export async function saveOpenedRecipePhotos(
  userId: string,
  recipeId: string,
  photos: Omit<OfflinePhoto, "recipeId">[],
): Promise<void> {
  if (!userId) throw new Error("An authenticated user is required for offline storage.");
  await ensureOfflineOwner(userId);

  await withDatabase(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(PHOTOS_STORE, "readwrite");
        const store = transaction.objectStore(PHOTOS_STORE);
        const all = store.getAll();
        all.onsuccess = () => {
          for (const photo of all.result as OfflinePhoto[]) {
            if (photo.recipeId === recipeId) store.delete(photo.id);
          }
          for (const photo of photos) store.put({ ...photo, recipeId } satisfies OfflinePhoto);
        };
        all.onerror = () => reject(all.error ?? new Error("Could not read saved photos."));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error("Could not save the photos for offline reading."));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error("Saving the offline photos was aborted."));
      }),
  );
}

export async function purgeOfflineData(): Promise<void> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser.");
  }

  for (const connection of openConnections) connection.close();
  openConnections.clear();

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(OFFLINE_DB_NAME);
    request.onblocked = () => {
      for (const connection of openConnections) connection.close();
      openConnections.clear();
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Could not clear offline recipe data."));
    request.onsuccess = () => resolve();
  });
}
