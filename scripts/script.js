/**
 * D&D Initiative Tracker — основная логика приложения.
 *
 * Архитектура: один большой модуль внутри DOMContentLoaded, без сборщика
 * и без фреймворков. Состояние приложения — обычные переменные замыкания,
 * перерисовка — через innerHTML и точечные обновления DOM.
 *
 * Структура файла (сверху вниз):
 *   1. Конфигурация и константы
 *   2. Интернационализация (i18n)
 *   3. Ссылки на DOM-элементы
 *   4. Состояние приложения
 *   5. Ленивая загрузка тяжёлых библиотек
 *   6. Инициализация и обработчики событий
 *   7. Режим редактирования карточек
 *   8. Размеры карточки и держателя (чтение формы)
 *   9. Расчёт метрик карточки (масштабирование)
 *  10. Превью карточки
 *  11. Работа с фото (CropperJS)
 *  12. Управление списком карточек (CRUD)
 *  13. Сброс формы
 *  14. Экспорт в PDF
 *  15. Алгоритм укладки карточек по страницам PDF
 *  16. Построение HTML-разметки карточки
 *  17. Вспомогательные утилиты
 */
window.addEventListener("DOMContentLoaded", () => {

  // ══════════════════════════════════════════════════════════════════
  //  1. КОНФИГУРАЦИЯ И КОНСТАНТЫ
  // ══════════════════════════════════════════════════════════════════

  /**
   * Базовые размеры карточки при ширине 35 мм.
   * Все остальные размеры карточки масштабируются от этих значений через
   * коэффициент scale = cardWidth / baseWidth (см. getCardScale).
   */
  const CARD_BASE = {
    baseWidth: 35,            // мм — ширина карточки, относительно которой считается scale
    baseHeight: 120,          // мм — полная высота карточки (без держателя)
    baseCutLineTop: 60,       // мм от верха — пунктирная линия сгиба пополам
    baseHalfContentHeight: 60,// мм — высота контентной зоны одной половины

    // Базовые размеры внутренних элементов в пикселях (при ширине 35 мм)
    basePhotoFontSizePx: 10,
    basePhotoPaddingPx: 8,
    baseNameMinHeightPx: 14,
    baseNameFontSizePx: 14,
    baseNamePaddingTopPx: 2,
    baseNamePaddingXPx: 6,
    baseNamePaddingBottomPx: 1,
    baseNameEmptyPaddingLeftPx: 8, // левый отступ строки-подчёркивания, если имя не задано
    baseStatsGapPx: 10,
    baseStatsPaddingXPx: 8,
    baseStatsPaddingBottomPx: 6,
    baseStatSizeMm: 12,             // мм — диаметр/сторона иконки КД и скорости
    baseStatOffsetMm: -0.5,         // мм — вертикальная коррекция текста внутри иконки

    // Ограничения числовых полей формы
    minWidth: 20,
    maxWidth: 50,
    minHolderGap: 0,
    maxHolderGap: 30,
    defaultHolderGap: 10,    // мм — размер поля держателя по умолчанию
  };

  /** Параметры экспорта в PDF: лист A4 горизонтально, отступы между карточками. */
  const PDF_CONFIG = {
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    startX: 2,    // мм от края страницы до первой карточки в ряду
    startY: 2,    // мм от края страницы до первого ряда
    gapX: 4,      // мм между карточками по горизонтали
    gapY: 4,      // мм между рядами по вертикали
    fileName: "dnd_cards.pdf",
  };

  /** Соотношение сторон области кадрирования = ширина / высота фото-зоны карточки (35:40). */
  const CROP_ASPECT_RATIO = 35 / 40;

  /** Размер сохраняемого кадрированного изображения в пикселях. */
  const CROP_OUTPUT_SIZE = { width: 350, height: 400 };

  /** Имена персонажа, при вводе которых показывается пасхалка (ru / en вариант). */
  const EASTER_EGG_NAMES = ["Иваныч", "Ivanich"];

  /**
   * SVG-иконки для статов на карточке (КД — щит, скорость — ботинок).
   * Вынесены в константы, чтобы не дублировать громоздкую разметку path.
   */
  const STAT_ICONS = {
    ac: `<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <path d="M202.182922,458.891754 C139.643829,421.766632 99.467316,368.142365 80.860298,298.339447 C75.441353,278.010651 72.752342,257.224396 72.712379,236.169357 C72.619720,187.347229 72.741943,138.524597 72.562012,89.702950 C72.544792,85.031189 73.967979,83.056190 78.465927,81.769997 C135.882355,65.351654 193.247803,48.754761 250.605942,32.133335 C254.064774,31.131018 257.279694,30.876293 260.816376,31.900331 C318.657593,48.648140 376.511963,65.351357 434.411285,81.896751 C438.812714,83.154510 440.033966,85.335152 440.021912,89.676849 C439.891479,136.665741 440.072968,183.655640 439.898102,230.644241 C439.659637,294.719788 420.202087,352.126404 378.955292,401.506226 C346.976868,439.790161 306.856750,466.288849 259.394867,481.691620 C256.952148,482.484375 254.872406,482.077911 252.622559,481.342010 C235.154419,475.628204 218.419662,468.272217 202.182922,458.891754 M315.604675,76.098251 C297.066040,70.751556 278.519379,65.432289 259.997681,60.027466 C257.335632,59.250648 254.874863,59.245289 252.188660,60.027908 C202.993744,74.360779 153.799255,88.696495 104.530891,102.773392 C100.181259,104.016159 99.247795,105.983055 99.259521,110.064667 C99.381065,152.392685 99.264153,194.721375 99.364037,237.049500 C99.412567,257.612061 102.157478,277.891296 108.066307,297.571259 C130.686478,372.910126 178.891266,424.757965 252.048859,453.533600 C255.232162,454.785706 258.025024,454.683594 261.170349,453.465942 C316.581360,432.013916 358.600800,395.338928 386.388031,342.766907 C403.539246,310.317719 412.678375,275.633606 412.843414,238.825027 C413.034698,196.164368 412.837677,153.501907 413.063049,110.841576 C413.090088,105.721794 411.404663,103.622498 406.550476,102.255135 C376.446533,93.775314 346.431793,84.978828 315.604675,76.098251 z"/>
    </svg>`,
    speed: `<svg viewBox="0 0 352 384" aria-hidden="true" focusable="false">
      <path d="M72.000038,295.760803 C132.322495,295.755249 192.144974,295.722015 251.967392,295.759155 C272.377258,295.771820 289.049042,308.172180 293.460876,328.075378 C298.148285,349.221588 288.437195,371.291931 264.479828,377.869629 C242.760162,383.833008 219.888474,371.696411 213.348633,350.813660 C211.868500,346.087372 211.553467,341.353394 211.343231,336.552063 C211.140747,331.927582 213.672989,328.817841 217.410980,329.082062 C221.736023,329.387848 223.190384,332.241943 223.365417,336.266632 C224.051300,352.036865 231.979263,362.829376 245.144470,366.105042 C261.246887,370.111542 277.542267,361.107605 281.486420,346.024506 C285.867157,329.271851 276.572601,313.385529 259.848389,308.907806 C256.553040,308.025513 253.231689,308.242859 249.917252,308.241547 C181.429703,308.214447 112.942139,308.219208 44.454586,308.216003 C42.788330,308.215942 41.119461,308.252899 39.456348,308.175293 C35.645260,307.997467 32.897945,306.274231 32.799011,302.231750 C32.693848,297.934723 35.461086,295.881897 39.507099,295.818604 C47.836857,295.688263 56.169876,295.766174 64.501556,295.759583 C66.834381,295.757751 69.167206,295.760223 72.000038,295.760803 z"/>
      <path d="M199.999969,111.256088 C176.505066,111.251968 153.510178,111.253662 130.515305,111.231079 C128.688843,111.229286 126.799095,111.325607 125.050194,110.908752 C121.995811,110.180748 120.049774,108.078461 120.031036,104.869797 C120.011703,101.558632 122.174095,99.676300 125.229187,99.073715 C127.163864,98.692116 129.208435,98.803329 131.203735,98.802780 C188.524323,98.787056 245.846664,98.536957 303.164337,98.943016 C318.917694,99.054626 332.036835,87.172943 334.118561,73.330391 C336.116119,60.047646 327.264252,44.798168 314.249908,41.354229 C292.940308,35.715145 274.770782,49.699745 275.210754,69.747963 C275.326691,75.030899 272.511505,78.234016 268.643707,78.065186 C265.150543,77.912712 262.879761,74.632370 262.758270,69.563141 C262.239990,47.935184 281.034180,28.557022 302.128601,27.502996 C327.905884,26.214985 346.662079,47.343628 346.425171,68.323662 C346.146606,92.991211 328.318909,111.185959 303.477264,111.235764 C269.151611,111.304588 234.825745,111.254738 199.999969,111.256088 z"/>
      <path d="M182.446487,88.921051 C174.010986,89.082512 166.020142,89.231453 158.029236,89.235641 C116.226410,89.257553 74.423561,89.243584 32.620728,89.237892 C30.789125,89.237640 28.944920,89.324921 27.128582,89.146935 C23.488379,88.790230 21.185123,86.677452 21.029455,83.058701 C20.865643,79.250626 23.407389,77.304161 26.940807,76.925308 C29.743120,76.624840 32.596050,76.764107 35.426517,76.763405 C82.725342,76.751640 130.024216,76.783295 177.322968,76.723389 C192.378006,76.704323 202.530930,68.931786 206.717270,54.556850 C210.988403,39.890766 202.128082,23.905758 187.536865,19.227924 C168.217636,13.034323 149.526016,26.932289 148.354813,47.279099 C148.307007,48.109421 148.348907,48.944508 148.325760,49.776730 C148.220657,53.558231 146.126144,55.895081 142.520798,55.971573 C138.815765,56.050186 136.963043,53.588070 136.657074,49.871490 C135.024521,30.041473 148.370636,11.605866 167.939667,6.736266 C189.962753,1.255992 213.050034,14.316305 218.170975,35.151779 C224.307556,60.119591 212.043472,81.642235 188.244720,87.648735 C186.472687,88.095970 184.676224,88.446342 182.446487,88.921051 z"/>
      <path d="M148.999969,286.231720 C109.866081,286.232239 71.232208,286.233185 32.598335,286.231537 C31.099802,286.231476 29.594110,286.295471 28.104136,286.175659 C24.289301,285.868835 21.801939,284.043274 21.723423,279.953857 C21.641226,275.672668 24.479841,274.251343 28.140720,273.823151 C29.127815,273.707703 30.136751,273.766388 31.135660,273.766357 C100.077133,273.763794 169.018600,273.763397 237.960068,273.762848 C238.126587,273.762848 238.293137,273.762726 238.459641,273.764496 C244.881653,273.832916 248.031219,275.896362 248.040192,280.040985 C248.049088,284.155701 244.877151,286.229004 238.424225,286.231171 C208.782806,286.241241 179.141388,286.233246 148.999969,286.231720 z"/>
      <path d="M88.997391,98.791489 C93.985855,98.803627 98.477219,98.732262 102.963448,98.852570 C106.953102,98.959557 109.934387,100.809898 109.906700,105.059898 C109.879242,109.275352 106.966682,111.212440 102.928108,111.216835 C76.159241,111.246002 49.390240,111.253670 22.621489,111.185753 C18.657303,111.175697 15.857677,109.376839 15.741642,104.971489 C15.639174,101.081139 18.199707,98.841942 23.155052,98.826157 C44.935871,98.756744 66.717026,98.793251 88.997391,98.791489 z"/>
    </svg>`,
  };

  /** SVG-иконки для кнопок управления в списке карточек. */
  const ACTION_ICONS = {
    edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    delete: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  };

  // ══════════════════════════════════════════════════════════════════
  //  2. ИНТЕРНАЦИОНАЛИЗАЦИЯ (i18n)
  // ══════════════════════════════════════════════════════════════════
  //
  //  Словари строк лежат в window.I18N (см. scripts/i18n.js).
  //  Текущий язык хранится в currentLang и применяется к DOM через
  //  applyTranslations(). HTML-элементы помечаются атрибутами:
  //    data-i18n="ключ"             — заменяет textContent
  //    data-i18n-attr="attr:ключ"   — заменяет произвольный атрибут
  // ══════════════════════════════════════════════════════════════════

  const LANG_STORAGE_KEY = "dnd_lang"; // ключ в localStorage для запоминания выбора
  const THEME_STORAGE_KEY = "dnd_theme"; // ключ для запоминания темы (light / dark)

  /**
   * Определяет язык интерфейса при первой загрузке страницы:
   * 1. Если пользователь уже выбирал язык вручную — берём его из localStorage.
   * 2. Иначе смотрим на язык браузера (navigator.languages).
   * 3. Если язык браузера не русский — показываем английский по умолчанию.
   */
  function detectInitialLang() {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved) return saved;

    const browserLang = (navigator.languages?.[0] || navigator.language || "ru").toLowerCase();
    return browserLang.startsWith("ru") ? "ru" : "en";
  }

  let currentLang = detectInitialLang();

  /** Возвращает строку интерфейса по ключу из словаря текущего языка (с фолбэком на ru). */
  function t(key) {
    return window.I18N[currentLang][key] ?? window.I18N.ru[key] ?? key;
  }

  /**
   * Возвращает JS-строку из секции `js` словаря.
   * Некоторые значения — функции (для строк с параметрами, например
   * подсказка о размере карточки), в этом случае вызываем их с args.
   */
  function tjs(key, ...args) {
    const entry = window.I18N[currentLang].js[key] ?? window.I18N.ru.js[key];
    return typeof entry === "function" ? entry(...args) : (entry ?? key);
  }

  /**
   * Применяет текущий язык ко всей странице:
   * - обновляет <html lang>, <title>, meta description;
   * - заполняет все элементы с data-i18n / data-i18n-attr;
   * - обновляет подписи кнопки переключения языка;
   * - перерисовывает динамические части интерфейса (превью, список карточек и т.д.),
   *   так как их разметка тоже содержит переводимый текст.
   */
  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.title = t("pageTitle");
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content", t("metaDescription"));

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const value = t(el.dataset.i18n);
      if (value !== undefined) el.textContent = value;
    });

    // Формат: data-i18n-attr="placeholder:ключ1,alt:ключ2"
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      el.dataset.i18nAttr.split(",").forEach(pair => {
        const [attrName, i18nKey] = pair.trim().split(":");
        const value = t(i18nKey.trim());
        if (value !== undefined) el.setAttribute(attrName.trim(), value);
      });
    });

    if (DOM.langToggle) {
      DOM.langToggle.title = t("langToggleTitle");
      DOM.langToggle.setAttribute("aria-label", t("langToggleTitle"));
      DOM.langToggle.setAttribute("data-active", currentLang); // подсветка активного сегмента RU/EN
    }

    updateThemeToggleLabel(); // подпись кнопки темы зависит от языка

    // Динамические блоки строятся через innerHTML, поэтому их нужно
    // перерисовать целиком после смены языка
    updatePreview();
    updateCardSizeHint();
    renderCardsList();
    syncEditModeUI();
  }

  /** Переключает язык интерфейса между ru и en, запоминает выбор в localStorage. */
  function toggleLang() {
    currentLang = currentLang === "ru" ? "en" : "ru";
    localStorage.setItem(LANG_STORAGE_KEY, currentLang);
    applyTranslations();
  }

  // ══════════════════════════════════════════════════════════════════
  //  2b. ТЕМА ОФОРМЛЕНИЯ (светлая / тёмная)
  // ══════════════════════════════════════════════════════════════════
  //
  //  Тема хранится в атрибуте data-theme на <html>. Первичное значение
  //  выставляет встроенный скрипт в <head> (чтобы не мигала светлая тема
  //  до загрузки этого файла), поэтому здесь мы просто читаем текущее
  //  значение и умеем его переключать.
  // ══════════════════════════════════════════════════════════════════

  const THEME_COLORS = { light: "#f2f2ef", dark: "#131416" };

  /** Возвращает текущую тему, опираясь на уже выставленный атрибут data-theme. */
  function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  /** Применяет тему: атрибут на <html>, meta theme-color, подпись кнопки. */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[theme] ?? THEME_COLORS.light);
    updateThemeToggleLabel();
  }

  /** Обновляет title/aria-label кнопки темы (показываем, куда переключит клик). */
  function updateThemeToggleLabel() {
    if (!DOM.themeToggle) return;
    // Если сейчас тёмная — клик уведёт в светлую, и наоборот.
    const nextLabel = getCurrentTheme() === "dark" ? t("themeToLight") : t("themeToDark");
    DOM.themeToggle.title = nextLabel;
    DOM.themeToggle.setAttribute("aria-label", nextLabel);
    DOM.themeToggle.setAttribute("aria-pressed", String(getCurrentTheme() === "dark"));
  }

  /** Переключает тему и запоминает выбор в localStorage. */
  function toggleTheme() {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (e) { /* приватный режим — молча игнорируем */ }
    applyTheme(next);
  }

  // ══════════════════════════════════════════════════════════════════
  //  3. ССЫЛКИ НА DOM-ЭЛЕМЕНТЫ
  // ══════════════════════════════════════════════════════════════════

  const DOM = {
    // Поля формы персонажа
    imageInput: document.getElementById("imageInput"),
    imagePreview: document.getElementById("imagePreview"),
    nameInput: document.getElementById("nameInput"),
    acInput: document.getElementById("acInput"),
    speedInput: document.getElementById("speedInput"),
    cardWidthInput: document.getElementById("cardWidthInput"),
    cardSizeHint: document.getElementById("cardSizeHint"),
    masterSideOnlyInput: document.getElementById("masterSideOnlyInput"),
    holderGapInput: document.getElementById("holderGapInput"),
    holderGapSizeControl: document.getElementById("holderGapSizeControl"),
    holderGapSizeInput: document.getElementById("holderGapSizeInput"),

    // Кнопки управления
    addCardBtn: document.getElementById("addCardBtn"),
    clearFormBtn: document.getElementById("clearFormBtn"),
    cancelEditBtn: document.getElementById("cancelEditBtn"),
    downloadPdfBtn: document.getElementById("downloadPdfBtn"),
    langToggle: document.getElementById("langToggle"),
    themeToggle: document.getElementById("themeToggle"),
    clearSheetBtn: document.getElementById("clearSheetBtn"),

    // Динамически обновляемые блоки
    cardPreview: document.getElementById("cardPreview"),
    cardsList: document.getElementById("cardsList"),
    easterEgg: document.getElementById("easterEgg"),
    editBanner: document.getElementById("editBanner"),
    editBannerName: document.getElementById("editBannerName"),
    formTitle: document.getElementById("form-title"),
    cardsCountBadge: document.getElementById("cardsCountBadge"),
    stageDims: document.getElementById("stageDims"),
  };

  // ══════════════════════════════════════════════════════════════════
  //  4. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
  // ══════════════════════════════════════════════════════════════════

  let cropper = null;                      // текущий экземпляр CropperJS (или null)
  let cards = [];                          // массив добавленных карточек
  let editingIndex = null;                 // null = режим создания; число = индекс редактируемой карточки

  // Фото текущей карточки хранится в двух вариантах:
  //  - currentPreviewPhotoDataUrl  — уже обрезанное (что увидит пользователь на карточке)
  //  - currentOriginalPhotoDataUrl — исходное, до кадрирования (нужно, чтобы при повторном
  //    редактировании карточки можно было заново выбрать область кропа, а не работать
  //    с уже обрезанным и потому испорченным для повторного кропа изображением)
  let currentPreviewPhotoDataUrl = "";
  let currentOriginalPhotoDataUrl = "";

  // ══════════════════════════════════════════════════════════════════
  //  5. ЛЕНИВАЯ ЗАГРУЗКА ТЯЖЁЛЫХ БИБЛИОТЕК
  // ══════════════════════════════════════════════════════════════════
  //
  //  CropperJS (~120 КБ), html2canvas (~800 КБ) и jsPDF (~300 КБ) не нужны
  //  для первого рендера страницы. Подключаем их через <script> только
  //  в момент реального использования — это ускоряет загрузку сайта.
  // ══════════════════════════════════════════════════════════════════

  const CDN_URLS = {
    cropper: "https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.js",
    html2canvas: "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    jspdf: "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  };

  /**
   * Динамически подгружает скрипт по URL и возвращает Promise, который
   * резолвится после загрузки. Повторный вызов с тем же src ничего
   * не делает повторно — скрипт уже есть в DOM.
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const ensureCropper = () => loadScript(CDN_URLS.cropper);
  const ensureHtml2canvas = () => loadScript(CDN_URLS.html2canvas);
  const ensureJsPdf = () => loadScript(CDN_URLS.jspdf);

  // ══════════════════════════════════════════════════════════════════
  //  6. ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ СОБЫТИЙ
  // ══════════════════════════════════════════════════════════════════

  function init() {
    // Приводим числовые поля к допустимому диапазону ещё до навешивания обработчиков
    syncCardWidthInput();
    syncHolderGapSizeInput();
    bindEvents();
    applyTranslations(); // первый рендер интерфейса (включая перевод и превью)
  }

  function bindEvents() {
    DOM.imageInput.addEventListener("change", handleImageChange);

    // Любое изменение текстовых полей сразу обновляет превью справа
    DOM.nameInput.addEventListener("input", updatePreview);
    DOM.acInput.addEventListener("input", updatePreview);
    DOM.speedInput.addEventListener("input", updatePreview);
    DOM.masterSideOnlyInput.addEventListener("change", updatePreview);

    // Ширина карточки: превью обновляем сразу при вводе,
    // а нормализацию (clamp в допустимый диапазон) делаем при потере фокуса —
    // иначе пользователь не успеет дописать число до зажатия в границы
    DOM.cardWidthInput.addEventListener("input", updatePreview);
    DOM.cardWidthInput.addEventListener("blur", () => {
      syncCardWidthInput();
      updatePreview();
    });

    // Чекбокс держателя: сначала показываем/скрываем поле размера, потом обновляем превью
    DOM.holderGapInput.addEventListener("change", () => {
      updateHolderGapSizeState();
      updatePreview();
    });
    DOM.holderGapSizeInput.addEventListener("input", updatePreview);
    DOM.holderGapSizeInput.addEventListener("blur", () => {
      syncHolderGapSizeInput();
      updatePreview();
    });

    DOM.addCardBtn.addEventListener("click", handleAddOrSaveCard);
    DOM.clearFormBtn.addEventListener("click", handleClearForm);
    DOM.cancelEditBtn.addEventListener("click", cancelEdit);
    DOM.downloadPdfBtn.addEventListener("click", handleDownloadPdf);
    DOM.langToggle.addEventListener("click", toggleLang);
    if (DOM.themeToggle) DOM.themeToggle.addEventListener("click", toggleTheme);
    if (DOM.clearSheetBtn) DOM.clearSheetBtn.addEventListener("click", handleClearSheet);
  }

  /** Полностью очищает лист карточек (с подтверждением) и выходит из режима редактирования. */
  function handleClearSheet() {
    if (!cards.length) return;
    if (!window.confirm(tjs("confirmClearSheet"))) return;
    cards = [];
    editingIndex = null;
    syncEditModeUI();
    renderCardsList();
  }

  // ══════════════════════════════════════════════════════════════════
  //  7. РЕЖИМ РЕДАКТИРОВАНИЯ КАРТОЧЕК
  // ══════════════════════════════════════════════════════════════════

  /**
   * Синхронизирует видимость элементов UI режима редактирования
   * (текст кнопки «Добавить/Сохранить», баннер «Редактирование: …», кнопка «Отмена»)
   * с текущим значением editingIndex.
   * Вызывается при входе/выходе из редактирования и при смене языка.
   */
  function syncEditModeUI() {
    const isEditing = editingIndex !== null;
    DOM.addCardBtn.textContent = tjs(isEditing ? "btnSave" : "btnAdd");
    DOM.addCardBtn.classList.toggle("btn-editing", isEditing);
    DOM.cancelEditBtn.hidden = !isEditing;
    DOM.editBanner.hidden = !isEditing;
  }

  /**
   * Входит в режим редактирования карточки с заданным индексом:
   *  1. Заполняет поля формы значениями карточки.
   *  2. Загружает ОРИГИНАЛЬНОЕ (не обрезанное) фото в CropperJS, чтобы
   *     пользователь мог заново выбрать область кадрирования, а не только
   *     смотреть на уже готовый результат.
   *  3. Обновляет визуальный режим формы и прокручивает её в видимую область.
   */
  async function enterEditMode(index) {
    editingIndex = index;
    const card = cards[index];

    DOM.nameInput.value = card.name || "";
    DOM.acInput.value = card.ac || "";
    DOM.speedInput.value = card.speed || "";
    DOM.cardWidthInput.value = formatMetricNumber(card.cardWidth ?? CARD_BASE.baseWidth);
    DOM.masterSideOnlyInput.checked = Boolean(card.masterSideOnly);
    DOM.holderGapInput.checked = Boolean(card.holderGap);
    DOM.holderGapSizeInput.value = formatMetricNumber(card.holderGapSize ?? CARD_BASE.defaultHolderGap);

    // Восстанавливаем фото: обрезанное — для немедленного превью,
    // оригинал — для повторной инициализации кроппера
    currentPreviewPhotoDataUrl = card.photoDataUrl || "";
    currentOriginalPhotoDataUrl = card.originalPhotoDataUrl || card.photoDataUrl || "";

    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    DOM.imageInput.value = "";

    if (currentOriginalPhotoDataUrl) {
      await ensureCropper();
      DOM.imagePreview.src = currentOriginalPhotoDataUrl;

      // CropperJS должен инициализироваться только после полной загрузки <img>,
      // иначе он не сможет правильно вычислить размеры изображения
      await new Promise(resolve => {
        if (DOM.imagePreview.complete) {
          resolve();
        } else {
          DOM.imagePreview.onload = resolve;
        }
      });

      cropper = new Cropper(DOM.imagePreview, {
        aspectRatio: CROP_ASPECT_RATIO,
        viewMode: 1,
        ready: refreshPreviewPhotoFromCropper,
        cropend: refreshPreviewPhotoFromCropper,
      });
    } else {
      DOM.imagePreview.removeAttribute("src");
    }

    DOM.editBannerName.textContent = card.name || tjs("unnamed");
    syncEditModeUI();
    updateHolderGapSizeState();
    updatePreview();
    renderCardsList();

    DOM.formTitle.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Отменяет редактирование текущей карточки и полностью очищает форму. */
  function cancelEdit() {
    exitEditMode();
    handleClearForm();
  }

  /** Сбрасывает флаг режима редактирования, не трогая содержимое формы. */
  function exitEditMode() {
    editingIndex = null;
    syncEditModeUI();
    renderCardsList();
  }

  // ══════════════════════════════════════════════════════════════════
  //  8. РАЗМЕРЫ КАРТОЧКИ И ДЕРЖАТЕЛЯ (ЧТЕНИЕ ФОРМЫ)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Читает ширину карточки из поля ввода формы и зажимает в допустимый диапазон.
   * Нечисловое значение трактуется как базовая ширина 35 мм.
   */
  function getSelectedCardWidth() {
    const raw = Number.parseFloat(DOM.cardWidthInput.value);
    return clamp(
      Number.isFinite(raw) ? raw : CARD_BASE.baseWidth,
      CARD_BASE.minWidth,
      CARD_BASE.maxWidth
    );
  }

  /** Читает размер поля держателя из формы и зажимает в допустимый диапазон. */
  function getSelectedHolderGapSize() {
    const raw = Number.parseFloat(DOM.holderGapSizeInput.value);
    return clamp(
      Number.isFinite(raw) ? raw : CARD_BASE.defaultHolderGap,
      CARD_BASE.minHolderGap,
      CARD_BASE.maxHolderGap
    );
  }

  /** Перезаписывает поле ширины карточки уже нормализованным значением. */
  function syncCardWidthInput() {
    DOM.cardWidthInput.value = formatMetricNumber(getSelectedCardWidth());
  }

  /** Перезаписывает поле размера держателя уже нормализованным значением. */
  function syncHolderGapSizeInput() {
    DOM.holderGapSizeInput.value = formatMetricNumber(getSelectedHolderGapSize());
  }

  /** Показывает или скрывает поле размера держателя в зависимости от состояния чекбокса. */
  function updateHolderGapSizeState() {
    const enabled = DOM.holderGapInput.checked;
    DOM.holderGapSizeControl.hidden = !enabled;
    DOM.holderGapSizeInput.disabled = !enabled;
  }

  // ══════════════════════════════════════════════════════════════════
  //  9. РАСЧЁТ МЕТРИК КАРТОЧКИ (МАСШТАБИРОВАНИЕ)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Коэффициент масштабирования карточки относительно базовой ширины 35 мм.
   * Например, при ширине 70 мм scale = 2 — все внутренние размеры удваиваются.
   */
  function getCardScale(cardWidth) {
    return cardWidth / CARD_BASE.baseWidth;
  }

  /**
   * Вычисляет полный набор размеров карточки (в мм и px) для заданных
   * ширины и размера держателя. Если объект card не передан или не содержит
   * нужных полей — берёт текущие значения прямо из формы.
   *
   * Результат используется в двух местах:
   *  - applyCardMetricsToElement — для записи в CSS Custom Properties превью;
   *  - buildPdfPages / handleDownloadPdf — для расчёта размеров в PDF (в мм).
   */
  function getCardMetrics(card = {}) {
    const cardWidth = card.cardWidth ?? getSelectedCardWidth();
    const holderGap = card.holderGapSize ?? getSelectedHolderGapSize();
    const scale = getCardScale(cardWidth);

    const heightMm = CARD_BASE.baseHeight * scale;
    const cutLineTopMm = CARD_BASE.baseCutLineTop * scale;

    return {
      // Размеры в миллиметрах (нужны для PDF и для --card-width/-height)
      widthMm: cardWidth,
      heightMm,
      heightWithHolderMm: heightMm + holderGap * 2,
      cutLineTopMm,
      cutLineTopWithHolderMm: cutLineTopMm + holderGap,
      halfContentHeightMm: CARD_BASE.baseHalfContentHeight * scale,
      gapHeightMm: holderGap,
      holderGapMm: holderGap,
      statSizeMm: CARD_BASE.baseStatSizeMm * scale,
      statOffsetMm: CARD_BASE.baseStatOffsetMm * scale,

      // Размеры в пикселях (внутренние отступы, шрифты — для CSS Custom Properties)
      photoFontSizePx: CARD_BASE.basePhotoFontSizePx * scale,
      photoPaddingPx: CARD_BASE.basePhotoPaddingPx * scale,
      nameMinHeightPx: CARD_BASE.baseNameMinHeightPx * scale,
      nameFontSizePx: CARD_BASE.baseNameFontSizePx * scale,
      namePaddingTopPx: CARD_BASE.baseNamePaddingTopPx * scale,
      namePaddingXPx: CARD_BASE.baseNamePaddingXPx * scale,
      namePaddingBottomPx: CARD_BASE.baseNamePaddingBottomPx * scale,
      nameEmptyPaddingLeftPx: CARD_BASE.baseNameEmptyPaddingLeftPx * scale,
      statsGapPx: CARD_BASE.baseStatsGapPx * scale,
      statsPaddingXPx: CARD_BASE.baseStatsPaddingXPx * scale,
      statsPaddingBottomPx: CARD_BASE.baseStatsPaddingBottomPx * scale,
    };
  }

  /**
   * Записывает рассчитанные метрики карточки в CSS Custom Properties элемента.
   * Благодаря этому изменение ширины карточки не требует перегенерации CSS —
   * все размеры в style.css завязаны на переменные --card-*.
   */
  function applyCardMetricsToElement(element, card = {}) {
    const m = getCardMetrics(card);
    const style = element.style;

    style.setProperty("--card-width", formatMm(m.widthMm));
    style.setProperty("--card-height", formatMm(m.heightMm));
    style.setProperty("--card-height-holder", formatMm(m.heightWithHolderMm));
    style.setProperty("--card-cut-line-top", formatMm(m.cutLineTopMm));
    style.setProperty("--card-cut-line-top-holder", formatMm(m.cutLineTopWithHolderMm));
    style.setProperty("--card-half-content-height", formatMm(m.halfContentHeightMm));
    style.setProperty("--card-gap-height", formatMm(m.gapHeightMm));
    style.setProperty("--card-photo-font-size", formatPx(m.photoFontSizePx));
    style.setProperty("--card-photo-padding", formatPx(m.photoPaddingPx));
    style.setProperty("--card-name-min-height", formatPx(m.nameMinHeightPx));
    style.setProperty("--card-name-font-size", formatPx(m.nameFontSizePx));
    style.setProperty("--card-name-padding-top", formatPx(m.namePaddingTopPx));
    style.setProperty("--card-name-padding-x", formatPx(m.namePaddingXPx));
    style.setProperty("--card-name-padding-bottom", formatPx(m.namePaddingBottomPx));
    style.setProperty("--card-name-empty-padding-left", formatPx(m.nameEmptyPaddingLeftPx));
    style.setProperty("--card-stats-gap", formatPx(m.statsGapPx));
    style.setProperty("--card-stats-padding-x", formatPx(m.statsPaddingXPx));
    style.setProperty("--card-stats-padding-bottom", formatPx(m.statsPaddingBottomPx));
    style.setProperty("--card-stat-size", formatMm(m.statSizeMm));
    style.setProperty("--card-stat-offset", formatMm(m.statOffsetMm));
  }

  /** Обновляет текстовую подсказку с итоговой высотой карточки под полем ширины. */
  function updateCardSizeHint(card = {}) {
    const m = getCardMetrics(card);
    DOM.cardSizeHint.textContent = tjs(
      "cardSizeHint",
      formatMetricNumber(m.heightMm),
      formatMetricNumber(m.holderGapMm),
      formatMetricNumber(m.heightWithHolderMm)
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  10. ПРЕВЬЮ КАРТОЧКИ
  // ══════════════════════════════════════════════════════════════════

  /** Собирает текущие значения полей формы в обычный объект карточки. */
  function getFormData() {
    return {
      name: DOM.nameInput.value.trim(),
      ac: DOM.acInput.value.trim(),
      speed: DOM.speedInput.value.trim(),
      cardWidth: getSelectedCardWidth(),
      masterSideOnly: DOM.masterSideOnlyInput.checked,
      holderGap: DOM.holderGapInput.checked,
      holderGapSize: getSelectedHolderGapSize(),
    };
  }

  /**
   * Полностью перерисовывает превью карточки в правой колонке.
   * Вызывается при любом изменении формы (текст, чекбоксы, фото, ширина, язык).
   */
  function updatePreview() {
    const card = { ...getFormData(), photoDataUrl: currentPreviewPhotoDataUrl };

    DOM.cardPreview.className = cardPreviewClassName(card);
    applyCardMetricsToElement(DOM.cardPreview, card);
    DOM.cardPreview.innerHTML = buildCardMarkup(card);

    updateHolderGapSizeState();
    updateCardSizeHint(card);
    toggleEasterEgg(card.name);
    updateStageDims(card);
  }

  function updateStageDims(card) {
    if (!DOM.stageDims) return;
    const m = getCardMetrics(card);
    const h = card.holderGap ? m.heightWithHolderMm : m.heightMm;
    const sideLabel = card.masterSideOnly ? t("sideOnlyLabel") : t("sideBothLabel");
    DOM.stageDims.textContent =
      `${formatMetricNumber(card.cardWidth)} мм × ${formatMetricNumber(h)} мм · ${sideLabel}`;
  }

  /** Перечитывает обрезанное фото из CropperJS и обновляет превью. Вызывается событиями ready/cropend. */
  function refreshPreviewPhotoFromCropper() {
    currentPreviewPhotoDataUrl = getCroppedPhotoDataUrl() || "";
    updatePreview();
  }

  /** Показывает пасхалку, если введённое имя совпадает с одним из EASTER_EGG_NAMES. */
  function toggleEasterEgg(name) {
    DOM.easterEgg.style.display = EASTER_EGG_NAMES.includes(name) ? "block" : "none";
  }

  // ══════════════════════════════════════════════════════════════════
  //  11. РАБОТА С ФОТО (CropperJS)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Обрабатывает выбор нового файла изображения:
   *  1. Сбрасывает текущее фото (обрезанное и оригинал).
   *  2. Лениво подгружает CropperJS, если ещё не загружен.
   *  3. Читает файл через FileReader и инициализирует кроппер поверх <img>.
   */
  async function handleImageChange(event) {
    currentPreviewPhotoDataUrl = "";
    currentOriginalPhotoDataUrl = "";
    updatePreview();

    const file = event.target.files?.[0];
    if (!file) return;

    await ensureCropper();

    const reader = new FileReader();
    reader.onload = () => {
      // Сохраняем оригинал — он понадобится, если карточку потом откроют на редактирование
      currentOriginalPhotoDataUrl = reader.result;
      DOM.imagePreview.src = reader.result;

      if (cropper) cropper.destroy();
      cropper = new Cropper(DOM.imagePreview, {
        aspectRatio: CROP_ASPECT_RATIO,
        viewMode: 1,
        ready: refreshPreviewPhotoFromCropper,
        cropend: refreshPreviewPhotoFromCropper,
      });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Возвращает data URL кадрированного изображения фиксированного размера
   * (см. CROP_OUTPUT_SIZE). Возвращает null, если кроппер ещё не инициализирован.
   */
  function getCroppedPhotoDataUrl() {
    if (!cropper) return null;
    const canvas = cropper.getCroppedCanvas({
      width: CROP_OUTPUT_SIZE.width,
      height: CROP_OUTPUT_SIZE.height,
    });
    return canvas.toDataURL("image/png");
  }

  // ══════════════════════════════════════════════════════════════════
  //  12. УПРАВЛЕНИЕ СПИСКОМ КАРТОЧЕК (CRUD)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Добавляет новую карточку в список или сохраняет изменения существующей
   * (в зависимости от editingIndex). Фото сохраняется в двух экземплярах:
   * обрезанное — для отображения на карточке, оригинал — для повторного кропа.
   */
  function handleAddOrSaveCard() {
    const { name, ac, speed, cardWidth, masterSideOnly, holderGap, holderGapSize } = getFormData();
    const photoDataUrl = currentPreviewPhotoDataUrl || getCroppedPhotoDataUrl() || "";
    const originalPhotoDataUrl = currentOriginalPhotoDataUrl || photoDataUrl;

    const cardData = {
      name, ac, speed, cardWidth, masterSideOnly, holderGap, holderGapSize,
      photoDataUrl, originalPhotoDataUrl,
    };

    if (editingIndex !== null) {
      cards[editingIndex] = cardData; // заменяем карточку на месте, порядок списка не меняется
      exitEditMode();
    } else {
      cards.push(cardData);
      handleClearForm();
    }

    updatePreview();
    renderCardsList();
  }

  /**
   * Удаляет карточку по индексу.
   *  - Если удаляется именно редактируемая карточка — выходим из режима редактирования.
   *  - Если удаляется карточка, стоящая в списке раньше редактируемой —
   *    сдвигаем editingIndex на единицу вниз, чтобы он по-прежнему указывал
   *    на ту же карточку после splice.
   */
  function removeCard(index) {
    if (editingIndex === index) {
      exitEditMode();
    } else if (editingIndex !== null && index < editingIndex) {
      editingIndex--;
    }
    cards.splice(index, 1);
    renderCardsList();
  }

  /**
   * Перерисовывает список добавленных карточек.
   * Каждая строка: миниатюра фото, текстовый лейбл с бейджами, кнопки «редактировать»/«удалить».
   */
  function renderCardsList() {
    DOM.cardsList.innerHTML = "";

    if (DOM.cardsCountBadge) DOM.cardsCountBadge.textContent = String(cards.length);
    if (DOM.clearSheetBtn) DOM.clearSheetBtn.disabled = !cards.length;

    if (!cards.length) {
      const empty = document.createElement("span");
      empty.className = "cards-list-empty";
      empty.textContent = tjs("emptyList");
      DOM.cardsList.appendChild(empty);
      return;
    }

    cards.forEach((card, index) => {
      const row = document.createElement("div");
      row.className = "cards-list-item" + (index === editingIndex ? " is-editing" : "");
      row.append(
        buildCardThumb(card),
        buildCardLabel(card, index),
        buildCardActions(index)
      );
      DOM.cardsList.appendChild(row);
    });
  }

  /** Создаёт миниатюру фото (или плейсхолдер «?») для строки списка карточек. */
  function buildCardThumb(card) {
    const thumb = document.createElement("div");
    thumb.className = "cards-list-thumb";

    if (card.photoDataUrl) {
      const img = document.createElement("img");
      img.src = card.photoDataUrl;
      img.alt = "";
      thumb.appendChild(img);
    } else {
      thumb.textContent = "?";
    }

    return thumb;
  }

  /** Создаёт текстовый лейбл карточки с бейджами «пустые поля» / «редактируется». */
  function buildCardLabel(card, index) {
    const label = document.createElement("span");
    label.className = "cards-list-label";
    label.textContent = formatCardLabel(card);

    if (hasEmptyFields(card)) {
      label.appendChild(createBadge(tjs("emptyFields"), "mini-badge"));
    }
    if (index === editingIndex) {
      label.appendChild(createBadge(tjs("badgeEditing"), "mini-badge mini-badge-active"));
    }

    return label;
  }

  /** Создаёт пару кнопок «редактировать» и «удалить» для строки списка карточек. */
  function buildCardActions(index) {
    const actions = document.createElement("div");
    actions.className = "cards-list-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-ghost btn-icon";
    editBtn.title = currentLang === "ru" ? "Редактировать" : "Edit";
    editBtn.innerHTML = ACTION_ICONS.edit;
    editBtn.addEventListener("click", () => enterEditMode(index));

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-ghost btn-icon btn-icon-danger";
    removeBtn.title = currentLang === "ru" ? "Удалить" : "Delete";
    removeBtn.innerHTML = ACTION_ICONS.delete;
    removeBtn.addEventListener("click", () => removeCard(index));

    actions.append(editBtn, removeBtn);
    return actions;
  }

  /** Создаёт span-бейдж с заданным текстом и CSS-классами. */
  function createBadge(text, className) {
    const badge = document.createElement("span");
    badge.className = className;
    badge.textContent = text;
    return badge;
  }

  /**
   * Формирует однострочный текстовый лейбл карточки для списка.
   * Пример: «Иваныч · КД 16 · Скорость 30 · 35 мм · одна сторона».
   */
  function formatCardLabel(card) {
    const dash = tjs("labelDash");
    const widthLabel = `${formatMetricNumber(card.cardWidth ?? CARD_BASE.baseWidth)}${tjs("mmSuffix")}`;
    const holderLabel = card.holderGap
      ? tjs("holderSuffix", formatMetricNumber(card.holderGapSize ?? CARD_BASE.defaultHolderGap))
      : "";
    const sideLabel = card.masterSideOnly ? tjs("oneSide") : "";

    return [
      card.name || tjs("unnamed"),
      `${t("labelAC")} ${card.ac || dash}`,
      `${t("labelSpeed")} ${card.speed || dash}`,
      widthLabel,
    ].join(" · ") + holderLabel + sideLabel;
  }

  /** Возвращает true, если у карточки не заполнено хотя бы одно из ключевых полей (имя/КД/скорость). */
  function hasEmptyFields(card) {
    return !card.name || !card.ac || !card.speed;
  }

  // ══════════════════════════════════════════════════════════════════
  //  13. СБРОС ФОРМЫ
  // ══════════════════════════════════════════════════════════════════

  /** Полностью очищает форму создания карточки и уничтожает текущий кроппер. */
  function handleClearForm() {
    DOM.nameInput.value = "";
    DOM.acInput.value = "";
    DOM.speedInput.value = "";
    DOM.cardWidthInput.value = CARD_BASE.baseWidth;
    DOM.masterSideOnlyInput.checked = false;
    DOM.holderGapInput.checked = false;
    DOM.holderGapSizeInput.value = CARD_BASE.defaultHolderGap;

    currentPreviewPhotoDataUrl = "";
    currentOriginalPhotoDataUrl = "";
    DOM.imageInput.value = "";

    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    DOM.imagePreview.removeAttribute("src");

    updatePreview();
  }

  // ══════════════════════════════════════════════════════════════════
  //  14. ЭКСПОРТ В PDF
  // ══════════════════════════════════════════════════════════════════

  /**
   * Формирует и скачивает PDF со всеми карточками из списка.
   * Карточки укладываются в строки, строки — на страницы A4 (горизонтально),
   * см. алгоритм buildPdfPages ниже. html2canvas и jsPDF подгружаются лениво.
   */
  async function handleDownloadPdf() {
    if (!cards.length) {
      alert(tjs("noCards"));
      return;
    }

    await ensureHtml2canvas();
    await ensureJsPdf();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: PDF_CONFIG.orientation,
      unit: PDF_CONFIG.unit,
      format: PDF_CONFIG.format,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const layout = {
      startX: PDF_CONFIG.startX,
      startY: PDF_CONFIG.startY,
      gapX: PDF_CONFIG.gapX,
      gapY: PDF_CONFIG.gapY,
    };
    const pages = buildPdfPages(cards, pageWidth, pageHeight, layout);

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      if (pageIndex > 0) doc.addPage();

      const page = pages[pageIndex];
      // Центрируем весь блок карточек по вертикали относительно страницы
      let y = centeredOffset(pageHeight, page.contentHeight, layout.startY);

      for (const row of page.rows) {
        // И каждую строку — по горизонтали
        let x = centeredOffset(pageWidth, row.width, layout.startX);

        for (const entry of row.cards) {
          const imageDataUrl = await renderCardToDataUrl(entry.card);
          doc.addImage(imageDataUrl, "PNG", x, y, entry.width, entry.height);
          x += entry.width + layout.gapX;
        }

        y += row.height + layout.gapY;
      }
    }

    doc.save(PDF_CONFIG.fileName);
  }

  /**
   * Рендерит одну карточку в PNG через html2canvas:
   *  1. Создаёт временный DOM-элемент за пределами видимой области экрана.
   *  2. Снимает с него скриншот с двукратным масштабом (для чёткости при печати).
   *  3. Удаляет временный элемент.
   */
  async function renderCardToDataUrl(card) {
    await ensureHtml2canvas();

    const temp = document.createElement("div");
    temp.className = cardPreviewClassName(card) + " card-preview-export";
    temp.style.cssText = "position:fixed;left:-10000px;top:0";
    temp.innerHTML = buildCardMarkup(card);
    applyCardMetricsToElement(temp, card);

    document.body.appendChild(temp);
    const canvas = await html2canvas(temp, { backgroundColor: "#ffffff", scale: 2 });
    document.body.removeChild(temp);

    return canvas.toDataURL("image/png");
  }

  // ══════════════════════════════════════════════════════════════════
  //  15. АЛГОРИТМ УКЛАДКИ КАРТОЧЕК ПО СТРАНИЦАМ PDF
  // ══════════════════════════════════════════════════════════════════

  /** Создаёт пустую структуру «ряд карточек» для укладки. */
  function createEmptyRow() {
    return { cards: [], width: 0, height: 0 };
  }

  /** Создаёт пустую структуру «страница PDF» для укладки рядов. */
  function createEmptyPage() {
    return { rows: [], contentHeight: 0 };
  }

  /** Фиксирует завершённый ряд на странице, учитывая вертикальный отступ между рядами. */
  function commitRow(page, row, layout) {
    if (!row.cards.length) return;
    if (page.rows.length) page.contentHeight += layout.gapY;
    page.rows.push(row);
    page.contentHeight += row.height;
  }

  /** Прогнозирует итоговую высоту контента страницы, если добавить ещё один ряд высотой nextRowHeight. */
  function projectedPageHeight(page, nextRowHeight, layout) {
    return page.contentHeight + (page.rows.length ? layout.gapY : 0) + nextRowHeight;
  }

  /** Возвращает отступ для центрирования блока контента в контейнере, не меньше минимального отступа от края. */
  function centeredOffset(containerSize, contentSize, minOffset) {
    return Math.max(minOffset, (containerSize - contentSize) / 2);
  }

  /**
   * Раскладывает список карточек по страницам и рядам PDF-документа.
   *
   * Используется жадный (greedy) алгоритм:
   *  - пытаемся добавить очередную карточку в текущий ряд;
   *  - если по ширине не влезает — закрываем ряд и начинаем новый;
   *  - если новый ряд не влезает по высоте на текущую страницу —
   *    закрываем страницу и начинаем новую.
   *
   * Первая карточка в пустом ряду и первый ряд на пустой странице
   * принимаются безусловно — иначе одна карточка шире/выше страницы
   * заблокировала бы весь экспорт.
   */
  function buildPdfPages(cardsToPlace, pageWidth, pageHeight, layout) {
    const maxContentWidth = Math.max(pageWidth - layout.startX * 2, 0);
    const maxContentHeight = Math.max(pageHeight - layout.startY * 2, 0);

    const pages = [];
    let page = createEmptyPage();
    let row = createEmptyRow();

    cardsToPlace.forEach(card => {
      const metrics = getCardMetrics(card);
      const entry = {
        card,
        width: metrics.widthMm,
        height: card.holderGap ? metrics.heightWithHolderMm : metrics.heightMm,
      };

      const nextRowWidth = row.cards.length ? row.width + layout.gapX + entry.width : entry.width;
      const nextRowHeight = row.cards.length ? Math.max(row.height, entry.height) : entry.height;

      const fitsInCurrentRow = nextRowWidth <= maxContentWidth || !row.cards.length;
      const fitsOnCurrentPage =
        projectedPageHeight(page, nextRowHeight, layout) <= maxContentHeight ||
        (!page.rows.length && !row.cards.length);

      if (fitsInCurrentRow && fitsOnCurrentPage) {
        row.cards.push(entry);
        row.width = nextRowWidth;
        row.height = nextRowHeight;
        return;
      }

      // Текущая карточка не влезает в этот ряд на этой странице — закрываем ряд
      commitRow(page, row, layout);
      row = createEmptyRow();

      // Проверяем, влезет ли новый ряд (уже без текущей карточки) на текущую страницу
      const fitsNewRowOnCurrentPage =
        projectedPageHeight(page, entry.height, layout) <= maxContentHeight || !page.rows.length;

      if (!fitsNewRowOnCurrentPage) {
        pages.push(page);
        page = createEmptyPage();
      }

      row.cards.push(entry);
      row.width = entry.width;
      row.height = entry.height;
    });

    commitRow(page, row, layout);
    if (page.rows.length) pages.push(page);

    return pages;
  }

  // ══════════════════════════════════════════════════════════════════
  //  16. ПОСТРОЕНИЕ HTML-РАЗМЕТКИ КАРТОЧКИ
  // ══════════════════════════════════════════════════════════════════

  /** Возвращает CSS-класс контейнера превью карточки с учётом включённого держателя. */
  function cardPreviewClassName(card) {
    return `card-preview${card.holderGap ? " with-holder-gap" : ""}`;
  }

  /**
   * Строит полную разметку карточки: пунктирная линия сгиба + две половины.
   * Верхняя половина повёрнута на 180° (см. CSS .card-half.top) — при печати
   * и сгибе по линии она становится оборотной стороной, читаемой с другого края.
   *
   * В режиме «имя/КД/скорость только на одной стороне» (masterSideOnly)
   * верхняя половина получает пустые значения — она остаётся чистой для
   * того, чтобы мастер мог подписать её от руки (например, имя монстра).
   */
  function buildCardMarkup(card) {
    const topSideCard = card.masterSideOnly
      ? { ...card, name: "", ac: "", speed: "" }
      : card;

    return `
      <div class="card-cut-line"></div>
      <div class="card-half top">${buildCardHalfMarkup(topSideCard)}</div>
      <div class="card-half bottom">${buildCardHalfMarkup(card)}</div>
    `;
  }

  /** Строит разметку одной половины карточки: фото, имя, иконки статов, поле держателя. */
  function buildCardHalfMarkup(card) {
    const safeName = escapeHtml(card.name);
    const safePhotoUrl = escapeHtml(card.photoDataUrl || "");

    const photoMarkup = safePhotoUrl
      ? `<img src="${safePhotoUrl}" alt="" />`
      : "";

    return `
      <div class="card-half-content">
        <div class="card-photo">${photoMarkup}</div>
        <div class="card-name${card.name ? "" : " empty"}">${safeName || tjs("nameEmpty")}</div>
        <div class="card-stats">
          ${buildStatMarkup("shield", card.ac, STAT_ICONS.ac)}
          ${buildStatMarkup("speed", card.speed, STAT_ICONS.speed)}
        </div>
      </div>
      ${card.holderGap ? `<div class="card-bottom-gap" aria-hidden="true"></div>` : ""}
    `;
  }

  /** Строит разметку одной иконки-стата (щит для КД или ботинок для скорости). */
  function buildStatMarkup(className, value, iconSvg) {
    return `
      <div class="${className}${value ? "" : " stat-empty"}">
        <span>${value ? escapeHtml(value) : ""}</span>${iconSvg}
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════
  //  17. ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ
  // ══════════════════════════════════════════════════════════════════

  /** Зажимает число в диапазон [min, max]. */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /** Форматирует число как строку с единицей измерения «mm» (до 2 знаков после запятой, без лишних нулей). */
  const formatMm = value => `${parseFloat(value.toFixed(2))}mm`;

  /** Форматирует число как строку с единицей измерения «px» (до 2 знаков после запятой, без лишних нулей). */
  const formatPx = value => `${parseFloat(value.toFixed(2))}px`;

  /** Форматирует число без единицы измерения (до 2 знаков после запятой, без лишних нулей). */
  const formatMetricNumber = value => String(parseFloat(value.toFixed(2)));

  /**
   * Экранирует HTML-спецсимволы для безопасной вставки пользовательского
   * ввода в innerHTML. Защищает от XSS через поля имени персонажа и т.п.
   */
  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // ══════════════════════════════════════════════════════════════════
  //  СТАРТ ПРИЛОЖЕНИЯ
  // ══════════════════════════════════════════════════════════════════

  init();

});
