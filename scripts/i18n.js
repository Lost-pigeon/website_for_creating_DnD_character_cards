/**
 * Словарь переводов интерфейса.
 *
 * Структура:
 *   I18N.ru / I18N.en — строки для статических HTML-элементов (data-i18n).
 *   I18N.ru.js / I18N.en.js — строки и функции для динамического JS-кода.
 *
 * Функции в секции .js принимают параметры и возвращают готовую строку.
 * Это позволяет поддерживать интерполяцию (например, подставлять числа в подсказки).
 */
window.I18N = {

  // ────────────────────────────────────────
  //  РУССКИЙ
  // ────────────────────────────────────────
  ru: {
    // Мета-теги страницы
    pageTitle:       "D&D трекер инициативы - генератор карточек для печати",
    metaDescription: "Бесплатный онлайн-генератор карточек инициативы D&D: загрузите портрет, укажите имя, КД и скорость, выберите размер карточки и скачайте PDF для печати.",

    // Шапка и заголовок
    heroTitle:       "D&D трекер инициативы",
    brandSub:        "Инструменты мастера · D&D",
    brandAppTitle:   "Трекер инициативы",
    generatorTitle:  "Генератор печатных карточек",
    heroSubtitle:    "Загрузите портрет, введите имя, КД и скорость — получите двусторонние карточки для физического трекера инициативы в виде PDF для печати и сгиба.",
    noscript:        "Для работы генератора нужен JavaScript. Включите его в браузере, чтобы создать и скачать карточки.",

    // Заголовки панелей
    panelPortrait: "Портрет",
    panelStats:    "Характеристики",
    panelFormat:   "Формат печати",

    // Метки размера карточки в превью
    sideOnlyLabel: "одна сторона",
    sideBothLabel: "двусторонняя",

    // Форма — секция персонажа
    sectionCharacter:  "Данные персонажа",
    labelPortrait:     "Портрет персонажа",
    hintCrop:          "После выбора фото выделите область, которая попадёт на карточку.",
    imagePreviewAlt:   "Предпросмотр портрета персонажа",
    labelName:         "Имя",
    placeholderName:   "Например, Иваныч",
    labelAC:           "КД",
    labelSpeed:        "Скорость",
    labelCardWidth:    "Ширина карточки (мм)",
    labelMasterOnly:   "Имя, КД и скорость только на одной стороне",
    hintMasterOnly:    "Когда включено, вторая сторона остаётся пустой для ручного заполнения.",
    labelHolderGap:    "Добавить пустой край снизу",
    hintHolderGap:     "Добавляет поле для вставки в подставку-держатель.",
    labelHolderSize:   "Размер поля для держателя (мм)",

    // Пасхалка
    easterEgg: "✦ Золотая легендарная карта! ✦",

    // Баннер и кнопки режима редактирования
    editBannerPrefix: "Редактирование:",
    btnAdd:           "Добавить в лист",
    btnClear:         "Сбросить форму",
    btnCancel:        "Отмена",
    hintEmptyFields:  "Пустое имя оставит линию для ручного вписывания. Незаполненные КД и скорость сохранят иконки пустыми.",

    // Список карточек
    sectionList:   "В листе",
    btnClearSheet: "Очистить лист",

    // Кнопка переключения темы
    themeToDark:  "Тёмная тема",
    themeToLight: "Светлая тема",

    // Превью и печать
    sectionPreview: "Превью карточки",
    sectionPrint:   "Печать",
    printHint:      "Для сохранения реального размера при печати выбирайте режим «Реальный размер» или «100%» в Adobe Acrobat или другом просмотрщике PDF.",
    btnDownload:    "Скачать PDF лист",

    // Кнопка переключения языка
    langToggleLabel: "EN",
    langToggleTitle: "Switch to English",

    // ── Динамические строки (используются из JS-кода) ──
    js: {
      // Подсказка под полем ширины карточки
      cardSizeHint: (h, gap, total) =>
        `Высота карточки: ${h} мм, с держателем (${gap} мм): ${total} мм.`,

      // Заглушки в пустых полях карточки
      emptyList:        "Пока нет карточек в листе.",
      nameEmpty:        "__________________", // линия для ручной подписи

      // Предупреждения
      noCards:           "Добавьте хотя бы одну карточку в лист.",
      confirmClearSheet: "Удалить все карточки из листа?",

      // Лейблы в списке карточек
      unnamed:      "Без имени",
      emptyFields:  "пустые поля",
      badgeEditing: "редактируется",

      // Кнопка сохранения в режиме редактирования
      btnSave: "Сохранить изменения",
      btnAdd:  "Добавить в лист",

      // Части лейбла карточки в списке
      labelDash:    "—",
      mmSuffix:     " мм",
      oneSide:      " · одна сторона",
      holderSuffix: (gap) => ` · держатель ${gap} мм`,
    },
  },

  // ────────────────────────────────────────
  //  АНГЛИЙСКИЙ
  // ────────────────────────────────────────
  en: {
    // Meta tags
    pageTitle:       "D&D Initiative Tracker - printable card generator",
    metaDescription: "Free online D&D initiative card generator: upload a portrait, enter name, AC and speed, choose card size and download a print-ready PDF.",

    // Header and title
    heroTitle:       "D&D Initiative Tracker",
    brandSub:        "DM tools · D&D",
    brandAppTitle:   "Initiative Tracker",
    generatorTitle:  "Printable Card Generator",
    heroSubtitle:    "Upload a portrait, enter name, AC and speed — get double-sided initiative cards as a print-and-fold PDF.",
    noscript:        "JavaScript is required to use the generator. Please enable it in your browser.",

    // Panel headings
    panelPortrait: "Portrait",
    panelStats:    "Stats",
    panelFormat:   "Print Format",

    // Card size label in preview
    sideOnlyLabel: "one side",
    sideBothLabel: "double-sided",

    // Form — character section
    sectionCharacter:  "Character data",
    labelPortrait:     "Character portrait",
    hintCrop:          "After selecting a photo, crop the area that will appear on the card.",
    imagePreviewAlt:   "Character portrait preview",
    labelName:         "Name",
    placeholderName:   "e.g. Gandalf",
    labelAC:           "AC",
    labelSpeed:        "Speed",
    labelCardWidth:    "Card width (mm)",
    labelMasterOnly:   "Name, AC and speed on one side only",
    hintMasterOnly:    "When enabled, the back side stays blank for handwriting.",
    labelHolderGap:    "Add blank bottom margin",
    hintHolderGap:     "Adds a tab for inserting into a physical card holder stand.",
    labelHolderSize:   "Holder margin size (mm)",

    // Easter egg
    easterEgg: "✦ Golden Legendary Card! ✦",

    // Edit mode banner and buttons
    editBannerPrefix: "Editing:",
    btnAdd:           "Add to sheet",
    btnClear:         "Reset form",
    btnCancel:        "Cancel",
    hintEmptyFields:  "Empty name leaves a line for handwriting. Empty AC and speed keep the icons without values.",

    // Card list
    sectionList:   "Cards in sheet",
    btnClearSheet: "Clear sheet",

    // Theme toggle
    themeToDark:  "Dark theme",
    themeToLight: "Light theme",

    // Preview and print
    sectionPreview: "Card preview",
    sectionPrint:   "Print",
    printHint:      "To preserve actual size when printing, choose \"Actual size\" or \"100%\" in Adobe Acrobat or your PDF viewer.",
    btnDownload:    "Download PDF sheet",

    // Language toggle
    langToggleLabel: "RU",
    langToggleTitle: "Переключить на русский",

    // ── Dynamic strings (used from JS code) ──
    js: {
      cardSizeHint: (h, gap, total) =>
        `Card height: ${h} mm, with holder (${gap} mm): ${total} mm.`,

      emptyList:        "No cards in sheet yet.",
      nameEmpty:        "____________________",

      noCards:           "Add at least one card to the sheet.",
      confirmClearSheet: "Remove all cards from the sheet?",

      unnamed:      "Unnamed",
      emptyFields:  "empty fields",
      badgeEditing: "editing",

      btnSave: "Save changes",
      btnAdd:  "Add to sheet",

      labelDash:    "—",
      mmSuffix:     " mm",
      oneSide:      " · one side",
      holderSuffix: (gap) => ` · holder ${gap} mm`,
    },
  },

};
