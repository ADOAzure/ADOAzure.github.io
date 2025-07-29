document.addEventListener("DOMContentLoaded", () => {
  const completeBtn = document.getElementById("globalCompleteBtn");

  function updateActiveButtonPosition() {
    completeBtn.classList.add("d-none"); // Hide initially

    const activeRow = document.querySelector('.task-row[data-status="active"]');
    if (!activeRow) return;

    const buttonCell = activeRow.querySelector(".task-action-cell");
    if (buttonCell) {
      buttonCell.innerHTML = "";
      buttonCell.appendChild(completeBtn);
      completeBtn.classList.remove("d-none");
    }
  }

  completeBtn.addEventListener("click", () => {
    const currentRow = document.querySelector('.task-row[data-status="active"]');
    if (!currentRow) return;

    // Mark current as complete
    const icon = currentRow.children[1].querySelector("i");
    icon.className = "fas fa-check-circle status-blue";
    currentRow.dataset.status = "complete";

    // Save completed tasks
    localStorage.setItem("completedTasks", JSON.stringify(
      [...document.querySelectorAll('.task-row[data-status="complete"]')]
        .map(row => row.dataset.taskId)
    ));

    // Promote next
    const allRows = Array.from(document.querySelectorAll(".task-row"));
    const currentIndex = allRows.indexOf(currentRow);
    let nextRow = null;

    for (let i = currentIndex + 1; i < allRows.length; i++) {
      if (allRows[i].dataset.status === "pending") {
        nextRow = allRows[i];
        break;
      }
    }

    if (nextRow) {
      nextRow.dataset.status = "active";
      const nextIcon = nextRow.children[1].querySelector("i");
      nextIcon.classList.remove("fa-circle", "status-grey");
      nextIcon.classList.add("fa-arrow-right", "status-green");

      // Save active task
      localStorage.setItem("activeTaskId", nextRow.dataset.taskId);
    }

    updateActiveButtonPosition();
  });

  function restoreState() {
    const completed = JSON.parse(localStorage.getItem("completedTasks") || "[]");
    const active = localStorage.getItem("activeTaskId");

    const allRows = document.querySelectorAll(".task-row");
    allRows.forEach(row => {
      const icon = row.children[1].querySelector("i");
      const taskId = row.dataset.taskId;

      if (completed.includes(taskId)) {
        row.dataset.status = "complete";
        icon.className = "fas fa-check-circle status-blue";
      } else if (taskId === active) {
        row.dataset.status = "active";
        icon.className = "fas fa-arrow-right status-green";
      } else {
        row.dataset.status = "pending";
        icon.className = "fas fa-circle status-grey";
      }
    });

    updateActiveButtonPosition();
  }

  restoreState();

  const resetBtn = document.getElementById("resetProgressBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem("completedTasks");
      localStorage.removeItem("activeTaskId");

      const allRows = document.querySelectorAll(".task-row");
      allRows.forEach((row, index) => {
        const icon = row.children[1].querySelector("i");
        if (index === 0) {
          row.dataset.status = "active";
          icon.className = "fas fa-arrow-right status-green";
        } else {
          row.dataset.status = "pending";
          icon.className = "fas fa-circle status-grey";
        }
      });

      updateActiveButtonPosition();
    });
  }
});
