// Date selector functionality

function populateMonthDayDropdowns(translatedData, onChangeCallback) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const monthSelector = document.getElementById("month-selector");
  const daySelector = document.getElementById("day-selector");

  monthNames.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index + 1;
    option.textContent = month;
    monthSelector.appendChild(option);
  });

  function fillDays() {
    daySelector.innerHTML = "";
    const selectedMonth = parseInt(monthSelector.value);
    const currentYear = new Date().getFullYear();
    if (isLeapYear(currentYear) && selectedMonth === 2) {
      daysInMonth[selectedMonth - 1] = 29;
    }
    for (let i = 1; i <= daysInMonth[selectedMonth - 1]; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      daySelector.appendChild(option);
    }
  }

  fillDays();

  monthSelector.addEventListener("change", (event) => {
    fillDays();
    if (onChangeCallback) onChangeCallback();

    // GA Event
    if (typeof gtag === "function") {
      gtag("event", "select_content", {
        content_type: "date_month",
        item_id: event.target.value,
        selected_version: getCurrentVersion ? getCurrentVersion() : "unknown",
      });
    }
  });

  daySelector.addEventListener("change", (event) => {
    if (translatedData) displayReferences(translatedData);
    if (onChangeCallback) onChangeCallback();

    // GA Event
    if (typeof gtag === "function") {
      gtag("event", "select_content", {
        content_type: "date_day",
        item_id: event.target.value,
        selected_version: getCurrentVersion ? getCurrentVersion() : "unknown",
      });
    }
  });

  // Set to today's date
  const today = new Date();
  monthSelector.value = today.getMonth() + 1;
  fillDays();
  daySelector.value = today.getDate();

  if (isLeapYear(today.getFullYear()) && today.getMonth() === 1 && today.getDate() === 29) {
    daySelector.value = 29;
  }

  if (translatedData) displayReferences(translatedData);
}

function displayReferences(translatedData) {
  const selectedMonth = parseInt(document.getElementById("month-selector").value);
  const selectedDay = parseInt(document.getElementById("day-selector").value);
  const date = new Date(new Date().getFullYear(), selectedMonth - 1, selectedDay);
  const dayOfYearValue = dayOfYear(date);
  const referencesDiv = document.getElementById("daily-references");
  if (referencesDiv) {
    referencesDiv.textContent = translatedData[dayOfYearValue].join(", ");
  }
}