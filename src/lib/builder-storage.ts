const DB_NAME = "arzac-builder";
const STORE_NAME = "drafts";
const DRAFT_KEY = "current";

export interface SerializedFile {
  name: string;
  type: string;
  dataUrl: string;
}

export interface BuilderDraft {
  niche: string;
  customNiche: string;
  businessMode: "solo" | "team";
  businessName: string;
  description: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  logoCreate: boolean;
  colors: { primary: string; secondary: string };
  photos: SerializedFile[];
  staffPhotos: SerializedFile[];
  logo: SerializedFile | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function fileToSerialized(file: File): Promise<SerializedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, dataUrl: reader.result as string });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function saveBuilderDraft(data: Record<string, unknown>): Promise<void> {
  const photos: SerializedFile[] = [];
  const staffPhotos: SerializedFile[] = [];
  let logo: SerializedFile | null = null;

  if (Array.isArray(data.photos)) {
    for (const f of data.photos) {
      if (f instanceof File) photos.push(await fileToSerialized(f));
    }
  }
  if (Array.isArray(data.staffPhotos)) {
    for (const f of data.staffPhotos) {
      if (f instanceof File) staffPhotos.push(await fileToSerialized(f));
    }
  }
  if (data.logo instanceof File) {
    logo = await fileToSerialized(data.logo);
  }

  const draft: BuilderDraft = {
    niche: (data.niche as string) || "",
    customNiche: (data.customNiche as string) || "",
    businessMode: (data.businessMode as "solo" | "team") || "team",
    businessName: (data.businessName as string) || "",
    description: (data.description as string) || "",
    whatsapp: (data.whatsapp as string) || "",
    email: (data.email as string) || "",
    address: (data.address as string) || "",
    instagram: (data.instagram as string) || "",
    logoCreate: Boolean(data.logoCreate),
    colors: (data.colors as { primary: string; secondary: string }) || {
      primary: "#000000",
      secondary: "#ffffff",
    },
    photos,
    staffPhotos,
    logo,
  };

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(draft, DRAFT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadBuilderDraft(): Promise<BuilderDraft | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearBuilderDraft(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
