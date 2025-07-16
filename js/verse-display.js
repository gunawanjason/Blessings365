// Verse display functionality

function displayVerses(data, translation, fontSize = "medium-font-size") {
  const outputDiv = document.getElementById("verses-output");
  outputDiv.innerHTML = "";

  const accordionDiv = document.createElement("div");
  accordionDiv.classList.add("accordion", "accordion-flush");
  accordionDiv.setAttribute("id", "versesAccordion");
  outputDiv.appendChild(accordionDiv);

  let currentBook = "";
  let currentItem, currentBody;
  let startVerse = "";
  let prevVerse = "";
  let prevButton;

  for (const verseData of data) {
    let bookName = verseData.book;

    if (bookName !== currentBook) {
      currentItem = document.createElement("div");
      currentItem.classList.add("accordion-item");
      accordionDiv.appendChild(currentItem);

      let currentHeader = document.createElement("h2");
      currentHeader.classList.add("accordion-header");
      currentHeader.setAttribute("id", formatBookName(bookName) + "-heading");
      currentItem.appendChild(currentHeader);

      let currentButton = document.createElement("button");
      currentButton.className = "accordion-button collapsed";
      currentButton.type = "button";
      currentButton.setAttribute("data-bs-toggle", "collapse");
      currentButton.setAttribute("data-bs-target", "#" + formatBookName(bookName) + "-collapse");
      currentButton.setAttribute("aria-expanded", "false");
      currentButton.setAttribute("aria-controls", formatBookName(bookName) + "-collapse");
      currentButton.setAttribute("id", formatBookName(bookName) + "-button");
      currentButton.textContent = bookName;
      currentHeader.appendChild(currentButton);

      let currentCollapse = document.createElement("div");
      currentCollapse.className = "accordion-collapse collapse";
      currentCollapse.setAttribute("id", formatBookName(bookName) + "-collapse");
      currentCollapse.setAttribute("aria-labelledby", formatBookName(bookName) + "-heading");
      currentItem.appendChild(currentCollapse);

      currentBody = document.createElement("div");
      currentBody.className = "accordion-body";
      currentCollapse.appendChild(currentBody);

      if (currentBook) {
        prevButton = document.getElementById(formatBookName(currentBook) + "-button");
        if (translation === "TB" && englishToIndonesianBooks[currentBook]) {
          currentBook = englishToIndonesianBooks[currentBook];
        } else if (
          (translation === "CNVS" || translation === "CUNPSS-上帝" || translation === "CUNPSS-神") &&
          englishToChineseBooks[currentBook]
        ) {
          currentBook = englishToChineseBooks[currentBook];
        }

        if (startVerse.split(":")[0] === prevVerse.split(":")[0]) {
          prevVerse = prevVerse.split(":")[1];
        }

        prevButton.textContent = `${currentBook} ${startVerse}-${prevVerse}`;
      }

      currentBook = bookName;
      startVerse = `${verseData.chapter}:${verseData.verse}`;
    }

    if (translation === "TB" && englishToIndonesianBooks[bookName]) {
      bookName = englishToIndonesianBooks[bookName];
    } else if (
      (translation === "CNVS" || translation === "CUNPSS-上帝" || translation === "CUNPSS-神") &&
      englishToChineseBooks[bookName]
    ) {
      bookName = englishToChineseBooks[bookName];
    }

    const verseDiv = document.createElement("div");
    verseDiv.className = `verse-div ${fontSize}`;
    verseDiv.innerHTML = `<strong><sup>${verseData.chapter}:${verseData.verse}</sup></strong> ${verseData.content}`;
    currentBody.appendChild(verseDiv);

    prevVerse = `${verseData.chapter}:${verseData.verse}`;
  }

  // Update accordion item title for last book
  if (currentBook) {
    prevButton = document.getElementById(formatBookName(currentBook) + "-button");
    if (translation === "TB" && englishToIndonesianBooks[currentBook]) {
      currentBook = englishToIndonesianBooks[currentBook];
    } else if (
      (translation === "CNVS" || translation === "CUNPSS-上帝" || translation === "CUNPSS-神") &&
      englishToChineseBooks[currentBook]
    ) {
      currentBook = englishToChineseBooks[currentBook];
    }

    if (startVerse.split(":")[0] === prevVerse.split(":")[0]) {
      prevVerse = prevVerse.split(":")[1];
    }

    prevButton.textContent = `${currentBook} ${startVerse}-${prevVerse}`;
  }
}

function fetchVerses(translationSelector = "translation-selector") {
  const translatedData = JSON.parse(localStorage.getItem("translatedData"));
  const translation = document.getElementById(translationSelector).value;
  const selectedMonth = parseInt(document.getElementById("month-selector").value);
  const selectedDay = parseInt(document.getElementById("day-selector").value);
  const date = new Date(new Date().getFullYear(), selectedMonth - 1, selectedDay);
  const verses = translatedData[dayOfYear(date)].join(",");

  const outputDiv = document.getElementById("verses-output");
  outputDiv.innerHTML = `
    <div class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  const apiUrl = `https://api.blessings365.top/${translation}/multiple?verses=${encodeURIComponent(verses)}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => displayVerses(data, translation, window.fontSize || "medium-font-size"))
    .catch((error) => {
      console.error("Error fetching verses:", error);
      outputDiv.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Error loading verses. Please try again.
        </div>
      `;
    });
}