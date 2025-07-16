// Settings UI functionality

// Font size controls
const fontSizeList = [0.8, 1, 1.2];

function getFontSizeClass(size) {
  if (size == fontSizeList[0]) {
    return "small-font-size";
  } else if (size == fontSizeList[1]) {
    return "medium-font-size";
  } else {
    return "large-font-size";
  }
}

// Initialize settings UI
function initializeSettingsUI() {
  // Initialize theme from localStorage
  const savedMode = localStorage.getItem("mode");
  const mode = savedMode || "light";
  document.documentElement.dataset.bsTheme = mode;

  // Initialize popover content
  const popoverContent = document.getElementById("popoverContent");
  if (mode === "dark" && popoverContent) {
    popoverContent.classList.add("dark-mode");
    const modeToggle = document.getElementById("mode-toggle");
    if (modeToggle) modeToggle.checked = true;
  }

  // Initialize font size
  window.fontSize = "medium-font-size";
  window.currentMode = mode;
  window.boldCopyEnabled = true;

  // Setup popover functionality
  setupPopover();

  // Setup font size slider
  setupFontSizeSlider();

  // Setup mode toggle
  setupModeToggle();

  // Setup bold copy toggle
  setupBoldCopyToggle();
}

function setupPopover() {
  const popoverBtn = document.getElementById("popoverBtn");
  const popoverContent = document.getElementById("popoverContent");

  if (!popoverBtn || !popoverContent) return;

  popoverBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    const isVisible = popoverContent.style.display === "block";

    if (isVisible) {
      popoverContent.style.display = "none";
      popoverContent.classList.remove("show");
    } else {
      // Position the popover relative to the button
      const btnRect = popoverBtn.getBoundingClientRect();
      const containerRect = popoverBtn.closest('.popover-container').getBoundingClientRect();

      // Calculate position relative to the container
      const leftOffset = btnRect.left - containerRect.left;
      const topOffset = btnRect.bottom - containerRect.top + 5; // 5px gap

      // Adjust for right edge of screen
      const popoverWidth = 280; // min-width from CSS
      const rightEdge = leftOffset + popoverWidth;
      const containerWidth = containerRect.width;

      let finalLeft = leftOffset;
      if (rightEdge > containerWidth) {
        finalLeft = containerWidth - popoverWidth;
      }

      popoverContent.style.left = finalLeft + "px";
      popoverContent.style.top = topOffset + "px";
      popoverContent.style.display = "block";
      setTimeout(() => popoverContent.classList.add("show"), 10);
    }
  });

  document.addEventListener("click", function (e) {
    if (!popoverContent.contains(e.target) && !popoverBtn.contains(e.target)) {
      popoverContent.style.display = "none";
      popoverContent.classList.remove("show");
    }
  });
}

function setupFontSizeSlider() {
  const fontSizeSlider = document.getElementById("font-size-slider");
  if (!fontSizeSlider) return;

  fontSizeSlider.addEventListener("input", function () {
    const value = parseInt(this.value);
    let newFontSize;

    switch (value) {
      case 1:
        newFontSize = "small-font-size";
        break;
      case 2:
        newFontSize = "medium-font-size";
        break;
      case 3:
        newFontSize = "large-font-size";
        break;
      default:
        newFontSize = "medium-font-size";
    }

    window.fontSize = newFontSize;

    // Update all verse divs
    const verseDivs = document.querySelectorAll(".verse-div");
    verseDivs.forEach(div => {
      div.className = div.className.replace(/\b(small|medium|large)-font-size\b/g, "");
      div.classList.add(newFontSize);
    });

    // Save to localStorage
    localStorage.setItem("fontSize", newFontSize);
  });

  // Load saved font size
  const savedFontSize = localStorage.getItem("fontSize");
  if (savedFontSize) {
    window.fontSize = savedFontSize;
    const sliderValue = savedFontSize === "small-font-size" ? 1 :
      savedFontSize === "large-font-size" ? 3 : 2;
    fontSizeSlider.value = sliderValue;
  }
}

function setupModeToggle() {
  const modeToggle = document.getElementById("mode-toggle");
  if (!modeToggle) return;

  modeToggle.addEventListener("change", function () {
    const newMode = this.checked ? "dark" : "light";
    window.currentMode = newMode;
    document.documentElement.dataset.bsTheme = newMode;
    localStorage.setItem("mode", newMode);

    const popoverContent = document.getElementById("popoverContent");
    if (popoverContent) {
      if (newMode === "dark") {
        popoverContent.classList.add("dark-mode");
      } else {
        popoverContent.classList.remove("dark-mode");
      }
    }
  });
}

function setupBoldCopyToggle() {
  const boldCopyToggle = document.getElementById("bold-copy-toggle");
  if (!boldCopyToggle) return;

  // Load saved setting
  const savedBoldCopy = localStorage.getItem("boldCopyEnabled");
  if (savedBoldCopy !== null) {
    window.boldCopyEnabled = savedBoldCopy === "true";
    boldCopyToggle.checked = window.boldCopyEnabled;
  }

  boldCopyToggle.addEventListener("change", function () {
    window.boldCopyEnabled = this.checked;
    localStorage.setItem("boldCopyEnabled", window.boldCopyEnabled.toString());
  });
}