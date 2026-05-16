import { firebaseEnabled } from "../firebase-config.js";
import { deleteProject, getFirebaseServices, loadRemotePortfolio, saveProject, saveSiteContent, uploadMedia } from "../firebase-client.js";
import { defaultFeaturedProjects, defaultPortfolioProjects, defaultSiteContent } from "../site-data.js";

const configWarning = document.querySelector("[data-config-warning]");
const authPanel = document.querySelector("[data-auth-panel]");
const adminContent = document.querySelector("[data-admin-content]");
const loginForm = document.querySelector("[data-login-form]");
const loginMessage = document.querySelector("[data-login-message]");
const signOutButton = document.querySelector("[data-sign-out]");
const contentForm = document.querySelector("[data-content-form]");
const contentMessage = document.querySelector("[data-content-message]");
const projectForm = document.querySelector("[data-project-form]");
const projectList = document.querySelector("[data-project-list]");
const projectMessage = document.querySelector("[data-project-message]");
const uploadInput = document.querySelector("[data-media-input]");
const uploadMessage = document.querySelector("[data-upload-message]");
const uploadTarget = document.querySelector("[data-upload-target]");
const imageDbKeyInput = document.querySelector("[data-image-db-key]");

const contentFields = [
  ["heroName", "Hero Name"],
  ["heroRole", "Hero Role"],
  ["heroLocation", "Hero Location"],
  ["heroTitle", "Hero Title"],
  ["heroBody", "Hero Body"],
  ["aboutEyebrow", "About Label"],
  ["aboutTitle", "About Title"],
  ["servicesEyebrow", "Services Label"],
  ["servicesTitle", "Services Title"],
  ["featuredEyebrow", "Featured Label"],
  ["featuredTitle", "Featured Title"],
  ["portfolioEyebrow", "Portfolio Label"],
  ["portfolioTitle", "Portfolio Title"],
  ["processEyebrow", "Process Label"],
  ["processTitle", "Process Title"],
  ["experienceEyebrow", "Experience Label"],
  ["experienceTitle", "Experience Title"],
  ["statementEyebrow", "Statement Label"],
  ["statementTitle", "Statement Title"],
  ["contactEyebrow", "Contact Label"],
  ["contactTitle", "Contact Title"],
  ["contactBody", "Contact Body"],
  ["email", "Email"],
  ["location", "Location"],
  ["workplace", "Workplace"],
  ["behanceLabel", "Behance Label"],
  ["behanceUrl", "Behance URL"],
  ["instagramLabel", "Instagram Label"],
  ["instagramUrl", "Instagram URL"],
  ["linkedinLabel", "LinkedIn Label"],
  ["linkedinUrl", "LinkedIn URL"],
  ["dribbbleLabel", "Dribbble Label"],
  ["dribbbleUrl", "Dribbble URL"],
  ["heroMediaUrl", "Hero Image URL"],
  ["heroMediaType", "Hero Media Type"],
  ["aboutMediaUrl", "About Image URL"],
  ["aboutMediaType", "About Media Type"],
  ["servicesMediaUrl", "Services Image URL"],
  ["servicesMediaType", "Services Media Type"],
  ["processMediaUrl", "Process Image URL"],
  ["processMediaType", "Process Media Type"],
  ["experienceMediaUrl", "Experience Image URL"],
  ["experienceMediaType", "Experience Media Type"],
  ["statementMediaUrl", "Statement Background URL"],
  ["statementMediaType", "Statement Media Type"],
  ["contactMediaUrl", "Contact Image URL"],
  ["contactMediaType", "Contact Media Type"],
  ["footerMediaUrl", "Footer Image URL"],
  ["footerMediaType", "Footer Media Type"],
  ["ogImageUrl", "Open Graph Image URL"]
];

let services;
let projects = [...defaultFeaturedProjects, ...defaultPortfolioProjects].filter(
  (project, index, list) => list.findIndex((item) => item.id === project.id) === index
);
let selectedProjectId = projects[0]?.id;

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "#ff8a8a" : "#d7ff3f";
}

function renderContentForm(content = defaultSiteContent) {
  contentForm.innerHTML = contentFields
    .map(([key, label]) => {
      const value = content[key] || "";
      const isLong = key.endsWith("Body") || key.endsWith("Title");
      const isMedia = key.includes("Media") || key === "ogImageUrl";
      let input;

      if (key.endsWith("MediaType")) {
        input = `
          <select name="${key}">
            <option value="image" ${value !== "video" ? "selected" : ""}>Image</option>
            <option value="video" ${value === "video" ? "selected" : ""}>Video</option>
          </select>
        `;
      } else if (isLong) {
        input = `<textarea name="${key}" rows="3">${escapeHtml(value)}</textarea>`;
      } else {
        input = `<input name="${key}" value="${escapeHtml(value)}" />`;
      }

      return `<label class="${isLong || isMedia ? "wide" : ""}">${label}${input}</label>`;
    })
    .join("");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function fillProjectForm(project = {}) {
  projectForm.id.value = project.id || "";
  projectForm.title.value = project.title || "";
  projectForm.category.value = project.category || "";
  projectForm.categoryKey.value = project.categoryKey || "branding";
  projectForm.year.value = project.year || new Date().getFullYear();
  projectForm.order.value = project.order ?? projects.length + 1;
  projectForm.size.value = project.size || "";
  projectForm.artClass.value = project.artClass || "art-texture";
  projectForm.mediaUrl.value = project.mediaUrl || "";
  projectForm.mediaType.value = project.mediaType || "";
  projectForm.featured.checked = Boolean(project.featured);
  projectForm.status.checked = project.status !== "draft";
  projectForm.description.value = project.description || "";
  selectedProjectId = project.id || "";
  renderProjectList();
}

function renderProjectList() {
  projectList.innerHTML = projects
    .slice()
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map(
      (project) => `
        <button class="project-row ${project.id === selectedProjectId ? "is-active" : ""}" type="button" data-project-id="${project.id}">
          <strong>${escapeHtml(project.title)}</strong>
          <span>${escapeHtml(project.category)} / ${escapeHtml(project.year)}${project.featured ? " / Featured" : ""}${project.status === "draft" ? " / Draft" : ""}</span>
        </button>
      `
    )
    .join("");
}

async function refreshData() {
  const remote = await loadRemotePortfolio();
  const content = { ...defaultSiteContent, ...(remote?.content || {}) };
  const remoteProjects = remote?.projects?.length ? remote.projects : projects;
  projects = remoteProjects.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  renderContentForm(content);
  renderProjectList();
  fillProjectForm(projects.find((project) => project.id === selectedProjectId) || projects[0] || {});
}

async function boot() {
  if (imageDbKeyInput) {
    imageDbKeyInput.value = localStorage.getItem("zidanImageDbApiKey") || "";
  }

  renderContentForm(defaultSiteContent);
  renderProjectList();
  fillProjectForm(projects[0] || {});

  if (!firebaseEnabled) {
    configWarning.hidden = false;
    setMessage(loginMessage, "Firebase is not configured yet. Add your project keys before signing in.", true);
    return;
  }

  services = await getFirebaseServices();
  services.authMod.onAuthStateChanged(services.auth, async (user) => {
    const signedIn = Boolean(user);
    authPanel.hidden = signedIn;
    adminContent.hidden = !signedIn;
    signOutButton.hidden = !signedIn;

    if (signedIn) {
      await refreshData();
    }
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = formToObject(loginForm);
    await services.authMod.signInWithEmailAndPassword(services.auth, data.email, data.password);
    setMessage(loginMessage, "");
  } catch (error) {
    setMessage(loginMessage, error.message, true);
  }
});

signOutButton.addEventListener("click", async () => {
  await services.authMod.signOut(services.auth);
});

document.querySelector("[data-save-content]").addEventListener("click", async () => {
  try {
    await saveSiteContent(formToObject(contentForm));
    setMessage(contentMessage, "Content saved.");
  } catch (error) {
    setMessage(contentMessage, error.message, true);
  }
});

document.querySelector("[data-new-project]").addEventListener("click", () => {
  fillProjectForm({
    order: projects.length + 1,
    year: new Date().getFullYear(),
    categoryKey: "branding",
    artClass: "art-texture",
    status: "published"
  });
});

projectList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-project-id]");
  if (!button) return;
  const project = projects.find((item) => item.id === button.dataset.projectId);
  if (project) fillProjectForm(project);
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = formToObject(projectForm);
    const project = {
      ...data,
      id: data.id || crypto.randomUUID(),
      order: Number(data.order || 0),
      featured: projectForm.featured.checked,
      status: projectForm.status.checked ? "published" : "draft"
    };
    await saveProject(project);
    selectedProjectId = project.id;
    setMessage(projectMessage, "Project saved.");
    await refreshData();
  } catch (error) {
    setMessage(projectMessage, error.message, true);
  }
});

document.querySelector("[data-delete-project]").addEventListener("click", async () => {
  const id = projectForm.id.value;
  if (!id) {
    fillProjectForm({});
    return;
  }

  if (!confirm("Delete this project from Firestore?")) return;

  try {
    await deleteProject(id);
    selectedProjectId = "";
    setMessage(projectMessage, "Project deleted.");
    await refreshData();
  } catch (error) {
    setMessage(projectMessage, error.message, true);
  }
});

document.querySelector("[data-save-image-db-key]").addEventListener("click", () => {
  localStorage.setItem("zidanImageDbApiKey", imageDbKeyInput.value.trim());
  setMessage(uploadMessage, "ImageDB key saved in this browser.");
});

document.querySelector("[data-upload-media]").addEventListener("click", async () => {
  const file = uploadInput.files?.[0];
  if (!file) {
    setMessage(uploadMessage, "Choose an image or video first.", true);
    return;
  }

  try {
    setMessage(uploadMessage, "Uploading 0%...");
    const media = await uploadMedia(file, (percent) => setMessage(uploadMessage, `Uploading ${percent}%...`));
    const target = uploadTarget.value;

    if (target === "project") {
      projectForm.mediaUrl.value = media.url;
      projectForm.mediaType.value = media.type;
      setMessage(uploadMessage, "Uploaded. The image URL was added to the selected project form.");
      return;
    }

    const field = contentForm.querySelector(`[name="${target}"]`);
    if (field) field.value = media.url;

    if (target.endsWith("MediaUrl")) {
      const typeField = contentForm.querySelector(`[name="${target.replace("MediaUrl", "MediaType")}"]`);
      if (typeField) typeField.value = media.type;
    }

    await saveSiteContent(formToObject(contentForm));
    setMessage(uploadMessage, "Uploaded and saved to the selected section.");
  } catch (error) {
    setMessage(uploadMessage, error.message, true);
  }
});

boot();
