const OFFLINE_DB_NAME = "cookbook-offline";
const OFFLINE_DB_VERSION = 2;
const RECIPES_STORE = "recipes";
const PHOTOS_STORE = "photos";
const META_STORE = "meta";

const messages = {
  pt: {
    notice: "Está sem ligação — a mostrar receitas guardadas neste dispositivo. Para editar, precisa de ligação.",
    missing: "Esta receita não está disponível offline.",
    listHeading: "Receitas disponíveis neste dispositivo",
    empty: "Ainda não há receitas guardadas neste dispositivo.",
    ingredients: "Ingredientes",
    steps: "Preparação",
    photos: "Fotografias originais",
    photoAlt: "Fotografia original {n} de {total}",
    photoMissing: "Esta fotografia não está disponível sem ligação.",
    loadError: "Não foi possível carregar as receitas guardadas neste dispositivo.",
  },
  en: {
    notice: "You are offline — showing recipes saved on this device. Editing needs a connection.",
    missing: "This recipe is not available offline.",
    listHeading: "Recipes available on this device",
    empty: "No recipes have been saved on this device yet.",
    ingredients: "Ingredients",
    steps: "Method",
    photos: "Original photos",
    photoAlt: "Original photo {n} of {total}",
    photoMissing: "This photo isn't available offline.",
    loadError: "The recipes saved on this device could not be loaded.",
  },
};

function appendText(parent, tagName, text) {
  const element = document.createElement(tagName);
  element.textContent = text;
  parent.append(element);
  return element;
}

function appendLines(parent, tagName, values) {
  const list = document.createElement(tagName);
  for (const value of values) appendText(list, "li", value);
  parent.append(list);
}

function openDatabase() {
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
    request.onerror = () => reject(request.error ?? new Error("IndexedDB could not be opened."));
    request.onblocked = () => reject(new Error("Opening IndexedDB is blocked by another tab."));
    request.onsuccess = () => resolve(request.result);
  });
}

function readRecipes(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(RECIPES_STORE, "readonly");
    const request = transaction.objectStore(RECIPES_STORE).getAll();
    request.onerror = () =>
      reject(request.error ?? new Error("Saved recipes could not be read."));
    request.onsuccess = () => resolve(request.result);
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Reading saved recipes failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Reading saved recipes was aborted."));
  });
}

function readPhotos(db, recipeId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PHOTOS_STORE, "readonly");
    const request = transaction.objectStore(PHOTOS_STORE).getAll();
    request.onerror = () => reject(request.error ?? new Error("Saved photos could not be read."));
    request.onsuccess = () => resolve(request.result.filter((photo) => photo.recipeId === recipeId));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Reading saved photos was aborted."));
  });
}

function renderPhotos(main, recipe, photos, labels) {
  const ids = Array.isArray(recipe.photoIds) ? recipe.photoIds : [];
  if (ids.length === 0) return;

  appendText(main, "h2", labels.photos);
  const list = document.createElement("div");
  ids.forEach((id, index) => {
    const photo = photos.find((item) => item.id === id);
    if (!photo) {
      appendText(list, "p", labels.photoMissing);
      return;
    }
    const image = document.createElement("img");
    image.src = URL.createObjectURL(photo.blob);
    image.alt = labels.photoAlt.replace("{n}", String(index + 1)).replace("{total}", String(ids.length));
    image.className = "recipe-photo";
    image.dataset.photoId = id;
    list.append(image);
  });
  main.append(list);
}

function renderRecipe(main, recipe, labels, photos) {
  appendText(main, "h1", recipe.title);

  if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
    appendText(main, "h2", labels.ingredients);
    appendLines(main, "ul", recipe.ingredients);
  }
  if (Array.isArray(recipe.steps) && recipe.steps.length > 0) {
    appendText(main, "h2", labels.steps);
    appendLines(main, "ol", recipe.steps);
  }
  renderPhotos(main, recipe, photos, labels);
}

function renderList(main, recipes, locale, labels) {
  appendText(main, "h1", labels.listHeading);
  if (recipes.length === 0) {
    appendText(main, "p", labels.empty);
    return;
  }

  for (const recipe of recipes) {
    const link = document.createElement("a");
    link.className = "recipe-link";
    link.href = `/${locale}/recipes/${encodeURIComponent(recipe.id)}`;
    link.textContent = recipe.title;
    main.append(link);
  }
}

async function renderOfflinePage() {
  const main = document.getElementById("offline-content");
  if (!main) throw new Error("The offline reader container is missing.");

  const segments = window.location.pathname.split("/").filter(Boolean);
  const locale = segments[0] === "en" ? "en" : "pt";
  const labels = messages[locale];
  const notice = document.createElement("div");
  notice.setAttribute("role", "status");
  notice.textContent = labels.notice;
  main.append(notice);

  const recipePath =
    segments[1] === "recipes" &&
    (segments.length === 3 || (segments.length === 4 && segments[3] === "edit"));

  let db;
  try {
    db = await openDatabase();
    const recipes = await readRecipes(db);
    if (recipePath) {
      const recipe = recipes.find((item) => item.id === segments[2]);
      if (recipe) renderRecipe(main, recipe, labels, await readPhotos(db, recipe.id));
      else appendText(main, "p", labels.missing);
      return;
    }
    renderList(main, recipes, locale, labels);
  } finally {
    db?.close();
  }
}

renderOfflinePage().catch((error) => {
  console.error("Could not render saved offline recipes.", error);
  const main = document.getElementById("offline-content");
  if (main) appendText(main, "p", messages[window.location.pathname.split("/")[1] === "en" ? "en" : "pt"].loadError);
});

window.addEventListener("online", () => window.location.reload());
