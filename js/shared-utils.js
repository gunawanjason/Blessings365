// Shared utility functions and constants

// Book name translations
const englishToIndonesianBooks = {
  Genesis: "Kejadian",
  Exodus: "Keluaran",
  Leviticus: "Imamat",
  Numbers: "Bilangan",
  Deuteronomy: "Ulangan",
  Joshua: "Yosua",
  Judges: "Hakim-Hakim",
  Ruth: "Rut",
  "1 Samuel": "1 Samuel",
  "2 Samuel": "2 Samuel",
  "1 Kings": "1 Raja-Raja",
  "2 Kings": "2 Raja-Raja",
  "1 Chronicles": "1 Tawarikh",
  "2 Chronicles": "2 Tawarikh",
  Ezra: "Ezra",
  Nehemiah: "Nehemia",
  Esther: "Ester",
  Job: "Ayub",
  Psalms: "Mazmur",
  Proverbs: "Amsal",
  Ecclesiastes: "Pengkhotbah",
  "Song of Solomon": "Kidung Agung",
  Isaiah: "Yesaya",
  Jeremiah: "Yeremia",
  Lamentations: "Ratapan",
  Ezekiel: "Yehezkiel",
  Daniel: "Daniel",
  Hosea: "Hosea",
  Joel: "Yoel",
  Amos: "Amos",
  Obadiah: "Obaja",
  Jonah: "Yunus",
  Micah: "Mikha",
  Nahum: "Nahum",
  Habakkuk: "Habakuk",
  Zephaniah: "Zefanya",
  Haggai: "Hagai",
  Zechariah: "Zakharia",
  Malachi: "Maleakhi",
  Matthew: "Matius",
  Mark: "Markus",
  Luke: "Lukas",
  John: "Yohanes",
  Acts: "Kisah Para Rasul",
  Romans: "Roma",
  "1 Corinthians": "1 Korintus",
  "2 Corinthians": "2 Korintus",
  Galatians: "Galatia",
  Ephesians: "Efesus",
  Philippians: "Filipi",
  Colossians: "Kolose",
  "1 Thessalonians": "1 Tesalonika",
  "2 Thessalonians": "2 Tesalonika",
  "1 Timothy": "1 Timotius",
  "2 Timothy": "2 Timotius",
  Titus: "Titus",
  Philemon: "Filemon",
  Hebrews: "Ibrani",
  James: "Yakobus",
  "1 Peter": "1 Petrus",
  "2 Peter": "2 Petrus",
  "1 John": "1 Yohanes",
  "2 John": "2 Yohanes",
  "3 John": "3 Yohanes",
  Jude: "Yudas",
  Revelation: "Wahyu",
};

const englishToChineseBooks = {
  Genesis: "创世纪",
  Exodus: "出埃及记",
  Leviticus: "利未记",
  Numbers: "民数记",
  Deuteronomy: "申命记",
  Joshua: "约书亚记",
  Judges: "士师记",
  Ruth: "路得记",
  "1 Samuel": "撒母耳记上",
  "2 Samuel": "撒母耳记下",
  "1 Kings": "列王记上",
  "2 Kings": "列王记下",
  "1 Chronicles": "历代志上",
  "2 Chronicles": "历代志下",
  Ezra: "以斯拉记",
  Nehemiah: "尼希米记",
  Esther: "以斯帖记",
  Job: "约伯记",
  Psalms: "诗篇",
  Proverbs: "箴言",
  Ecclesiastes: "传道书",
  "Song of Solomon": "雅歌",
  Isaiah: "以赛亚书",
  Jeremiah: "耶利米书",
  Lamentations: "耶利米哀歌",
  Ezekiel: "以西结书",
  Daniel: "但以理书",
  Hosea: "何西阿书",
  Joel: "约珥书",
  Amos: "阿摩司书",
  Obadiah: "俄巴底亚书",
  Jonah: "约拿书",
  Micah: "弥迦书",
  Nahum: "那鸿书",
  Habakkuk: "哈巴谷书",
  Zephaniah: "西番雅书",
  Haggai: "哈该书",
  Zechariah: "撒迦利亚书",
  Malachi: "玛拉基书",
  Matthew: "马太福音",
  Mark: "马可福音",
  Luke: "路加福音",
  John: "约翰福音",
  Acts: "使徒行传",
  Romans: "罗马书",
  "1 Corinthians": "歌林多前书",
  "2 Corinthians": "歌林多后书",
  Galatians: "加拉太书",
  Ephesians: "以弗所书",
  Philippians: "腓利比书",
  Colossians: "歌罗西书",
  "1 Thessalonians": "帖撒罗尼迦前书",
  "2 Thessalonians": "帖撒罗尼迦后书",
  "1 Timothy": "提摩太前书",
  "2 Timothy": "提摩太后书",
  Titus: "提多书",
  Philemon: "腓利门书",
  Hebrews: "希伯来书",
  James: "雅各书",
  "1 Peter": "彼得前书",
  "2 Peter": "彼得后书",
  "1 John": "约翰一书",
  "2 John": "约翰二书",
  "3 John": "约翰三书",
  Jude: "犹大书",
  Revelation: "启示录",
};

// Date utility functions
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date -
    start +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  let day = Math.floor(diff / oneDay);

  // Adjust day count in leap years after February 29
  if (
    isLeapYear(date.getFullYear()) &&
    ((date.getMonth() === 1 && date.getDate() === 29) ||
      date.getMonth() > 1)
  ) {
    day -= 1;
  }

  return day;
}

// Cookie management
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// Book name formatting
function formatBookName(bookName) {
  const words = bookName.split(" ");
  const nonNumericParts = [];
  const numericParts = [];

  for (const word of words) {
    if (isNaN(word)) {
      nonNumericParts.push(word);
    } else {
      numericParts.push(word);
    }
  }

  return nonNumericParts.join("-").toLowerCase() + numericParts.join("");
}

// Scroll to top functionality
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Initialize scroll to top button
function initScrollToTop() {
  document.addEventListener("DOMContentLoaded", function () {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    let scrollTimeout;

    if (!scrollToTopBtn) return;

    window.addEventListener("scroll", function () {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      if (document.documentElement.scrollTop > 100) {
        scrollToTopBtn.classList.add("visible");
        scrollTimeout = setTimeout(function () {
          scrollToTopBtn.classList.remove("visible");
        }, 3000);
      } else {
        scrollToTopBtn.classList.remove("visible");
      }
    });
  });
}