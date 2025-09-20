(function () {
  // Helpers
  function pad(n) {
    return n.toString().padStart(2, "0");
  }

  // Returns Jakarta Date object
  function nowJakarta() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  }

  function formatDateTimeJakarta(dateObj) {
    const dayName = dateObj.toLocaleDateString("id-ID", { weekday: "long" });
    const dateStr = dateObj.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr =
      pad(dateObj.getHours()) +
      ":" +
      pad(dateObj.getMinutes()) +
      ":" +
      pad(dateObj.getSeconds()) +
      " WIB";
    return `${dayName}, ${dateStr} | ${timeStr}`;
  }

  // Search
document.getElementById("search-input").addEventListener("input", function (e) {
  const keyword = e.target.value.toLowerCase();
  renderTasks(currentFilter, keyword);
});

// Filter
document.querySelectorAll("[data-filter]").forEach((el) => {
  el.addEventListener("click", () => {
    currentFilter = el.getAttribute("data-filter");
    renderTasks(currentFilter, document.getElementById("search-input").value.toLowerCase());
  });
});

let currentFilter = "all";

function renderTasks(filter = "all", keyword = "") {
  const nowJakartaTime = nowJakarta().getTime();

  let total = tasks.length;
  let completed = 0, pending = 0, overdueCount = 0;

  const visibleTasks = tasks.filter((task) => {
    let isOverdue = false;
    if (task.due && task.status !== "completed") {
      const dueTime = new Date(task.due).getTime();
      if (nowJakartaTime > dueTime) isOverdue = true;
    }
    task._isOverdue = isOverdue;

    if (task.status === "completed") completed++;
    else if (isOverdue) overdueCount++;
    else pending++;

    // filter
    if (filter === "pending" && (task.status === "completed" || isOverdue)) return false;
    if (filter === "completed" && task.status !== "completed") return false;
    if (filter === "overdue" && !isOverdue) return false;

    // search
    if (keyword && !(task.name.toLowerCase().includes(keyword) || (task.detail||"").toLowerCase().includes(keyword))) return false;

    return true;
  });

  // ... lanjut isi tabel sama seperti punya kamu
}


  // DOM refs for clock
  const datetimeDisplay = document.getElementById("datetime-display");

  function updateClock() {
    const jk = nowJakarta();
    datetimeDisplay.textContent = formatDateTimeJakarta(jk);
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Storage
  const STORAGE_KEY = "dailydo_tasks_v1";
  let tasks = [];

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
      tasks = [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    renderTasks();
  }

  // DOM elements
  const todosBody = document.querySelector(".todos-list-body");
  const totalCounter = document.querySelector(".total-counter");
  const completedCounter = document.querySelector(".completed-counter");
  const pendingCounter = document.querySelector(".pending-counter");
  const overdueCounter = document.querySelector(".overdue-counter");
  const percentageDisplay = document.querySelector(".percentage-display");
  const progressBar = document.querySelector(".progress-bar");

  // Modal elements
  const taskModalToggle = document.getElementById("task-modal-toggle");
  const openAddModalBtn = document.getElementById("open-add-modal-btn");
  const cancelTaskBtn = document.getElementById("cancel-task-btn");
  const saveTaskBtn = document.getElementById("save-task-btn");

  const taskNameInput = document.getElementById("task-name");
  const taskDetailInput = document.getElementById("task-detail");
  const taskDueDateInput = document.getElementById("task-due-date");
  const taskDueTimeInput = document.getElementById("task-due-time");
  const taskModalTitle = document.getElementById("task-modal-title");

  let editingTaskId = null;

  function openModal(mode = "add", task = null) {
    if (mode === "add") {
      editingTaskId = null;
      taskModalTitle.textContent = "Add New Task";
      taskNameInput.value = "";
      taskDetailInput.value = "";
      taskDueDateInput.value = "";
      taskDueTimeInput.value = "";
    } else if (mode === "edit" && task) {
      editingTaskId = task.id;
      taskModalTitle.textContent = "Edit Task";
      taskNameInput.value = task.name;
      taskDetailInput.value = task.detail || "";

      if (task.due) {
        const jk = new Date(new Date(task.due).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        taskDueDateInput.value = jk.toISOString().slice(0, 10);
        taskDueTimeInput.value = pad(jk.getHours()) + ":" + pad(jk.getMinutes());
      }
    }
    taskModalToggle.checked = true;
  }

  function closeModal() {
    taskModalToggle.checked = false;
  }

  openAddModalBtn.addEventListener("click", function () {
    openModal("add");
  });

  cancelTaskBtn.addEventListener("click", function () {
    closeModal();
  });

  // Save task
  // Save task
saveTaskBtn.addEventListener("click", function () {
  const name = taskNameInput.value.trim();
  const detail = taskDetailInput.value.trim();
  const date = taskDueDateInput.value;
  const time = taskDueTimeInput.value;

  if (!name) {
    alert("Nama task wajib diisi.");
    return;
  }

  let dueISO = null;
  if (date) {
    const t = time || "23:59";
    // langsung bikin string yyyy-mm-ddTHH:MM:00 di zona lokal
    dueISO = `${date}T${t}:00.000Z`; 
  }

  if (editingTaskId) {
    const idx = tasks.findIndex((t) => t.id === editingTaskId);
    if (idx !== -1) {
      tasks[idx].name = name;
      tasks[idx].detail = detail;
      tasks[idx].due = dueISO;
      if (tasks[idx].status !== "completed") tasks[idx].status = "pending";
    }
  } else {
    const id = "t_" + Date.now();
    tasks.push({
      id,
      name,
      detail,
      due: dueISO,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  saveTasks();
  closeModal();
});


  // Delete all
  document.getElementById("delete-all-btn").addEventListener("click", function () {
    if (!confirm("Yakin ingin menghapus semua task?")) return;
    tasks = [];
    saveTasks();
  });

  // Render tasks
  function renderTasks(filter = "all") {
    const nowUtc = Date.now();

    let total = tasks.length;
    let completed = 0;
    let pending = 0;
    let overdueCount = 0;

    const visibleTasks = tasks.filter((task) => {
      let isOverdue = false;
      if (task.due && task.status !== "completed") {
        const dueUtc = new Date(task.due).getTime();
        if (nowUtc > dueUtc) isOverdue = true;
      }
      task._isOverdue = isOverdue;

      if (task.status === "completed") completed++;
      else if (isOverdue) overdueCount++;
      else pending++;

      if (filter === "all") return true;
      if (filter === "pending") return task.status !== "completed" && !task._isOverdue;
      if (filter === "completed") return task.status === "completed";
      if (filter === "overdue") return task._isOverdue;
      return true;
    });

    todosBody.innerHTML = "";
    visibleTasks.forEach((task) => {
      const tr = document.createElement("tr");

      // Task column
      const tdTask = document.createElement("td");
      const title = document.createElement("div");
      title.className = "font-semibold";
      title.textContent = task.name;
      const detail = document.createElement("div");
      detail.className = "text-sm text-gray-500";
      detail.textContent = task.detail || "";
      tdTask.appendChild(title);
      tdTask.appendChild(detail);

      // Due column
      const tdDue = document.createElement("td");
      tdDue.className = "due-date-cell";
      if (task.due) {
        const d = new Date(task.due);
        const dateStr = d.toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const timeStr = d.toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        tdDue.innerHTML = `<div>${dateStr}</div><div class="text-sm text-gray-500">${timeStr}</div>`;
      } else {
        tdDue.textContent = "-";
      }

      // Status column
      const tdStatus = document.createElement("td");
      const statusSpan = document.createElement("span");
      statusSpan.className = "status-badge";
      if (task.status === "completed") {
        statusSpan.classList.add("status-complete");
        statusSpan.innerHTML = '<i class="bx bx-check-circle"></i>';
      } else if (task._isOverdue) {
        statusSpan.classList.add("status-overdue");
        statusSpan.innerHTML = '<i class="bx bx-error-circle"></i>';
      } else {
        statusSpan.classList.add("status-pending");
        statusSpan.innerHTML = '<i class="bx bx-time"></i>';
      }
      tdStatus.appendChild(statusSpan);

      // Actions column
      const tdActions = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-info mr-2";
      editBtn.innerHTML = '<i class="bx bx-edit"></i>';
      editBtn.addEventListener("click", function () {
        openModal("edit", task);
      });

      const finishBtn = document.createElement("button");
      finishBtn.className = "btn btn-sm btn-success mr-2";
      finishBtn.innerHTML = '<i class="bx bx-check"></i>';
      finishBtn.addEventListener("click", function () {
        const idx = tasks.findIndex((t) => t.id === task.id);
        if (idx !== -1) {
          tasks[idx].status = "completed";
          saveTasks();
        }
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-sm btn-error";
      deleteBtn.innerHTML = '<i class="bx bx-trash"></i>';
      deleteBtn.addEventListener("click", function () {
        if (!confirm("Hapus task ini?")) return;
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
      });

      tdActions.appendChild(editBtn);
      tdActions.appendChild(finishBtn);
      tdActions.appendChild(deleteBtn);

      tr.appendChild(tdTask);
      tr.appendChild(tdDue);
      tr.appendChild(tdStatus);
      tr.appendChild(tdActions);

      todosBody.appendChild(tr);
    });

    // Update counters
    totalCounter.textContent = total;
    completedCounter.textContent = completed;
    pendingCounter.textContent = pending;
    overdueCounter.textContent = overdueCount;

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    percentageDisplay.textContent = percent + "%";
    if (progressBar) {
      progressBar.style.width = percent + "%";
      progressBar.setAttribute("aria-valuenow", percent);
    }
  }

  // Init
  loadTasks();
  renderTasks();
})();
