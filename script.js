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
    }

    updateActiveButtonPosition();
  });

  updateActiveButtonPosition();
});
