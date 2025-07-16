// Compare page specific functionality

let translatedData = {};
let isAccordionSyncing = false;
let isAligningDOM = false;

function displayCompareVerses(data, translation, panelNumber) {
  const outputDiv = document.getElementById(`verses-output-${panelNumber}`);
  const headerDiv = document.getElementById(`version-${panelNumber}-header`);

  outputDiv.innerHTML = "";
  headerDiv.textContent = translation;

  const accordionDiv = document.createElement("div");
  accordionDiv.classList.add("accordion", "accordion-flush");
  accordionDiv.setAttribute("id", `versesAccordion${panelNumber}`);
  outputDiv.appendChild(accordionDiv);

  let currentBookDisplay = "";
  let currentBookOriginalForId = "";
  let currentItem, currentBody;
  let startVerse = "";
  let prevVerse = "";
  let prevAccordionButton = null;
  let prevBookDisplayTitle = "";
  let prevBookStartVerse = "";
  let prevBookLastVerse = "";

  for (const verseData of data) {
    const bookName = verseData.book;

    if (bookName !== currentBookDisplay) {
      // Update previous book's accordion title
      if (prevAccordionButton) {
        const formattedRange = prevBookStartVerse === prevBookLastVerse ?
          prevBookStartVerse :
          (prevBookStartVerse.split(":")[0] === prevBookLastVerse.split(":")[0] ?
            `${prevBookStartVerse}-${prevBookLastVerse.split(":")[1]}` :
            `${prevBookStartVerse}-${prevBookLastVerse}`);
        prevAccordionButton.textContent = `${prevBookDisplayTitle} ${formattedRange}`;
      }

      // Create new accordion item
      currentItem = document.createElement("div");
      currentItem.classList.add("accordion-item");
      accordionDiv.appendChild(currentItem);

      let currentHeader = document.createElement("h2");
      currentHeader.classList.add("accordion-header");
      currentHeader.setAttribute("id", formatBookName(bookName) + `-heading-${panelNumber}`);
      currentItem.appendChild(currentHeader);

      let currentButton = document.createElement("button");
      currentButton.className = "accordion-button collapsed";
      currentButton.type = "button";
      currentButton.setAttribute("data-bs-toggle", "collapse");
      currentButton.setAttribute("data-bs-target", "#" + formatBookName(bookName) + `-collapse-${panelNumber}`);
      currentButton.setAttribute("aria-expanded", "false");
      currentButton.setAttribute("aria-controls", formatBookName(bookName) + `-collapse-${panelNumber}`);
      currentButton.setAttribute("id", formatBookName(bookName) + `-button-${panelNumber}`);
      currentButton.textContent = bookName;
      currentHeader.appendChild(currentButton);

      let currentCollapse = document.createElement("div");
      currentCollapse.className = "accordion-collapse collapse";
      currentCollapse.setAttribute("id", formatBookName(bookName) + `-collapse-${panelNumber}`);
      currentCollapse.setAttribute("aria-labelledby", formatBookName(bookName) + `-heading-${panelNumber}`);
      currentItem.appendChild(currentCollapse);

      currentBody = document.createElement("div");
      currentBody.className = "accordion-body";
      currentCollapse.appendChild(currentBody);

      // Set up for new book
      currentBookDisplay = bookName;
      currentBookOriginalForId = bookName;
      startVerse = `${verseData.chapter}:${verseData.verse}`;

      // Store previous book info for title update
      prevAccordionButton = currentButton;
      prevBookDisplayTitle = getTranslatedBookName(bookName, translation);
      prevBookStartVerse = startVerse;
    }

    const verseDiv = document.createElement("div");
    verseDiv.className = `verse-div ${window.fontSize || "medium-font-size"}`;
    verseDiv.innerHTML = `<strong><sup>${verseData.chapter}:${verseData.verse}</sup></strong> ${verseData.content}`;
    currentBody.appendChild(verseDiv);

    prevVerse = `${verseData.chapter}:${verseData.verse}`;
    prevBookLastVerse = prevVerse;
  }

  // Update the last book's title
  if (prevAccordionButton) {
    const formattedRange = prevBookStartVerse === prevBookLastVerse ?
      prevBookStartVerse :
      (prevBookStartVerse.split(":")[0] === prevBookLastVerse.split(":")[0] ?
        `${prevBookStartVerse}-${prevBookLastVerse.split(":")[1]}` :
        `${prevBookStartVerse}-${prevBookLastVerse}`);
    prevAccordionButton.textContent = `${prevBookDisplayTitle} ${formattedRange}`;
  }
}

function getTranslatedBookName(bookName, translation) {
  if (translation === "TB" && englishToIndonesianBooks[bookName]) {
    return englishToIndonesianBooks[bookName];
  } else if (
    (translation === "CNVS" || translation === "CUNPSS-上帝" || translation === "CUNPSS-神") &&
    englishToChineseBooks[bookName]
  ) {
    return englishToChineseBooks[bookName];
  }
  return bookName;
}

function fetchBothVersions() {
  const translation1 = document.getElementById("translation-selector-1").value;
  const translation2 = document.getElementById("translation-selector-2").value;

  const selectedMonth = parseInt(document.getElementById("month-selector").value);
  const selectedDay = parseInt(document.getElementById("day-selector").value);
  const date = new Date(new Date().getFullYear(), selectedMonth - 1, selectedDay);
  const verses = translatedData[dayOfYear(date)].join(",");

  // Show loading indicators
  document.getElementById("verses-output-1").innerHTML = `
    <div class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  document.getElementById("verses-output-2").innerHTML = `
    <div class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  const apiUrl1 = `https://api.blessings365.top/${translation1}/multiple?verses=${encodeURIComponent(verses)}`;
  const apiUrl2 = `https://api.blessings365.top/${translation2}/multiple?verses=${encodeURIComponent(verses)}`;

  Promise.all([
    fetch(apiUrl1).then(response => response.json()),
    fetch(apiUrl2).then(response => response.json())
  ])
    .then(([data1, data2]) => {
      displayCompareVerses(data1, translation1, 1);
      displayCompareVerses(data2, translation2, 2);

      // Synchronize accordion heights after both are loaded
      setTimeout(() => {
        synchronizeVerseHeights();
      }, 100);
    })
    .catch((error) => {
      console.error("Error fetching verses:", error);
      document.getElementById("verses-output-1").innerHTML = `
      <div class="alert alert-danger" role="alert">
        Error loading verses. Please try again.
      </div>
    `;
      document.getElementById("verses-output-2").innerHTML = `
      <div class="alert alert-danger" role="alert">
        Error loading verses. Please try again.
      </div>
    `;
    });
}

function synchronizeVerseHeights() {
  try {
    isAligningDOM = true;

    const accordion1 = document.getElementById("versesAccordion1");
    const accordion2 = document.getElementById("versesAccordion2");

    if (!accordion1 || !accordion2) return;

    const items1 = accordion1.querySelectorAll(".accordion-item");
    const items2 = accordion2.querySelectorAll(".accordion-item");

    const minLength = Math.min(items1.length, items2.length);

    for (let i = 0; i < minLength; i++) {
      const header1 = items1[i].querySelector(".accordion-header");
      const header2 = items2[i].querySelector(".accordion-header");

      if (header1 && header2) {
        header1.style.minHeight = "auto";
        header2.style.minHeight = "auto";

        const height1 = header1.offsetHeight;
        const height2 = header2.offsetHeight;
        const maxHeight = Math.max(height1, height2);

        header1.style.minHeight = maxHeight + "px";
        header2.style.minHeight = maxHeight + "px";
      }
    }
  } finally {
    isAligningDOM = false;
  }
}

function initializeCompare() {
  // Load translated data
  fetch("Translated_Bacaan_Alkitab_365.json")
    .then((response) => response.json())
    .then((data) => {
      translatedData = data;
      localStorage.setItem("translatedData", JSON.stringify(data));

      populateMonthDayDropdowns(data, fetchBothVersions);

      // Setup translation selectors
      document.getElementById("translation-selector-1").addEventListener("change", (event) => {
        fetchBothVersions();
        if (typeof gtag === "function") {
          gtag("event", "select_content", {
            content_type: "bible_version",
            item_id: event.target.value + "_compare_1",
          });
        }
      });

      document.getElementById("translation-selector-2").addEventListener("change", (event) => {
        fetchBothVersions();
        if (typeof gtag === "function") {
          gtag("event", "select_content", {
            content_type: "bible_version",
            item_id: event.target.value + "_compare_2",
          });
        }
      });

      // Initial fetch
      fetchBothVersions();
    })
    .catch((error) => {
      console.error("Error fetching the Translated_Bacaan_Alkitab_365.json:", error);
    });
}