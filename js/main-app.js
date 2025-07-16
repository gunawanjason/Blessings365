// Main application functionality for index.html

// Global variables
let selectedVerses = [];
let selectedVersesAddress = "";
let verseMenu, footer, selectionCount;

// Helper function to get current Bible version
function getCurrentVersion() {
  const selector = document.getElementById("translation-selector");
  return selector ? selector.value : "unknown";
}

// Verse selection and menu functionality
function initializeVerseSelection() {
  verseMenu = document.getElementById("verse-menu");
  footer = document.getElementById("main-footer");
  selectionCount = document.getElementById("selection-count");

  // Close verse menu when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".verse-div") && !e.target.closest("#verse-menu")) {
      if (verseMenu) verseMenu.style.display = "none";
      selectedVerses.forEach((verse) => {
        verse.classList.remove("verse-selected");
      });
      selectedVerses = [];
      updateFooterVisibility();
    }
  });

  // Handle verse click to show menu
  document.addEventListener("click", function (e) {
    const verseDiv = e.target.closest(".verse-div");
    if (verseDiv) {
      e.preventDefault();

      // Toggle selection
      if (selectedVerses.includes(verseDiv)) {
        verseDiv.classList.remove("verse-selected");
        selectedVerses = selectedVerses.filter((v) => v !== verseDiv);
      } else {
        verseDiv.classList.add("verse-selected");
        selectedVerses.push(verseDiv);
      }

      if (selectedVerses.length > 0) {
        const { formattedText, formattedHeader } = formatVerseSelection(selectedVerses);
        selectedVersesAddress = formattedHeader || "";
        resetCopyButton();
      }

      if (verseMenu) verseMenu.style.display = "none";
      updateFooterVisibility();
    }
  });
}

function updateFooterVisibility() {
  if (!footer || !selectionCount) return;

  const copyButton = document.getElementById("copy-verse");
  if (!copyButton) return;

  if (selectedVerses.length > 0) {
    footer.classList.add("show");
    copyButton.disabled = false;

    if (selectedVersesAddress) {
      selectionCount.textContent = selectedVersesAddress;
    } else {
      const count = selectedVerses.length;
      const verseText = count === 1 ? "verse" : "verses";
      selectionCount.textContent = `${count} ${verseText} selected`;
    }
  } else {
    footer.classList.remove("show");
    copyButton.disabled = true;
    selectionCount.textContent = "Select verses to copy";
  }
}

function formatVerseSelection(verses) {
  // Implementation for formatting selected verses
  // This would need to be implemented based on your existing logic
  return {
    formattedText: "",
    formattedHeader: ""
  };
}

function resetCopyButton() {
  const copyButton = document.getElementById("copy-verse");
  if (copyButton) {
    copyButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
      </svg>
      Copy
    `;
  }
}

// Initialize main application
function initializeMainApp() {
  // Initialize settings UI
  initializeSettingsUI();

  // Initialize scroll to top
  initScrollToTop();

  // Initialize verse selection
  initializeVerseSelection();

  // Load translated data and setup
  fetch("Translated_Bacaan_Alkitab_365.json")
    .then((response) => response.json())
    .then((translatedData) => {
      localStorage.setItem("translatedData", JSON.stringify(translatedData));

      populateMonthDayDropdowns(translatedData, fetchVerses);

      // Setup translation selector
      const translationSelector = document.getElementById("translation-selector");
      if (translationSelector) {
        translationSelector.addEventListener("change", (event) => {
          const selectedVersion = event.target.value;
          setCookie("selectedVersion", selectedVersion, 365);
          fetchVerses();

          if (typeof gtag === "function") {
            gtag("event", "select_content", {
              content_type: "bible_version",
              item_id: selectedVersion,
            });
          }
        });

        // Load saved version from cookie
        const savedVersion = getCookie("selectedVersion");
        if (savedVersion) {
          translationSelector.value = savedVersion;
        }
      }

      // Auto fetch verses when page loads
      fetchVerses();
    })
    .catch((error) => {
      console.error("Error fetching the Translated_Bacaan_Alkitab_365.json:", error);
    });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeMainApp);