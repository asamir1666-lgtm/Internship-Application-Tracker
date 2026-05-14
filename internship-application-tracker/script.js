const authPage = document.getElementById("authPage");
const appPage = document.getElementById("appPage");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const switchAuthBtn = document.getElementById("switchAuthBtn");
const authMessage = document.getElementById("authMessage");
const nameLabel = document.getElementById("nameLabel");
const fullName = document.getElementById("fullName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const welcomeUser = document.getElementById("welcomeUser");
const logoutBtn = document.getElementById("logoutBtn");

const form = document.getElementById("applicationForm");
const editId = document.getElementById("editId");
const company = document.getElementById("company");
const position = document.getElementById("position");
const statusInput = document.getElementById("status");
const deadline = document.getElementById("deadline");
const notes = document.getElementById("notes");
const applicationsList = document.getElementById("applicationsList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

let isCreateMode = false;
let currentUser = JSON.parse(localStorage.getItem("currentInternshipUser")) || null;
let applications = [];

function getUsers() {
  return JSON.parse(localStorage.getItem("internshipUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("internshipUsers", JSON.stringify(users));
}

function getUserStorageKey() {
  return `internshipApplications_${currentUser.email}`;
}

function loadApplications() {
  applications = JSON.parse(localStorage.getItem(getUserStorageKey())) || [];
}

function saveApplications() {
  localStorage.setItem(getUserStorageKey(), JSON.stringify(applications));
}

function showApp() {
  authPage.classList.add("hidden");
  appPage.classList.remove("hidden");
  welcomeUser.textContent = `Logged in as ${currentUser.name} (${currentUser.email})`;
  loadApplications();
  renderApplications();
}

function showAuth() {
  appPage.classList.add("hidden");
  authPage.classList.remove("hidden");
}

function setAuthMode(createMode) {
  isCreateMode = createMode;
  authTitle.textContent = isCreateMode ? "Create Account" : "Login";
  authSubmitBtn.textContent = isCreateMode ? "Create Account" : "Login";
  switchAuthBtn.textContent = isCreateMode
    ? "Already have an account? Login"
    : "Don’t have an account? Create one";
  nameLabel.classList.toggle("hidden", !isCreateMode);
  fullName.required = isCreateMode;
  authMessage.textContent = "";
  authForm.reset();
}

authForm.addEventListener("submit", event => {
  event.preventDefault();

  const users = getUsers();
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const name = fullName.value.trim();

  if (isCreateMode) {
    const userExists = users.some(user => user.email === email);

    if (userExists) {
      authMessage.textContent = "An account with this email already exists.";
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    saveUsers(users);

    currentUser = { name: newUser.name, email: newUser.email };
    localStorage.setItem("currentInternshipUser", JSON.stringify(currentUser));
    showApp();
    return;
  }

  const matchingUser = users.find(
    user => user.email === email && user.password === password
  );

  if (!matchingUser) {
    authMessage.textContent = "Incorrect email or password.";
    return;
  }

  currentUser = { name: matchingUser.name, email: matchingUser.email };
  localStorage.setItem("currentInternshipUser", JSON.stringify(currentUser));
  showApp();
});

switchAuthBtn.addEventListener("click", () => {
  setAuthMode(!isCreateMode);
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  applications = [];
  localStorage.removeItem("currentInternshipUser");
  resetForm();
  setAuthMode(false);
  showAuth();
});

function getUpcomingDeadlineCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  return applications.filter(app => {
    const deadlineDate = new Date(app.deadline + "T00:00:00");
    return deadlineDate >= today && deadlineDate <= sevenDaysFromNow;
  }).length;
}

function updateStats() {
  document.getElementById("totalCount").textContent = applications.length;
  document.getElementById("appliedCount").textContent =
    applications.filter(app => app.status === "Applied").length;
  document.getElementById("interviewCount").textContent =
    applications.filter(app => app.status === "Interview").length;
  document.getElementById("deadlineCount").textContent = getUpcomingDeadlineCount();
}

function renderApplications() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedStatus = filterStatus.value;

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm) ||
      app.position.toLowerCase().includes(searchTerm);

    const matchesStatus = selectedStatus === "All" || app.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  applicationsList.innerHTML = "";

  if (filteredApplications.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  filteredApplications
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .forEach(app => {
      const card = document.createElement("article");
      card.className = "application-card";

      card.innerHTML = `
        <div>
          <span class="badge ${app.status}">${app.status}</span>
          <h3>${escapeHTML(app.company)} — ${escapeHTML(app.position)}</h3>
          <p class="meta">Deadline: ${formatDate(app.deadline)}</p>
          <p class="notes">${escapeHTML(app.notes || "No notes added.")}</p>
        </div>
        <div class="card-actions">
          <button class="secondary-btn" onclick="editApplication('${app.id}')">Edit</button>
          <button class="danger-btn" onclick="deleteApplication('${app.id}')">Delete</button>
        </div>
      `;

      applicationsList.appendChild(card);
    });

  updateStats();
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const applicationData = {
    id: editId.value || crypto.randomUUID(),
    company: company.value.trim(),
    position: position.value.trim(),
    status: statusInput.value,
    deadline: deadline.value,
    notes: notes.value.trim()
  };

  if (editId.value) {
    applications = applications.map(app =>
      app.id === editId.value ? applicationData : app
    );
  } else {
    applications.push(applicationData);
  }

  saveApplications();
  resetForm();
  renderApplications();
});

function editApplication(id) {
  const app = applications.find(item => item.id === id);
  if (!app) return;

  editId.value = app.id;
  company.value = app.company;
  position.value = app.position;
  statusInput.value = app.status;
  deadline.value = app.deadline;
  notes.value = app.notes;

  submitBtn.textContent = "Save Changes";
  cancelEditBtn.style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteApplication(id) {
  applications = applications.filter(app => app.id !== id);
  saveApplications();
  renderApplications();
}

function resetForm() {
  form.reset();
  editId.value = "";
  submitBtn.textContent = "Add Application";
  cancelEditBtn.style.display = "none";
}

cancelEditBtn.addEventListener("click", resetForm);

clearAllBtn.addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to delete all applications for this account?");
  if (!confirmed) return;

  applications = [];
  saveApplications();
  resetForm();
  renderApplications();
});

searchInput.addEventListener("input", renderApplications);
filterStatus.addEventListener("change", renderApplications);

if (currentUser) {
  showApp();
} else {
  setAuthMode(false);
  showAuth();
}
