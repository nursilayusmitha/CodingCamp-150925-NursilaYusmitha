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
        updateProgressStats();
        renderTasks();
      }

      // DOM elements
      const todosBody = document.querySelector(".todos-list-body");
      const totalCounter = document.querySelector(".total-counter");
      const completedCounter = document.querySelector(".completed-counter");
      const pendingCounter = document.querySelector(".pending-counter");
      const overdueCounter = document.querySelector(".overdue-counter");
      const percentageDisplay = document.querySelector(".percentage-display");
      
      // Mobile counter elements
      const totalCounterMobile = document.querySelector(".total-counter-mobile");
      const completedCounterMobile = document.querySelector(".completed-counter-mobile");
      const pendingCounterMobile = document.querySelector(".pending-counter-mobile");
      const overdueCounterMobile = document.querySelector(".overdue-counter-mobile");
      const percentageDisplayMobile = document.querySelector(".percentage-display-mobile");

      // Modal elements
      const taskModalToggle = document.getElementById("task-modal-toggle");
      const openAddModalBtn = document.getElementById("open-add-modal-btn");
      const saveTaskBtn = document.getElementById("save-task-btn");

      const taskNameInput = document.getElementById("task-name");
      const taskDetailInput = document.getElementById("task-detail");
      const taskDueDateInput = document.getElementById("task-due-date");
      const taskDueTimeInput = document.getElementById("task-due-time");
      const taskModalTitle = document.getElementById("task-modal-title");

      // Delete modal elements
      const deleteConfirmModal = document.getElementById("delete-confirm-modal");
      const deleteMessage = document.getElementById("delete-message");
      const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
      
      // Success modal elements
      const successModal = document.getElementById("success-modal");
      const successMessage = document.getElementById("success-message");

      let editingTaskId = null;
      let currentFilter = "all";
      let currentSearchKeyword = "";
      let currentSort = "dueDate";
      let deleteType = null; // 'all' or 'single'
      let taskToDelete = null;

      // Search
      document.getElementById("search-input").addEventListener("input", function (e) {
        currentSearchKeyword = e.target.value.toLowerCase();
        renderTasks();
      });

      // Filter
      document.querySelectorAll("[data-filter]").forEach((el) => {
        el.addEventListener("click", () => {
          currentFilter = el.getAttribute("data-filter");
          renderTasks();
        });
      });

      // Sort
      document.querySelectorAll("[data-sort]").forEach((el) => {
        el.addEventListener("click", () => {
          currentSort = el.getAttribute("data-sort");
          renderTasks();
        });
      });

      function openModal(mode = "add", task = null) {
        if (mode === "add") {
          editingTaskId = null;
          taskModalTitle.textContent = "Add New Task";
          taskNameInput.value = "";
          taskDetailInput.value = "";
          
          // Set default due date to today and time to 23:59
          const today = new Date();
          taskDueDateInput.value = today.toISOString().split('T')[0];
          taskDueTimeInput.value = "23:59";
        } else if (mode === "edit" && task) {
          editingTaskId = task.id;
          taskModalTitle.textContent = "Edit Task";
          taskNameInput.value = task.name;
          taskDetailInput.value = task.detail || "";

          if (task.due) {
            const jk = new Date(new Date(task.due).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
            taskDueDateInput.value = jk.toISOString().slice(0, 10);
            taskDueTimeInput.value = pad(jk.getHours()) + ":" + pad(jk.getMinutes());
          } else {
            taskDueDateInput.value = "";
            taskDueTimeInput.value = "";
          }
        }
        // PERUBAHAN: Menampilkan modal dengan mengatur checked state
        taskModalToggle.checked = true;
      }

      function closeModal() {
        taskModalToggle.checked = false;
      }

      openAddModalBtn.addEventListener("click", function () {
        openModal("add");
      });

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
          // Create date in local timezone but store as ISO string
          const localDate = new Date(`${date}T${t}`);
          dueISO = localDate.toISOString();
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
        
        // Show success message
        successMessage.textContent = "Task has been " + (editingTaskId ? "updated" : "added") + " successfully.";
        successModal.checked = true;
      });

      // Delete all
      document.getElementById("delete-all-btn").addEventListener("click", function () {
        if (tasks.length === 0) {
          successMessage.textContent = "No tasks to delete.";
          successModal.checked = true;
          return;
        }
        
        deleteType = "all";
        deleteMessage.textContent = "Are you sure you want to delete ALL tasks? This action cannot be undone.";
        deleteConfirmModal.checked = true;
      });

      // Confirm delete button handler
      confirmDeleteBtn.addEventListener("click", function() {
        if (deleteType === "all") {
          tasks = [];
          saveTasks();
          successMessage.textContent = "All tasks have been deleted successfully.";
        } else if (deleteType === "single" && taskToDelete) {
          tasks = tasks.filter((t) => t.id !== taskToDelete);
          saveTasks();
          successMessage.textContent = "Task has been deleted successfully.";
        }
        
        // Close delete modal and show success modal
        deleteConfirmModal.checked = false;
        successModal.checked = true;
        
        // Reset delete state
        deleteType = null;
        taskToDelete = null;
      });

      // Update progress stats
      function updateProgressStats() {
        const nowUtc = Date.now();
        
        let total = tasks.length;
        let completed = 0;
        let pending = 0;
        let overdueCount = 0;

        tasks.forEach((task)=>{
          let isOverdue = false;
          if (task.due && task.status !== "completed") {
            const dueUtc = new Date(task.due).getTime();
            if (nowUtc > dueUtc) isOverdue = true;
          }

          if (task.status === "completed") completed++;
          else if (isOverdue) overdueCount++;
          else pending++;
        });

        // Update desktop counters
        totalCounter.textContent = total;
        completedCounter.textContent = completed;
        pendingCounter.textContent = pending;
        overdueCounter.textContent = overdueCount;

        // Update mobile counters
        totalCounterMobile.textContent = total;
        completedCounterMobile.textContent = completed;
        pendingCounterMobile.textContent = pending;
        overdueCounterMobile.textContent = overdueCount;

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        percentageDisplay.textContent = percent + "%";
        percentageDisplayMobile.textContent = percent + "%";
      }

      // Helper functions for sorting
      function getDueDateStatusWeight(task) {
        if (task.status === 'completed') return 2;
        if (task._isOverdue) return 1;
        return 0;
      }

      function getStatusWeight(task) {
        if (task.status === 'completed') return 2;
        if (task._isOverdue) return 1;
        return 0;
      }

      // Render tasks
      function renderTasks() {
        const nowUtc = Date.now();

        // Apply filter and search
        let visibleTasks = tasks.filter((task) => {
          let isOverdue = false;
          if (task.due && task.status !== "completed") {
            const dueUtc = new Date(task.due).getTime();
            if (nowUtc > dueUtc) isOverdue = true;
          }
          task._isOverdue = isOverdue;

          // Apply filter
          if (currentFilter === "pending" && (task.status === "completed" || isOverdue)) return false;
          if (currentFilter === "completed" && task.status !== "completed") return false;
          if (currentFilter === "overdue" && !isOverdue) return false;

          // Apply search
          if (currentSearchKeyword && 
              !(task.name.toLowerCase().includes(currentSearchKeyword) || 
                (task.detail || "").toLowerCase().includes(currentSearchKeyword))) {
            return false;
          }

          return true;
        });

        // Apply sorting
        visibleTasks.sort((a, b) => {
          if (currentSort === "name") {
            return a.name.localeCompare(b.name);
          } else if (currentSort === "dueDate") {
            // Sort by due date with custom ordering: pending, completed, overdue
            const weightA = getDueDateStatusWeight(a);
            const weightB = getDueDateStatusWeight(b);
            
            if (weightA !== weightB) {
              return weightA - weightB;
            }
            
            // If same status, sort by due date
            if (!a.due && !b.due) return 0;
            if (!a.due) return 1;
            if (!b.due) return -1;
            return new Date(a.due) - new Date(b.due);
          } else if (currentSort === "status") {
            // Sort by status: pending, overdue, completed
            const weightA = getStatusWeight(a);
            const weightB = getStatusWeight(b);
            
            if (weightA !== weightB) {
              return weightA - weightB;
            }
            
            // If same status, sort by due date
            if (!a.due && !b.due) return 0;
            if (!a.due) return 1;
            if (!b.due) return -1;
            return new Date(a.due) - new Date(b.due);
          }
          return 0;
        });

        todosBody.innerHTML = "";
        
        // Show empty state if no tasks
        if (visibleTasks.length === 0) {
          const emptyRow = document.createElement("tr");
          emptyRow.innerHTML = `
            <td colspan="5" class="empty-state">
              <i class="bx bx-clipboard"></i>
              <h3 class="text-lg font-semibold">No tasks found</h3>
              <p>
                ${currentFilter !== "all" ? `No tasks with status "${currentFilter}"` : "No tasks available. Add a new task to get started!"}
              </p>
            </td>
          `;
          todosBody.appendChild(emptyRow);
          return;
        }

        visibleTasks.forEach((task) => {
          const tr = document.createElement("tr");

          // Task column
          const tdTask = document.createElement("td");
          const title = document.createElement("div");
          title.className = "font-semibold";
          title.textContent = task.name;
          tdTask.appendChild(title);

          // Detail column
          const tdDetail = document.createElement("td");
          tdDetail.textContent = task.detail || "-";

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
            statusSpan.innerHTML = '<i class="bx bx-check-circle"></i> Completed';
          } else if (task._isOverdue) {
            statusSpan.classList.add("status-overdue");
            statusSpan.innerHTML = '<i class="bx bx-error-circle"></i> Overdue';
          } else {
            statusSpan.classList.add("status-pending");
            statusSpan.innerHTML = '<i class="bx bx-time"></i> Pending';
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
              successMessage.textContent = "Task marked as completed.";
              successModal.checked = true;
            }
          });

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "btn btn-sm btn-error";
          deleteBtn.innerHTML = '<i class="bx bx-trash"></i>';
          deleteBtn.addEventListener("click", function () {
            deleteType = "single";
            taskToDelete = task.id;
            deleteMessage.textContent = "Are you sure you want to delete this task?";
            deleteConfirmModal.checked = true;
          });

          tdActions.appendChild(editBtn);
          if (task.status !== "completed") {
            tdActions.appendChild(finishBtn);
          }
          tdActions.appendChild(deleteBtn);

          tr.appendChild(tdTask);
          tr.appendChild(tdDetail);
          tr.appendChild(tdDue);
          tr.appendChild(tdStatus);
          tr.appendChild(tdActions);

          todosBody.appendChild(tr);
        });
      }

      // Keyboard shortcuts
      document.addEventListener("keydown", function (e) {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case "n":
              e.preventDefault();
              openModal("add");
              break;
            case "f":
              e.preventDefault();
              document.getElementById("search-input").focus();
              break;
            case "a":
              e.preventDefault();
              currentFilter = "all";
              renderTasks();
              break;
          }
        } else if (e.key === "Escape") {
          closeModal();
        }
      });

      // Init
      loadTasks();
      updateProgressStats();
      renderTasks();
    })();