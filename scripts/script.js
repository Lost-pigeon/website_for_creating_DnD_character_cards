window.addEventListener("DOMContentLoaded", () => {
  const DOM = {
    imageInput: document.getElementById("imageInput"),
    imagePreview: document.getElementById("imagePreview"),
    nameInput: document.getElementById("nameInput"),
    acInput: document.getElementById("acInput"),
    speedInput: document.getElementById("speedInput"),
    addCardBtn: document.getElementById("addCardBtn"),
    clearFormBtn: document.getElementById("clearFormBtn"),
    cardsList: document.getElementById("cardsList"),
    downloadPdfBtn: document.getElementById("downloadPdfBtn"),
    easterEgg: document.getElementById("easterEgg"),

    previewName: [
      document.getElementById("previewNameTop"),
      document.getElementById("previewNameBottom"),
    ],
    previewAC: [
      document.getElementById("previewACtop"),
      document.getElementById("previewACbottom"),
    ],
    previewSpeed: [
      document.getElementById("previewSpeedTop"),
      document.getElementById("previewSpeedBottom"),
    ],
    previewPhoto: [
      document.getElementById("previewPhotoTop"),
      document.getElementById("previewPhotoBottom"),
    ],
  };

  const CONFIG = {
    cropAspectRatio: 35 / 40,
    croppedImageWidth: 350,
    croppedImageHeight: 400,
    pdfFileName: "dnd_cards.pdf",
    pdf: {
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      cardWidth: 35,
      cardHeight: 120,
      cardsPerPage: 7,
      startX: 2,
      startY: 2,
      gapX: 4,
      gapY: 4,
      cols: 7,
    },
    placeholders: {
      name: "_______________________",
      photo: "Фото персонажа",
      emptyList: "Пока нет карточек в листе.",
    },
    icons: {
      ac: "icons/shield.svg",
      speed: "icons/speed.svg",
    },
    easterEggName: "Иваныч",
  };

  let cropper = null;
  let cards = [];

  init();

  function init() {
    bindEvents();
    updatePreview();
    renderCardsList();
  }

  function bindEvents() {
    DOM.imageInput.addEventListener("change", handleImageChange);
    DOM.nameInput.addEventListener("input", updatePreview);
    DOM.acInput.addEventListener("input", updatePreview);
    DOM.speedInput.addEventListener("input", updatePreview);
    DOM.addCardBtn.addEventListener("click", handleAddCard);
    DOM.clearFormBtn.addEventListener("click", handleClearForm);
    DOM.downloadPdfBtn.addEventListener("click", handleDownloadPdf);
  }

  function getFormData() {
    return {
      name: DOM.nameInput.value.trim(),
      ac: DOM.acInput.value.trim(),
      speed: DOM.speedInput.value.trim(),
    };
  }

  function handleImageChange(event) {
    setPreviewPhoto("");

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      DOM.imagePreview.src = reader.result;

      if (cropper) {
        cropper.destroy();
      }

      cropper = new Cropper(DOM.imagePreview, {
        aspectRatio: CONFIG.cropAspectRatio,
        viewMode: 1,
      });
    };

    reader.readAsDataURL(file);
  }

  function updatePreview() {
    const { name, ac, speed } = getFormData();

    renderNamePreview(name);
    renderStatPreview(DOM.previewAC, ac, CONFIG.icons.ac);
    renderStatPreview(DOM.previewSpeed, speed, CONFIG.icons.speed);
    toggleEasterEgg(name);
  }

  function renderNamePreview(name) {
    const hasName = Boolean(name);

    DOM.previewName.forEach((el) => {
      el.textContent = hasName ? name : CONFIG.placeholders.name;
      el.classList.toggle("empty", !hasName);
    });
  }

  function renderStatPreview(elements, value, iconSrc) {
    elements.forEach((el) => {
      el.innerHTML = "";
      el.classList.remove("stat-empty");

      if (!value) {
        el.classList.add("stat-empty");
        return;
      }

      el.append(document.createTextNode(value));

      const img = document.createElement("img");
      img.src = iconSrc;
      img.alt = "";
      el.appendChild(img);
    });
  }

  function toggleEasterEgg(name) {
    DOM.easterEgg.style.display =
      name === CONFIG.easterEggName ? "block" : "none";
  }

  function setPreviewPhoto(dataUrl) {
    DOM.previewPhoto.forEach((container) => {
      container.innerHTML = "";

      if (!dataUrl) {
        container.textContent = CONFIG.placeholders.photo;
        return;
      }

      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "Фото персонажа";
      container.appendChild(img);
    });
  }

  function getCroppedPhotoDataUrl() {
    if (!cropper) return null;

    const canvas = cropper.getCroppedCanvas({
      width: CONFIG.croppedImageWidth,
      height: CONFIG.croppedImageHeight,
    });

    return canvas.toDataURL("image/png");
  }

  function handleAddCard() {
    const { name, ac, speed } = getFormData();
    const photoDataUrl = getCroppedPhotoDataUrl();

    if (photoDataUrl) {
      setPreviewPhoto(photoDataUrl);
    }

    updatePreview();

    cards.push({
      name,
      ac,
      speed,
      photoDataUrl,
    });

    renderCardsList();
  }

  function renderCardsList() {
    DOM.cardsList.innerHTML = "";

    if (!cards.length) {
      DOM.cardsList.innerHTML = `
        <span style="font-size:12px;color:#6b7280;">
          ${CONFIG.placeholders.emptyList}
        </span>
      `;
      return;
    }

    cards.forEach((card, index) => {
      const row = document.createElement("div");
      row.className = "cards-list-item";

      const label = document.createElement("span");
      label.textContent = formatCardLabel(card);

      if (hasEmptyFields(card)) {
        const badge = document.createElement("span");
        badge.className = "mini-badge";
        badge.textContent = "есть пустые поля";
        label.appendChild(badge);
      }

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-ghost";
      removeBtn.style.padding = "4px 10px";
      removeBtn.style.fontSize = "11px";
      removeBtn.textContent = "Удалить";
      removeBtn.addEventListener("click", () => removeCard(index));

      row.append(label, removeBtn);
      DOM.cardsList.appendChild(row);
    });
  }

  function formatCardLabel(card) {
    return `${card.name || "Без имени"} | КД ${card.ac || "—"} | Скорость ${
      card.speed || "—"
    }`;
  }

  function hasEmptyFields(card) {
    return !card.name || !card.ac || !card.speed;
  }

  function removeCard(index) {
    cards.splice(index, 1);
    renderCardsList();
  }

  function handleClearForm() {
    DOM.nameInput.value = "";
    DOM.acInput.value = "";
    DOM.speedInput.value = "";

    updatePreview();

    if (cropper) {
      cropper.clear();
    }
  }

  async function handleDownloadPdf() {
    if (!cards.length) {
      alert("Добавьте хотя бы одну карточку в лист.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: CONFIG.pdf.orientation,
      unit: CONFIG.pdf.unit,
      format: CONFIG.pdf.format,
    });

    let currentX = CONFIG.pdf.startX;
    let currentY = CONFIG.pdf.startY;

    for (let i = 0; i < cards.length; i++) {
      if (i > 0 && i % CONFIG.pdf.cardsPerPage === 0) {
        doc.addPage();
        currentX = CONFIG.pdf.startX;
        currentY = CONFIG.pdf.startY;
      }

      const imgData = await renderCardToDataUrl(cards[i]);

      doc.addImage(
        imgData,
        "PNG",
        currentX,
        currentY,
        CONFIG.pdf.cardWidth,
        CONFIG.pdf.cardHeight
      );

      const isLastColumn = (i + 1) % CONFIG.pdf.cols === 0;

      if (isLastColumn) {
        currentX = CONFIG.pdf.startX;
        currentY += CONFIG.pdf.cardHeight + CONFIG.pdf.gapY;
      } else {
        currentX += CONFIG.pdf.cardWidth + CONFIG.pdf.gapX;
      }
    }

    doc.save(CONFIG.pdfFileName);
  }

  async function renderCardToDataUrl(card) {
    const temp = document.createElement("div");

    temp.style.position = "fixed";
    temp.style.left = "-10000px";
    temp.style.top = "0";
    temp.style.width = "35mm";
    temp.style.height = "120mm";
    temp.style.padding = "0";
    temp.style.background = "#ffffff";
    temp.style.border = "1px solid #000000";
    temp.style.borderRadius = "0";
    temp.style.overflow = "hidden";
    temp.style.boxSizing = "border-box";

    temp.innerHTML = buildPdfCardMarkup(card);

    document.body.appendChild(temp);

    const canvas = await html2canvas(temp, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    document.body.removeChild(temp);

    return canvas.toDataURL("image/png");
  }

  function buildPdfCardMarkup(card) {
    const photoMarkup = card.photoDataUrl
      ? `<img src="${card.photoDataUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : CONFIG.placeholders.photo;

    const nameJustify = card.name ? "center" : "flex-start";
    const nameBorder = card.name ? "none" : "1px solid #000000";
    const acColor = card.ac ? "#000000" : "#9ca3af";
    const speedColor = card.speed ? "#000000" : "#9ca3af";

    const halfMarkup = `
      <div style="width:100%;height:39.6mm;border-radius:0;border:1px solid #000000;overflow:hidden;background:#ffffff;display:flex;align-items:stretch;justify-content:center;">
        ${photoMarkup}
      </div>
      <div class="name-container" style="width:100%;min-height:20px;display:flex;flex-direction:column;justify-content:flex-end;color:#111827;">
        <div style="width:100%;min-height:14px;display:flex;align-items:center;justify-content:${nameJustify};border-bottom:${nameBorder};">
          ${card.name || ""}
        </div>
        <div class="stats-row" style="margin-top:4px;">
          <div class="stat circle" style="color:${acColor};">${card.ac || ""}</div>
          <div class="stat square" style="color:${speedColor};">${card.speed || ""}</div>
        </div>
      </div>
    `;

    return `
      <div style="position:relative;width:100%;height:100%;font-family:system-ui, sans-serif;color:#000000;font-size:14px;background:#ffffff;">
        <style>
          :root{
            --stat-size: 7mm;
            --stats-gap: 40px;
            --name-padding-top: 2px;
            --name-padding-right: 6px;
            --name-padding-bottom: 1px;
            --name-padding-left: 6px;
          }
          .card-photo { width:100%; height:39.6mm; }
          .name-container {
            padding: var(--name-padding-top) var(--name-padding-right) var(--name-padding-bottom) var(--name-padding-left);
            box-sizing: border-box;
          }
          .stats-row {
            display:flex;
            gap: var(--stats-gap);
            justify-content:center;
          }
          .stat {
            width:var(--stat-size);
            height:var(--stat-size);
            display:flex;
            align-items:center;
            justify-content:center;
            line-height:var(--stat-size);
            font-size:calc(var(--stat-size) * 0.55);
            border:1px solid #000;
            background:#fff;
          }
          .stat.circle { border-radius:50%; }
          .stat.square { border-radius:0; }
        </style>

        <div style="position:absolute;left:0;top:60mm;width:100%;height:0;border-top:1px dashed rgba(0,0,0,0.3);"></div>

        <div style="position:absolute;left:0;top:0;width:100%;height:60mm;padding:0;box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;gap:10px;transform:rotate(180deg);transform-origin:center;">
          ${halfMarkup}
        </div>

        <div style="position:absolute;left:0;bottom:0;width:100%;height:60mm;padding:0;box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;gap:10px;">
          ${halfMarkup}
        </div>
      </div>
    `;
  }
});