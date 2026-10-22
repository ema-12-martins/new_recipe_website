import type { RecipeRecord } from "@/lib/recipes/schema";

import {
  META_STORE,
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  RECIPES_STORE,
} from "./constants";

type OfflineRecipe = Pick<RecipeRecord, "id" | "title" | "ingredients" | "steps" | "version"> & {
  savedAt: number;
};

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
    const transaction = db.transaction([RECIPES_STORE, META_STORE], "readwrite");
    const recipes = transaction.objectStore(RECIPES_STORE);
    const metadata = transaction.objectStore(META_STORE);
    const ownerRequest = metadata.get("owner");

    ownerRequest.onsuccess = () => {
      const owner = ownerRequest.result as OfflineOwner | undefined;
      if (owner?.userId !== userId) {
        recipes.clear();
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

export async function saveOpenedRecipe(userId: string, recipe: RecipeRecord): Promise<void> {
  if (!userId) throw new Error("An authenticated user is required for offline storage.");
  await ensureOfflineOwner(userId);

  await withDatabase(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([RECIPES_STORE, META_STORE], "readwrite");
        const recipes = transaction.objectStore(RECIPES_STORE);
        const metadata = transaction.objectStore(META_STORE);
        const ownerRequest = metadata.get("owner");

        ownerRequest.onsuccess = () => {
          const owner = ownerRequest.result as OfflineOwner | undefined;
          if (owner?.userId !== userId) {
            recipes.clear();
            metadata.put({ key: "owner", userId } satisfies OfflineOwner);
          }
          recipes.put({
            id: recipe.id,
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            version: recipe.version,
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
