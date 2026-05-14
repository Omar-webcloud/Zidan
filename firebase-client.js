import { firebaseConfig, firebaseEnabled, imageDbConfig, imageDbEnabled } from "./firebase-config.js";

const CDN = "https://www.gstatic.com/firebasejs/10.12.5";
let servicesPromise;

export async function getFirebaseServices() {
  if (!firebaseEnabled) return null;
  if (servicesPromise) return servicesPromise;

  servicesPromise = Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`)
  ]).then(([appMod, authMod, firestoreMod]) => {
    const app = appMod.initializeApp(firebaseConfig);
    return {
      app,
      auth: authMod.getAuth(app),
      db: firestoreMod.getFirestore(app),
      authMod,
      firestoreMod
    };
  });

  return servicesPromise;
}

export async function loadRemotePortfolio() {
  const services = await getFirebaseServices();
  if (!services) return null;

  const { db, firestoreMod } = services;
  const contentRef = firestoreMod.doc(db, "site", "content");
  const contentSnap = await firestoreMod.getDoc(contentRef);
  const projectsQuery = firestoreMod.query(
    firestoreMod.collection(db, "projects"),
    firestoreMod.orderBy("order", "asc")
  );
  const projectsSnap = await firestoreMod.getDocs(projectsQuery);

  return {
    content: contentSnap.exists() ? contentSnap.data() : {},
    projects: projectsSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
  };
}

export async function saveSiteContent(content) {
  const services = await getFirebaseServices();
  if (!services) throw new Error("Firebase is not configured.");
  const { db, firestoreMod } = services;
  await firestoreMod.setDoc(firestoreMod.doc(db, "site", "content"), content, { merge: true });
}

export async function saveProject(project) {
  const services = await getFirebaseServices();
  if (!services) throw new Error("Firebase is not configured.");
  const { db, firestoreMod } = services;
  const id = project.id || crypto.randomUUID();
  await firestoreMod.setDoc(
    firestoreMod.doc(db, "projects", id),
    {
      ...project,
      id,
      updatedAt: firestoreMod.serverTimestamp()
    },
    { merge: true }
  );
  return id;
}

export async function deleteProject(id) {
  const services = await getFirebaseServices();
  if (!services) throw new Error("Firebase is not configured.");
  const { db, firestoreMod } = services;
  await firestoreMod.deleteDoc(firestoreMod.doc(db, "projects", id));
}

export async function uploadMedia(file, onProgress = () => {}) {
  if (!imageDbEnabled) throw new Error("ImageDB is not configured. Add your ImgBB API key in firebase-config.js.");
  if (file.type?.startsWith("video")) {
    throw new Error("ImgBB supports image uploads only. For video, paste a hosted video URL into the Media URL field.");
  }

  onProgress(20);

  const formData = new FormData();
  formData.append("image", file);
  formData.append("name", file.name.replace(/\.[^.]+$/, ""));

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(imageDbConfig.apiKey)}`, {
    method: "POST",
    body: formData
  });

  onProgress(80);

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result?.error?.message || "ImageDB upload failed.");
  }

  onProgress(100);

  return {
    url: result.data.url,
    type: "image",
    path: result.data.delete_url || result.data.display_url || result.data.url
  };
}
