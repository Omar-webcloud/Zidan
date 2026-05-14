import { firebaseConfig, firebaseEnabled, imageDbConfig } from "./firebase-config.js";

const CDN = "https://www.gstatic.com/firebasejs/10.12.5";
let servicesPromise;

export async function getFirebaseServices() {
  if (!firebaseEnabled) return null;
  if (servicesPromise) return servicesPromise;

  servicesPromise = Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`),
    import(`${CDN}/firebase-storage.js`)
  ]).then(([appMod, authMod, firestoreMod, storageMod]) => {
    const app = appMod.initializeApp(firebaseConfig);
    return {
      app,
      auth: authMod.getAuth(app),
      db: firestoreMod.getFirestore(app),
      imageDb: storageMod.getStorage(app),
      authMod,
      firestoreMod,
      storageMod
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
  const services = await getFirebaseServices();
  if (!services) throw new Error("Firebase is not configured.");

  const { imageDb, storageMod } = services;
  const cleanName = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const mediaPath = `${imageDbConfig.rootPath}/${Date.now()}-${cleanName}`;
  const storageRef = storageMod.ref(imageDb, mediaPath);
  const task = storageMod.uploadBytesResumable(storageRef, file, {
    contentType: file.type || "application/octet-stream"
  });

  await new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(percent);
      },
      reject,
      resolve
    );
  });

  return {
    url: await storageMod.getDownloadURL(task.snapshot.ref),
    type: file.type?.startsWith("video") ? "video" : "image",
    path: mediaPath
  };
}
