const STATE = {
  search: "",
  subject: "all",
  sort: "subject", 
};

let DATA = [];

document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error("bad response");
    DATA = await res.json();
    buildSubjectOptions();
    attachListeners();
    render();
  } catch (err) {
    showLoadError();
  }
}

function buildSubjectOptions() {
  const select = document.getElementById("subject-filter");
  const subjects = [...new Set(DATA.map((d) => d.subject))].sort((a, b) =>
    a.localeCompare(b, "ru")
  );
  subjects.forEach((subject) => {
    const opt = document.createElement("option");
    opt.value = subject;
    opt.textContent = subject;
    select.appendChild(opt);
  });
}

function attachListeners() {
  document.getElementById("search-input").addEventListener("input", (e) => {
    STATE.search = e.target.value.trim().toLocaleLowerCase("ru");
    render();
  });

  document.getElementById("subject-filter").addEventListener("change", (e) => {
    STATE.subject = e.target.value;
    render();
  });

  document.querySelectorAll(".sort-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      STATE.sort = btn.dataset.sort;
      document.querySelectorAll(".sort-toggle button").forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
      });
      render();
    });
  });
}

function filterData() {
  return DATA.filter((item) => {
    if (STATE.subject !== "all" && item.subject !== STATE.subject) return false;
    if (!STATE.search) return true;
    const haystack = `${item.teacher} ${item.subject} ${item.course || ""}`.toLocaleLowerCase("ru");
    return haystack.includes(STATE.search);
  });
}

function sortData(list) {
  const copy = [...list];
  if (STATE.sort === "teacher") {
    copy.sort((a, b) => a.teacher.localeCompare(b.teacher, "ru"));
  } else {
    copy.sort((a, b) => {
      const bySubject = a.subject.localeCompare(b.subject, "ru");
      if (bySubject !== 0) return bySubject;
      const byCourse = (a.course || "").localeCompare(b.course || "", "ru");
      if (byCourse !== 0) return byCourse;
      return a.teacher.localeCompare(b.teacher, "ru");
    });
  }
  return copy;
}

function render() {
  const list = sortData(filterData());
  const results = document.getElementById("results");
  results.innerHTML = "";
  updateCount(list.length, DATA.length);

  if (list.length === 0) {
    results.appendChild(buildEmptyState());
    return;
  }

  if (STATE.sort === "subject") {
    let lastSubject = null;
    let lastCourse = null;
    let grid = null;

    list.forEach((item) => {
      if (item.subject !== lastSubject) {
        results.appendChild(buildGroupHeader(item.subject, "group-subject"));
        lastSubject = item.subject;
        lastCourse = null;
        grid = null;
      }
      if (item.course && item.course !== lastCourse) {
        results.appendChild(buildGroupHeader(item.course, "group-course"));
        lastCourse = item.course;
        grid = null;
      }
      if (!grid) {
        grid = document.createElement("div");
        grid.className = "card-grid";
        results.appendChild(grid);
      }
      grid.appendChild(buildCard(item, false));
    });
  } else {
    const grid = document.createElement("div");
    grid.className = "card-grid";
    list.forEach((item) => grid.appendChild(buildCard(item, true)));
    results.appendChild(grid);
  }
}

function buildGroupHeader(text, className) {
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  return div;
}

function buildCard(item, showSubjectTag) {
  const card = document.createElement("article");
  card.className = "card";

  const stamp = document.createElement("span");
  stamp.className = "card__stamp";
  const count = item.reviews ? item.reviews.length : 0;
  stamp.textContent = `${count} ${pluralizeReview(count)}`;
  card.appendChild(stamp);

  const h3 = document.createElement("h3");
  h3.className = "card__teacher";
  h3.textContent = item.teacher;
  card.appendChild(h3);

  const meta = document.createElement("p");
  meta.className = "card__meta";
  meta.textContent = showSubjectTag
    ? [item.subject, item.course].filter(Boolean).join(" · ")
    : item.course || "";
  card.appendChild(meta);

  const ul = document.createElement("ul");
  ul.className = "card__reviews";
  (item.reviews || []).forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });
  card.appendChild(ul);

  return card;
}

function pluralizeReview(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "отзыв";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "отзыва";
  return "отзывов";
}

function buildEmptyState() {
  const div = document.createElement("div");
  div.className = "empty-state";

  const title = document.createElement("p");
  title.className = "empty-state__title";
  title.textContent = "В картотеке пусто";

  const hint = document.createElement("p");
  hint.textContent = "Попробуйте другой предмет или измените запрос.";

  div.append(title, hint);
  return div;
}

function updateCount(shown, total) {
  const el = document.getElementById("results-count");
  if (el) el.textContent = `Показано ${shown} из ${total}`;
}

function showLoadError() {
  const results = document.getElementById("results");
  results.innerHTML = "";
  const p = document.createElement("p");
  p.className = "load-error";
  p.textContent =
    "Не удалось загрузить data.json. Если вы открыли index.html двойным кликом — браузер блокирует чтение локальных файлов. Запустите локальный сервер (например, расширение «Live Server» в VS Code) или загрузите папку на хостинг (GitHub Pages, Netlify и т.п.).";
  results.appendChild(p);
}
