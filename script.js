// Firebase Config - GANTI DENGAN CONFIG PROJECT ANDA
const firebaseConfig = {
  apiKey: "AIzaSyBrvmIM8JLT_edqM35Na4zficCvE1j3Sis",
  authDomain: "museum-learning-e2634.firebaseapp.com",
  projectId: "museum-learning-e2634",
  storageBucket: "museum-learning-e2634.firebasestorage.app",
  messagingSenderId: "103011504636",
  appId: "1:103011504636:web:5930371296d1e6b1b6e279",
  measurementId: "G-5D1P6ZF46C"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// App State
const appState = {
  currentUser: null,
  questions: [],
  filteredQuestions: [],
  currentFilter: "all",
  isDarkMode: true,
  isAdmin: false,
  adminEmail: "Bryanleonardo481@gmail.com",
  currentQuestion: null
};

// DOM Elements
const elements = {
  loadingScreen: document.getElementById("loadingScreen"),
  authModal: document.getElementById("authModal"),
  authForm: document.getElementById("authForm"),
  modalTitle: document.getElementById("modalTitle"),
  authBtnText: document.getElementById("authBtnText"),
  authBtn: document.getElementById("authBtn"),
  authLoading: document.getElementById("authLoading"),
  toggleAuthText: document.getElementById("toggleAuthText"),
  toggleAuthBtn: document.getElementById("toggleAuthBtn"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  navbar: document.getElementById("navbar"),
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  questionsGrid: document.getElementById("questionsGrid"),
  searchInput: document.getElementById("searchInput"),
  dashboardTitle: document.getElementById("dashboardTitle"),
  totalQuestions: document.getElementById("totalQuestions"),
  modeToggle: document.getElementById("modeToggle"),
  profileBtn: document.getElementById("profileBtn"),
  userName: document.getElementById("userName"),
  logoutBtn: document.getElementById("logoutBtn"),
  addQuestionBtn: document.getElementById("addQuestionBtn"),
  questionModal: document.getElementById("questionModal"),
  addQuestionModal: document.getElementById("addQuestionModal"),
  questionForm: document.getElementById("questionForm"),
  toastContainer: document.getElementById("toastContainer")
};

// Initialize App
document.addEventListener("DOMContentLoaded", function () {
  initApp();
});

async function initApp() {
  // Check auth state
  auth.onAuthStateChanged(async (user) => {
    appState.currentUser = user;
    if (user) {
      appState.isAdmin = user.email === appState.adminEmail;
      await loadQuestions();
      hideLoading();
      updateUI();
      elements.profileBtn.style.display = "flex";
      elements.userName.textContent = user.email.split("@")[0];
    } else {
      showAuthModal();
      hideLoading();
    }
  });

  // Event Listeners
  initEventListeners();

  // Set dark mode default
  setDarkMode(true);
}

function initEventListeners() {
  // Auth
  elements.authForm.addEventListener("submit", handleAuth);
  elements.toggleAuthBtn.addEventListener("click", toggleAuthMode);
  elements.adminLogin.addEventListener("click", () => loginAdmin());

  // UI
  elements.sidebarToggle.addEventListener("click", toggleSidebar);
  elements.modeToggle.addEventListener("click", toggleDarkMode);
  elements.logoutBtn.addEventListener("click", logout);
  elements.profileBtn.addEventListener("click", showAuthModal);

  // Search
  elements.searchInput.addEventListener("input", debounce(handleSearch, 300));

  // Modals
  elements.addQuestionBtn.addEventListener("click", showAddQuestionModal);

  // Filters
  document.querySelectorAll(".menu-item[data-filter]").forEach((btn) => {
    btn.addEventListener("click", (e) => handleFilter(e.target.dataset.filter));
  });

  // Forms
  elements.questionForm.addEventListener("submit", handleAddQuestion);
  document.getElementById("formImage").addEventListener("change", previewImage);

  // Question Modal
  document
    .getElementById("modalClose")
    .addEventListener("click", hideAuthModal);
  document
    .getElementById("questionClose")
    .addEventListener("click", hideQuestionModal);
  document
    .getElementById("addQuestionClose")
    .addEventListener("click", hideAddQuestionModal);

  // Close modals on overlay click
  [
    elements.authModal,
    elements.questionModal,
    elements.addQuestionModal
  ].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });

  // Question actions
  document.getElementById("startQuizBtn").addEventListener("click", startQuiz);
  document
    .getElementById("showAnswerBtn")
    .addEventListener("click", showAnswer);
  document
    .getElementById("favoriteBtn")
    .addEventListener("click", toggleFavorite);
}

// Auth Functions
let isLoginMode = true;

async function handleAuth(e) {
  e.preventDefault();
  const email = elements.email.value;
  const password = elements.password.value;

  showLoadingBtn(elements.authBtn, elements.authLoading, elements.authBtnText);

  try {
    if (isLoginMode) {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      await auth.createUserWithEmailAndPassword(email, password);
    }
    hideAuthModal();
  } catch (error) {
    showToast(`Error: ${error.message}`, "error");
  } finally {
    hideLoadingBtn(
      elements.authBtn,
      elements.authLoading,
      elements.authBtnText
    );
  }
}

async function loginAdmin() {
  const adminEmail = prompt("Bryanleonardo481@gmail.com:");
  const adminPassword = prompt("Desytirta12:");

  if (adminEmail && adminPassword) {
    showLoadingBtn(
      elements.authBtn,
      elements.authLoading,
      elements.authBtnText
    );
    try {
      await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
    } catch (error) {
      showToast(`Login admin gagal: ${error.message}`, "error");
    } finally {
      hideLoadingBtn(
        elements.authBtn,
        elements.authLoading,
        elements.authBtnText
      );
    }
  }
}

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  elements.modalTitle.textContent = isLoginMode
    ? "Login ke Questio"
    : "Daftar ke Questio";
  elements.authBtnText.textContent = isLoginMode ? "Masuk" : "Daftar";
  elements.toggleAuthText.innerHTML = isLoginMode
    ? 'Belum punya akun? <span id="toggleAuthBtn">Daftar</span>'
    : 'Sudah punya akun? <span id="toggleAuthBtn">Masuk</span>';
}

function logout() {
  auth.signOut();
  toggleSidebar();
}

// UI Functions
function showAuthModal() {
  if (appState.currentUser) {
    hideAuthModal();
    return;
  }
  elements.authModal.classList.add("active");
}

function hideAuthModal() {
  elements.authModal.classList.remove("active");
  elements.authForm.reset();
  isLoginMode = true;
  toggleAuthMode();
}

function showQuestionModal(question) {
  appState.currentQuestion = question;
  document.getElementById("questionTitle").textContent = question.judul;
  document.getElementById("questionText").textContent = question.judul;
  document.getElementById("questionSubject").textContent = question.mapel;
  document.getElementById("questionDifficulty").textContent =
    question.tingkatKesulitan;
  document.getElementById(
    "questionTime"
  ).textContent = `${question.waktuPengerjaan} menit`;

  const img = document.getElementById("questionImage");
  if (question.gambarSoal) {
    img.src = question.gambarSoal;
    img.style.display = "block";
  } else {
    img.style.display = "none";
  }

  document.getElementById("answerSection").style.display = "none";
  elements.questionModal.classList.add("active");
}

function hideQuestionModal() {
  elements.questionModal.classList.remove("active");
  appState.currentQuestion = null;
}

function showAddQuestionModal() {
  if (!appState.isAdmin) {
    showToast("Hanya admin yang bisa menambah soal", "error");
    return;
  }
  elements.addQuestionModal.classList.add("active");
}

function hideAddQuestionModal() {
  elements.addQuestionModal.classList.remove("active");
  elements.questionForm.reset();
  document.getElementById("imagePreview").innerHTML = "";
}

function toggleSidebar() {
  elements.sidebar.classList.toggle("active");
  const overlay = document.querySelector(".sidebar-overlay") || createOverlay();
  overlay.classList.toggle("active");
}

function toggleDarkMode() {
  appState.isDarkMode = !appState.isDarkMode;
  setDarkMode(appState.isDarkMode);
}

function setDarkMode(isDark) {
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );
  elements.modeToggle.innerHTML = isDark
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';
  localStorage.setItem("darkMode", isDark);
}

function updateUI() {
  const total = appState.questions.length;
  elements.totalQuestions.textContent = total.toLocaleString();
  elements.dashboardTitle.textContent = `Dashboard Soal (${total})`;

  if (appState.currentFilter !== "all") {
    const filtered = appState.filteredQuestions.length;
    elements.dashboardTitle.textContent += ` • ${appState.currentFilter} (${filtered})`;
  }

  renderQuestions();

  // Show/hide admin features
  elements.addQuestionBtn.style.display = appState.isAdmin ? "flex" : "none";
}

function showSkeleton() {
  const skeletonHTML = `
        ${Array(6)
          .fill(0)
          .map(
            () => `
            <div class="question-card skeleton">
                <div style="height: 200px; background: var(--glass-border); border-radius: var(--border-radius-sm); margin-bottom: 1rem;"></div>
                <div style="height: 20px; background: var(--glass-border); border-radius: 8px; margin-bottom: 1rem;"></div>
                <div style="height: 16px; background: var(--glass-border); border-radius: 8px; width: 70%;"></div>
                <div class="question-meta" style="margin-top: 1rem;">
                    <div style="height: 24px; background: var(--glass-border); border-radius: 12px; width: 60px;"></div>
                    <div style="height: 24px; background: var(--glass-border); border-radius: 12px; width: 50px;"></div>
                </div>
            </div>
        `
          )
          .join("")}
    `;
  elements.questionsGrid.innerHTML = skeletonHTML;
}

function showEmptyState() {
  elements.questionsGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>Belum ada soal</h3>
            <p>${
              appState.isAdmin
                ? "Tambahkan soal pertama Anda!"
                : "Soal akan muncul di sini setelah ada yang mengunggah."
            }</p>
        </div>
    `;
}

// Data Functions
async function loadQuestions() {
  showSkeleton();
  try {
    const snapshot = await db
      .collection("questions")
      .orderBy("tanggalUpload", "desc")
      .get();
    appState.questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    appState.filteredQuestions = [...appState.questions];
    updateUI();
  } catch (error) {
    console.error("Error loading questions:", error);
    showToast("Gagal memuat soal", "error");
    showEmptyState();
  }
}

function handleFilter(filter) {
  appState.currentFilter = filter;
  document
    .querySelectorAll(".menu-item")
    .forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active");

  if (filter === "all") {
    appState.filteredQuestions = [...appState.questions];
  } else {
    appState.filteredQuestions = appState.questions.filter(
      (q) => q.mapel.toLowerCase() === filter.toLowerCase()
    );
  }

  renderQuestions();
  toggleSidebar();
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  appState.filteredQuestions = appState.questions.filter(
    (q) =>
      q.judul.toLowerCase().includes(query) ||
      q.mapel.toLowerCase().includes(query)
  );
  renderQuestions();
}

function renderQuestions() {
  if (appState.filteredQuestions.length === 0) {
    showEmptyState();
    return;
  }

  elements.questionsGrid.innerHTML = appState.filteredQuestions
    .map((question) => createQuestionCard(question))
    .join("");

  // Add click listeners to cards
  document.querySelectorAll(".question-card:not(.skeleton)").forEach((card) => {
    card.addEventListener("click", () =>
      showQuestionModal(questionFromCard(card))
    );
  });
}

function createQuestionCard(question) {
  const difficultyColor =
    {
      Mudah: "#10b981",
      Sedang: "#f59e0b",
      Sulit: "#ef4444"
    }[question.tingkatKesulitan] || "#6b7280";

  return `
        <div class="question-card" data-id="${question.id}">
            ${
              question.gambarSoal
                ? `<img src="${question.gambarSoal}" alt="${question.judul}" class="question-image">`
                : ""
            }
            <div class="question-title">${question.judul}</div>
            <div class="question-meta">
                <span class="meta-tag subject">${question.mapel}</span>
                <span class="meta-tag difficulty" style="color: ${difficultyColor}">${
    question.tingkatKesulitan
  }</span>
                <span class="meta-tag">${question.waktuPengerjaan} min</span>
            </div>
            <div class="card-actions">
                <button class="btn-small btn-primary-small">
                    <i class="fas fa-play"></i> Kerjakan
                </button>
                <button class="btn-small btn-outline-small">
                    <i class="fas fa-eye"></i> Jawaban
                </button>
            </div>
        </div>
    `;
}

function questionFromCard(card) {
  const id = card.dataset.id;
  return appState.questions.find((q) => q.id === id);
}

// Form Functions
function previewImage(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById(
        "imagePreview"
      ).innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }
}

async function handleAddQuestion(e) {
  e.preventDefault();
  const formData = {
    judul: document.getElementById("formTitle").value,
    mapel: document.getElementById("formSubject").value,
    tingkatKesulitan: document.getElementById("formDifficulty").value,
    waktuPengerjaan: parseInt(document.getElementById("formTime").value),
    jawaban: document.getElementById("formAnswer").value,
    pembahasan: document.getElementById("formDiscussion").value,
    userPembuat: appState.currentUser.email,
    tanggalUpload: firebase.firestore.FieldValue.serverTimestamp()
  };

  const file = document.getElementById("formImage").files[0];

  showLoadingBtn(
    document.querySelector("#questionForm .btn-primary"),
    document.getElementById("submitLoading"),
    document.getElementById("submitBtnText")
  );

  try {
    let imageUrl = "";
    if (file) {
      const storageRef = storage.ref(`questions/${Date.now()}_${file.name}`);
      await storageRef.put(file);
      imageUrl = await storageRef.getDownloadURL();
      formData.gambarSoal = imageUrl;
    }

    await db.collection("questions").add(formData);
    showToast("Soal berhasil ditambahkan!", "success");
    hideAddQuestionModal();
    loadQuestions(); // Reload to show new question
  } catch (error) {
    console.error("Error adding question:", error);
    showToast(`Error: ${error.message}`, "error");
  } finally {
    hideLoadingBtn(
      document.querySelector("#questionForm .btn-primary"),
      document.getElementById("submitLoading"),
      document.getElementById("submitBtnText")
    );
  }
}

// Question Modal Actions
function startQuiz() {
  showToast("Fitur kuis akan segera hadir!", "info");
}

function showAnswer() {
  const answerSection = document.getElementById("answerSection");
  const answerContent = document.getElementById("answerContent");
  const discussionContent = document.getElementById("discussionContent");

  if (appState.currentQuestion) {
    answerContent.innerHTML = `<strong>Jawaban:</strong> ${appState.currentQuestion.jawaban}`;
    discussionContent.innerHTML = `<strong>Pembahasan:</strong> ${appState.currentQuestion.pembahasan}`;
    answerSection.style.display = "block";
    answerSection.scrollIntoView({ behavior: "smooth" });
  }
}

async function toggleFavorite() {
  if (!appState.currentQuestion) return;

  try {
    const favoriteRef = db
      .collection("favorites")
      .doc(`${appState.currentUser.uid}_${appState.currentQuestion.id}`);
    const doc = await favoriteRef.get();

    if (doc.exists) {
      await favoriteRef.delete();
      showToast("Dihapus dari favorit", "info");
    } else {
      await favoriteRef.set({
        userId: appState.currentUser.uid,
        questionId: appState.currentQuestion.id,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("Ditambahkan ke favorit", "success");
    }
  } catch (error) {
    showToast("Error: " + error.message, "error");
  }
}

// Utility Functions
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span>${message}</span>
    `;

  elements.toastContainer.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add("show");
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }, 100);
}

function showLoading() {
  elements.loadingScreen.style.display = "flex";
}

function hideLoading() {
  elements.loadingScreen.style.display = "none";
}

function showLoadingBtn(btn, spinner, textEl) {
  btn.disabled = true;
  spinner.style.display = "inline-block";
  textEl.style.display = "none";
}

function hideLoadingBtn(btn, spinner, textEl) {
  btn.disabled = false;
  spinner.style.display = "none";
  textEl.style.display = "inline";
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function createOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  overlay.addEventListener("click", toggleSidebar);
  document.body.appendChild(overlay);
  return overlay;
}

// Load dark mode preference
function loadDarkModePreference() {
  const saved = localStorage.getItem("darkMode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  appState.isDarkMode = saved !== null ? JSON.parse(saved) : prefersDark;
  setDarkMode(appState.isDarkMode);
}

// Initialize dark mode on load
loadDarkModePreference();

db.collection("test").add({
  message: "hello bryan"
});