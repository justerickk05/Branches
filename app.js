"use strict";

const STORAGE_KEYS = {
  products: "loca_adiccion_products_v1",
  quotes: "loca_adiccion_quotes_v1",
  currentQuote: "loca_adiccion_current_quote_v1"
};

const DEFAULT_PRODUCTS = [
  {
    id: cryptoId(),
    name: "Papas preparadas",
    category: "Salado",
    defaultConsumption: 1,
    unitLabel: "vaso",
    notes: "Porción individual con salsa, limón y chile.",
    ingredients: [
      { id: cryptoId(), name: "Papas", qty: 0.08, unit: "kg", unitCost: 85 },
      { id: cryptoId(), name: "Salsa", qty: 0.03, unit: "l", unitCost: 45 },
      { id: cryptoId(), name: "Limón", qty: 0.025, unit: "kg", unitCost: 38 },
      { id: cryptoId(), name: "Chile en polvo", qty: 0.008, unit: "kg", unitCost: 120 },
      { id: cryptoId(), name: "Charola", qty: 1, unit: "pz", unitCost: 1.8 },
      { id: cryptoId(), name: "Tenedor", qty: 1, unit: "pz", unitCost: 0.45 }
    ]
  },
  {
    id: cryptoId(),
    name: "Nachos con queso",
    category: "Salado",
    defaultConsumption: 1,
    unitLabel: "charola",
    notes: "Nachos con queso amarillo, jalapeños y empaque.",
    ingredients: [
      { id: cryptoId(), name: "Totopos", qty: 0.07, unit: "kg", unitCost: 90 },
      { id: cryptoId(), name: "Queso amarillo", qty: 0.06, unit: "kg", unitCost: 110 },
      { id: cryptoId(), name: "Jalapeños", qty: 0.015, unit: "kg", unitCost: 75 },
      { id: cryptoId(), name: "Charola", qty: 1, unit: "pz", unitCost: 1.8 },
      { id: cryptoId(), name: "Tenedor", qty: 1, unit: "pz", unitCost: 0.45 }
    ]
  },
  {
    id: cryptoId(),
    name: "Gomitas enchiladas",
    category: "Dulce",
    defaultConsumption: 1,
    unitLabel: "bolsita",
    notes: "Bolsa individual de gomitas enchiladas.",
    ingredients: [
      { id: cryptoId(), name: "Gomitas", qty: 0.075, unit: "kg", unitCost: 95 },
      { id: cryptoId(), name: "Miguelito / chamoy en polvo", qty: 0.012, unit: "kg", unitCost: 130 },
      { id: cryptoId(), name: "Chamoy líquido", qty: 0.018, unit: "l", unitCost: 55 },
      { id: cryptoId(), name: "Bolsa celofán", qty: 1, unit: "pz", unitCost: 0.7 },
      { id: cryptoId(), name: "Etiqueta", qty: 1, unit: "pz", unitCost: 0.45 }
    ]
  }
];

let products = readStorage(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
let savedQuotes = readStorage(STORAGE_KEYS.quotes, []);
let quote = readStorage(STORAGE_KEYS.currentQuote, createEmptyQuote());
let ingredientDraft = [];
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindTabs();
  bindProductEvents();
  bindQuoteEvents();
  bindDataEvents();

  hydrateQuoteForm();
  renderEverything();

  if (!quote.event.date) {
    $("#qDate").valueAsDate = new Date();
    updateQuoteFromForm();
  }
}

function bindTabs() {
  $$(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;

      $$(".tab-button").forEach((btn) => btn.classList.remove("active"));
      $$(".tab-panel").forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      $(`#${target}`).classList.add("active");
    });
  });
}

function bindProductEvents() {
  $("#addIngredientBtn").addEventListener("click", addIngredientToDraft);
  $("#saveProductBtn").addEventListener("click", saveProductFromForm);
  $("#clearProductBtn").addEventListener("click", resetProductForm);

  $("#ingredientDraftBody").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-ingredient]");
    if (!button) return;

    ingredientDraft = ingredientDraft.filter((item) => item.id !== button.dataset.removeIngredient);
    renderIngredientDraft();
  });

  $("#productList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-action]");
    if (!button) return;

    const action = button.dataset.productAction;
    const productId = button.dataset.productId;

    if (action === "edit") editProduct(productId);
    if (action === "delete") deleteProduct(productId);
    if (action === "duplicate") duplicateProduct(productId);
    if (action === "quote") addProductToQuote(productId);
  });
}

function bindQuoteEvents() {
  [
    "#qClient",
    "#qType",
    "#qDate",
    "#qLocation",
    "#qPeople",
    "#qTitle",
    "#qNotes",
    "#contingencyPercent",
    "#profitPercent",
    "#discountType",
    "#discountValue",
    "#taxPercent",
    "#roundTo"
  ].forEach((selector) => {
    $(selector).addEventListener("input", () => {
      updateQuoteFromForm();
      renderEverything();
    });
  });

  $("#quoteProductSelect").addEventListener("change", () => {
    const product = getProductById($("#quoteProductSelect").value);
    $("#qConsumption").value = product ? product.defaultConsumption : 1;
  });

  $("#addQuoteItemBtn").addEventListener("click", () => {
    addProductToQuote($("#quoteProductSelect").value);
  });

  $("#quoteItemsBody").addEventListener("input", (event) => {
    const input = event.target.closest("[data-quote-field]");
    if (!input) return;

    const item = quote.items.find((quoteItem) => quoteItem.id === input.dataset.itemId);
    if (!item) return;

    item[input.dataset.quoteField] = Math.max(0, toNumber(input.value));
    persistCurrentQuote();
    renderEverything();
  });

  $("#quoteItemsBody").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-quote-item]");
    if (!button) return;

    quote.items = quote.items.filter((item) => item.id !== button.dataset.removeQuoteItem);
    persistCurrentQuote();
    renderEverything();
  });

  $("#addExpenseBtn").addEventListener("click", addExpense);
  $("#expenseBody").addEventListener("input", updateExpenseFromTable);
  $("#expenseBody").addEventListener("click", removeExpenseFromTable);

  $("#newQuoteBtn").addEventListener("click", () => {
    const hasContent = quote.items.length > 0 || quote.expenses.length > 0 || quote.event.client.trim();

    if (hasContent) {
      const confirmed = window.confirm("¿Crear una nueva cotización? Los cambios no guardados se perderán.");
      if (!confirmed) return;
    }

    quote = createEmptyQuote();
    hydrateQuoteForm();
    persistCurrentQuote();
    renderEverything();
    showToast("Cotización nueva lista.");
  });

  $("#saveQuoteBtn").addEventListener("click", saveQuote);
  $("#loadQuoteBtn").addEventListener("click", loadSelectedQuote);
  $("#deleteQuoteBtn").addEventListener("click", deleteSelectedQuote);
  $("#exportPdfBtn").addEventListener("click", exportQuotePdf);
}

function bindDataEvents() {
  $("#exportDataBtn").addEventListener("click", exportAllData);
  $("#importDataBtn").addEventListener("click", () => $("#importDataFile").click());
  $("#importDataFile").addEventListener("change", importAllData);
}

function createEmptyQuote() {
  return {
    id: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    event: {
      title: "",
      client: "",
      type: "",
      date: "",
      location: "",
      people: 50,
      notes: ""
    },
    items: [],
    expenses: [
      { id: cryptoId(), name: "Transporte", amount: 0 },
      { id: cryptoId(), name: "Empaques extra", amount: 0 }
    ],
    settings: {
      contingencyPercent: 8,
      profitPercent: 45,
      discountType: "fixed",
      discountValue: 0,
      taxPercent: 0,
      roundTo: 10
    }
  };
}

function addIngredientToDraft() {
  const name = $("#ingredientName").value.trim();
  const qty = toNumber($("#ingredientQty").value);
  const unit = $("#ingredientUnit").value;
  const unitCost = toNumber($("#ingredientCost").value);

  if (!name) {
    showToast("Escribe el nombre de la materia prima.");
    return;
  }

  if (qty <= 0) {
    showToast("La cantidad por porción debe ser mayor a 0.");
    return;
  }

  if (unitCost < 0) {
    showToast("El costo no puede ser negativo.");
    return;
  }

  ingredientDraft.push({
    id: cryptoId(),
    name,
    qty,
    unit,
    unitCost
  });

  $("#ingredientName").value = "";
  $("#ingredientQty").value = "";
  $("#ingredientCost").value = "";
  $("#ingredientName").focus();

  renderIngredientDraft();
}

function saveProductFromForm() {
  const editId = $("#productEditId").value;
  const name = $("#productName").value.trim();
  const category = $("#productCategory").value.trim() || "General";
  const defaultConsumption = toNumber($("#productDefaultConsumption").value);
  const unitLabel = $("#productUnitLabel").value.trim() || "porción";
  const notes = $("#productNotes").value.trim();

  if (!name) {
    showToast("Escribe el nombre del producto.");
    return;
  }

  if (defaultConsumption <= 0) {
    showToast("El consumo sugerido debe ser mayor a 0.");
    return;
  }

  if (ingredientDraft.length === 0) {
    showToast("Agrega al menos una materia prima.");
    return;
  }

  const productPayload = {
    id: editId || cryptoId(),
    name,
    category,
    defaultConsumption,
    unitLabel,
    notes,
    ingredients: ingredientDraft.map((ingredient) => ({ ...ingredient }))
  };

  if (editId) {
    products = products.map((product) => product.id === editId ? productPayload : product);
    showToast("Producto actualizado.");
  } else {
    products.push(productPayload);
    showToast("Producto guardado.");
  }

  writeStorage(STORAGE_KEYS.products, products);
  resetProductForm();
  renderEverything();
}

function resetProductForm() {
  $("#productEditId").value = "";
  $("#productFormTitle").textContent = "Nuevo producto";
  $("#productName").value = "";
  $("#productCategory").value = "";
  $("#productDefaultConsumption").value = "1";
  $("#productUnitLabel").value = "porción";
  $("#productNotes").value = "";
  ingredientDraft = [];
  renderIngredientDraft();
}

function editProduct(productId) {
  const product = getProductById(productId);
  if (!product) return;

  $("#productEditId").value = product.id;
  $("#productFormTitle").textContent = "Editar producto";
  $("#productName").value = product.name;
  $("#productCategory").value = product.category;
  $("#productDefaultConsumption").value = product.defaultConsumption;
  $("#productUnitLabel").value = product.unitLabel;
  $("#productNotes").value = product.notes || "";
  ingredientDraft = product.ingredients.map((ingredient) => ({ ...ingredient }));

  renderIngredientDraft();
  showTab("productos");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProduct(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const confirmed = window.confirm(`¿Eliminar "${product.name}" del catálogo?`);
  if (!confirmed) return;

  products = products.filter((item) => item.id !== productId);
  quote.items = quote.items.filter((item) => item.productId !== productId);

  writeStorage(STORAGE_KEYS.products, products);
  persistCurrentQuote();

  renderEverything();
  showToast("Producto eliminado.");
}

function duplicateProduct(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const copy = {
    ...deepClone(product),
    id: cryptoId(),
    name: `${product.name} copia`,
    ingredients: product.ingredients.map((ingredient) => ({
      ...ingredient,
      id: cryptoId()
    }))
  };

  products.push(copy);
  writeStorage(STORAGE_KEYS.products, products);
  renderEverything();
  showToast("Producto duplicado.");
}

function addProductToQuote(productId) {
  const product = getProductById(productId);

  if (!product) {
    showToast("Selecciona un producto válido.");
    return;
  }

  const consumption = Math.max(0, toNumber($("#qConsumption").value || product.defaultConsumption));
  const extraServings = Math.max(0, toNumber($("#qExtraServings").value));

  if (consumption <= 0 && extraServings <= 0) {
    showToast("Agrega consumo por persona o porciones extra.");
    return;
  }

  quote.items.push({
    id: cryptoId(),
    productId: product.id,
    productSnapshot: deepClone(product),
    consumption,
    extraServings
  });

  $("#qConsumption").value = product.defaultConsumption;
  $("#qExtraServings").value = "0";

  persistCurrentQuote();
  renderEverything();
  showTab("cotizacion");
  showToast("Producto agregado a la cotización.");
}

function addExpense() {
  const name = $("#expenseName").value.trim();
  const amount = toNumber($("#expenseAmount").value);

  if (!name) {
    showToast("Escribe el concepto del gasto.");
    return;
  }

  if (amount < 0) {
    showToast("El gasto no puede ser negativo.");
    return;
  }

  quote.expenses.push({
    id: cryptoId(),
    name,
    amount
  });

  $("#expenseName").value = "";
  $("#expenseAmount").value = "";

  persistCurrentQuote();
  renderEverything();
}

function updateExpenseFromTable(event) {
  const input = event.target.closest("[data-expense-field]");
  if (!input) return;

  const expense = quote.expenses.find((item) => item.id === input.dataset.expenseId);
  if (!expense) return;

  const field = input.dataset.expenseField;

  if (field === "name") {
    expense.name = input.value;
  }

  if (field === "amount") {
    expense.amount = Math.max(0, toNumber(input.value));
  }

  persistCurrentQuote();
  renderEverything();
}

function removeExpenseFromTable(event) {
  const button = event.target.closest("[data-remove-expense]");
  if (!button) return;

  quote.expenses = quote.expenses.filter((expense) => expense.id !== button.dataset.removeExpense);
  persistCurrentQuote();
  renderEverything();
}

function updateQuoteFromForm() {
  quote.event.client = $("#qClient").value.trim();
  quote.event.type = $("#qType").value.trim();
  quote.event.date = $("#qDate").value;
  quote.event.location = $("#qLocation").value.trim();
  quote.event.people = Math.max(1, Math.round(toNumber($("#qPeople").value) || 1));
  quote.event.title = $("#qTitle").value.trim();
  quote.event.notes = $("#qNotes").value.trim();

  quote.settings.contingencyPercent = Math.max(0, toNumber($("#contingencyPercent").value));
  quote.settings.profitPercent = Math.max(0, toNumber($("#profitPercent").value));
  quote.settings.discountType = $("#discountType").value;
  quote.settings.discountValue = Math.max(0, toNumber($("#discountValue").value));
  quote.settings.taxPercent = Math.max(0, toNumber($("#taxPercent").value));
  quote.settings.roundTo = Math.max(1, Math.round(toNumber($("#roundTo").value) || 1));

  quote.updatedAt = new Date().toISOString();
  persistCurrentQuote();
}

function hydrateQuoteForm() {
  $("#qClient").value = quote.event.client || "";
  $("#qType").value = quote.event.type || "";
  $("#qDate").value = quote.event.date || "";
  $("#qLocation").value = quote.event.location || "";
  $("#qPeople").value = quote.event.people || 1;
  $("#qTitle").value = quote.event.title || "";
  $("#qNotes").value = quote.event.notes || "";

  $("#contingencyPercent").value = quote.settings.contingencyPercent ?? 0;
  $("#profitPercent").value = quote.settings.profitPercent ?? 0;
  $("#discountType").value = quote.settings.discountType || "fixed";
  $("#discountValue").value = quote.settings.discountValue ?? 0;
  $("#taxPercent").value = quote.settings.taxPercent ?? 0;
  $("#roundTo").value = quote.settings.roundTo || 1;
}

function saveQuote() {
  updateQuoteFromForm();

  if (quote.items.length === 0) {
    showToast("Agrega al menos un producto antes de guardar.");
    return;
  }

  const quoteName = getQuoteDisplayName(quote);

  if (!quote.id) {
    quote.id = cryptoId();
    quote.createdAt = new Date().toISOString();
  }

  quote.updatedAt = new Date().toISOString();

  const storedQuote = deepClone(quote);
  const existingIndex = savedQuotes.findIndex((item) => item.id === quote.id);

  if (existingIndex >= 0) {
    savedQuotes[existingIndex] = storedQuote;
  } else {
    savedQuotes.push(storedQuote);
  }

  writeStorage(STORAGE_KEYS.quotes, savedQuotes);
  persistCurrentQuote();
  renderSavedQuotes();

  showToast(`Cotización guardada: ${quoteName}`);
}

function loadSelectedQuote() {
  const quoteId = $("#savedQuotesSelect").value;
  const selectedQuote = savedQuotes.find((item) => item.id === quoteId);

  if (!selectedQuote) {
    showToast("Selecciona una cotización guardada.");
    return;
  }

  quote = deepClone(selectedQuote);
  hydrateQuoteForm();
  persistCurrentQuote();
  renderEverything();
  showToast("Cotización cargada.");
}

function deleteSelectedQuote() {
  const quoteId = $("#savedQuotesSelect").value;
  const selectedQuote = savedQuotes.find((item) => item.id === quoteId);

  if (!selectedQuote) {
    showToast("Selecciona una cotización guardada.");
    return;
  }

  const confirmed = window.confirm(`¿Eliminar "${getQuoteDisplayName(selectedQuote)}"?`);
  if (!confirmed) return;

  savedQuotes = savedQuotes.filter((item) => item.id !== quoteId);
  writeStorage(STORAGE_KEYS.quotes, savedQuotes);

  if (quote.id === quoteId) {
    quote = createEmptyQuote();
    hydrateQuoteForm();
    persistCurrentQuote();
  }

  renderEverything();
  showToast("Cotización eliminada.");
}

function calculateQuote() {
  const people = Math.max(1, Math.round(toNumber(quote.event.people) || 1));
  const contingencyRate = Math.max(0, toNumber(quote.settings.contingencyPercent)) / 100;
  const purchaseMap = new Map();
  const lineStats = [];

  quote.items.forEach((item) => {
    const product = getProductById(item.productId) || item.productSnapshot;
    if (!product) return;

    const consumption = Math.max(0, toNumber(item.consumption));
    const extraServings = Math.max(0, toNumber(item.extraServings));
    const servings = people * consumption + extraServings;

    let productCost = 0;

    product.ingredients.forEach((ingredient) => {
      const baseQty = Math.max(0, toNumber(ingredient.qty)) * servings;
      const buyQty = baseQty * (1 + contingencyRate);
      const unitCost = Math.max(0, toNumber(ingredient.unitCost));
      const ingredientCost = buyQty * unitCost;

      productCost += ingredientCost;

      const key = `${normalizeKey(ingredient.name)}|${ingredient.unit}`;

      if (!purchaseMap.has(key)) {
        purchaseMap.set(key, {
          name: ingredient.name,
          unit: ingredient.unit,
          baseQty: 0,
          buyQty: 0,
          totalCost: 0,
          products: new Set()
        });
      }

      const row = purchaseMap.get(key);
      row.baseQty += baseQty;
      row.buyQty += buyQty;
      row.totalCost += ingredientCost;
      row.products.add(product.name);
    });

    lineStats.push({
      productName: product.name,
      category: product.category,
      unitLabel: product.unitLabel,
      consumption,
      extraServings,
      servings,
      totalCost: productCost,
      costPerServing: servings > 0 ? productCost / servings : 0
    });
  });

  const purchaseRows = Array.from(purchaseMap.values())
    .map((row) => ({
      ...row,
      products: Array.from(row.products)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const materialSubtotal = purchaseRows.reduce((sum, row) => sum + row.totalCost, 0);
  const expensesTotal = quote.expenses.reduce((sum, expense) => sum + Math.max(0, toNumber(expense.amount)), 0);
  const baseCost = materialSubtotal + expensesTotal;

  const profitRate = Math.max(0, toNumber(quote.settings.profitPercent)) / 100;
  const targetProfit = baseCost * profitRate;

  const subtotalBeforeDiscount = baseCost + targetProfit;
  const discountValue = Math.max(0, toNumber(quote.settings.discountValue));

  const discountAmount = quote.settings.discountType === "percent"
    ? subtotalBeforeDiscount * (discountValue / 100)
    : discountValue;

  const safeDiscount = Math.min(discountAmount, subtotalBeforeDiscount);
  const subtotalAfterDiscount = subtotalBeforeDiscount - safeDiscount;

  const taxAmount = subtotalAfterDiscount * (Math.max(0, toNumber(quote.settings.taxPercent)) / 100);
  const rawTotal = subtotalAfterDiscount + taxAmount;

  const roundTo = Math.max(1, Math.round(toNumber(quote.settings.roundTo) || 1));
  const totalCharge = roundUp(rawTotal, roundTo);
  const roundingAdjustment = totalCharge - rawTotal;

  const netProfit = totalCharge - taxAmount - baseCost;
  const perPerson = totalCharge / people;
  const marginPercent = totalCharge > 0 ? (netProfit / totalCharge) * 100 : 0;
  const roiPercent = baseCost > 0 ? (netProfit / baseCost) * 100 : 0;

  return {
    people,
    purchaseRows,
    lineStats,
    materialSubtotal,
    expensesTotal,
    baseCost,
    targetProfit,
    subtotalBeforeDiscount,
    discountAmount: safeDiscount,
    subtotalAfterDiscount,
    taxAmount,
    rawTotal,
    totalCharge,
    roundingAdjustment,
    netProfit,
    perPerson,
    marginPercent,
    roiPercent
  };
}

function renderEverything() {
  renderIngredientDraft();
  renderProducts();
  renderProductSelect();
  renderQuoteItems();
  renderExpenses();
  renderSavedQuotes();
  renderStats();
}

function renderIngredientDraft() {
  const body = $("#ingredientDraftBody");

  if (ingredientDraft.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">Aún no hay materias primas en este producto.</div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = ingredientDraft.map((ingredient) => {
    const cost = toNumber(ingredient.qty) * toNumber(ingredient.unitCost);

    return `
      <tr>
        <td>${escapeHTML(ingredient.name)}</td>
        <td>${formatQty(ingredient.qty)} ${escapeHTML(ingredient.unit)}</td>
        <td>${formatMoney(ingredient.unitCost)} / ${escapeHTML(ingredient.unit)}</td>
        <td>${formatMoney(cost)}</td>
        <td>
          <button class="icon-button danger" type="button" data-remove-ingredient="${ingredient.id}" title="Eliminar">
            ×
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderProducts() {
  const container = $("#productList");

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No hay productos guardados. Crea el primero para empezar a cotizar.
      </div>
    `;
    return;
  }

  container.innerHTML = products.map((product) => {
    const cost = getProductCostPerServing(product);
    const ingredientsText = product.ingredients
      .slice(0, 4)
      .map((ingredient) => escapeHTML(ingredient.name))
      .join(", ");

    const extraCount = Math.max(0, product.ingredients.length - 4);

    return `
      <article class="product-card">
        <div class="product-card-header">
          <div>
            <h3>${escapeHTML(product.name)}</h3>
            <p>${escapeHTML(product.notes || "Sin notas.")}</p>
          </div>
        </div>

        <div class="product-meta">
          <span class="badge primary">${escapeHTML(product.category || "General")}</span>
          <span class="badge">${formatQty(product.defaultConsumption)} ${escapeHTML(product.unitLabel || "porción")} / persona</span>
          <span class="badge success">${formatMoney(cost)} por ${escapeHTML(product.unitLabel || "porción")}</span>
        </div>

        <p>
          <strong>Materias primas:</strong>
          ${ingredientsText}${extraCount > 0 ? ` y ${extraCount} más` : ""}
        </p>

        <div class="product-actions">
          <button class="primary-button" type="button" data-product-action="quote" data-product-id="${product.id}">
            Cotizar
          </button>
          <button class="ghost-button" type="button" data-product-action="edit" data-product-id="${product.id}">
            Editar
          </button>
          <button class="ghost-button" type="button" data-product-action="duplicate" data-product-id="${product.id}">
            Duplicar
          </button>
          <button class="danger-button" type="button" data-product-action="delete" data-product-id="${product.id}">
            Eliminar
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function renderProductSelect() {
  const select = $("#quoteProductSelect");

  if (products.length === 0) {
    select.innerHTML = `<option value="">No hay productos</option>`;
    return;
  }

  const currentValue = select.value;
  select.innerHTML = products.map((product) => `
    <option value="${product.id}">
      ${escapeHTML(product.name)} — ${formatMoney(getProductCostPerServing(product))} por ${escapeHTML(product.unitLabel || "porción")}
    </option>
  `).join("");

  if (products.some((product) => product.id === currentValue)) {
    select.value = currentValue;
  }

  const selectedProduct = getProductById(select.value) || products[0];

  if (selectedProduct && !$("#qConsumption").value) {
    $("#qConsumption").value = selectedProduct.defaultConsumption;
  }
}

function renderQuoteItems() {
  const body = $("#quoteItemsBody");
  const result = calculateQuote();

  if (quote.items.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">Agrega productos para calcular la cotización.</div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = quote.items.map((item) => {
    const product = getProductById(item.productId) || item.productSnapshot;
    const line = result.lineStats.find((lineItem) => {
      const expectedServings = result.people * toNumber(item.consumption) + toNumber(item.extraServings);
      return lineItem.productName === product?.name && Math.abs(lineItem.servings - expectedServings) < 0.0001;
    });

    const servings = result.people * toNumber(item.consumption) + toNumber(item.extraServings);
    const estimatedCost = line ? line.totalCost : 0;

    return `
      <tr>
        <td>
          <strong>${escapeHTML(product?.name || "Producto eliminado")}</strong>
          <br>
          <small>${escapeHTML(product?.category || "Sin categoría")}</small>
        </td>
        <td>
          <input
            type="number"
            min="0"
            step="0.01"
            value="${toNumber(item.consumption)}"
            data-item-id="${item.id}"
            data-quote-field="consumption"
          />
        </td>
        <td>
          <input
            type="number"
            min="0"
            step="1"
            value="${toNumber(item.extraServings)}"
            data-item-id="${item.id}"
            data-quote-field="extraServings"
          />
        </td>
        <td>${formatQty(servings)}</td>
        <td>${formatMoney(estimatedCost)}</td>
        <td>
          <button class="icon-button danger" type="button" data-remove-quote-item="${item.id}" title="Eliminar">
            ×
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderExpenses() {
  const body = $("#expenseBody");

  if (quote.expenses.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="3">
          <div class="empty-state">Sin gastos extra agregados.</div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = quote.expenses.map((expense) => `
    <tr>
      <td>
        <input
          type="text"
          value="${escapeAttr(expense.name)}"
          data-expense-id="${expense.id}"
          data-expense-field="name"
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          value="${toNumber(expense.amount)}"
          data-expense-id="${expense.id}"
          data-expense-field="amount"
        />
      </td>
      <td>
        <button class="icon-button danger" type="button" data-remove-expense="${expense.id}" title="Eliminar">
          ×
        </button>
      </td>
    </tr>
  `).join("");
}

function renderSavedQuotes() {
  const select = $("#savedQuotesSelect");

  if (savedQuotes.length === 0) {
    select.innerHTML = `<option value="">Sin cotizaciones guardadas</option>`;
    return;
  }

  const sortedQuotes = [...savedQuotes].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  select.innerHTML = sortedQuotes.map((item) => `
    <option value="${item.id}">
      ${escapeHTML(getQuoteDisplayName(item))}
    </option>
  `).join("");

  if (quote.id && savedQuotes.some((item) => item.id === quote.id)) {
    select.value = quote.id;
  }
}

function renderStats() {
  const result = calculateQuote();

  $("#heroTotal").textContent = formatMoney(result.totalCharge);
  $("#heroProfit").textContent = `Ganancia estimada: ${formatMoney(result.netProfit)}`;

  $("#statMaterials").textContent = formatMoney(result.materialSubtotal);
  $("#statExpenses").textContent = formatMoney(result.expensesTotal);
  $("#statBaseCost").textContent = formatMoney(result.baseCost);
  $("#statTotalCharge").textContent = formatMoney(result.totalCharge);
  $("#statNetProfit").textContent = formatMoney(result.netProfit);
  $("#statPerPerson").textContent = formatMoney(result.perPerson);

  $("#summaryTargetProfit").textContent = formatMoney(result.targetProfit);
  $("#summaryDiscount").textContent = formatMoney(result.discountAmount);
  $("#summaryTax").textContent = formatMoney(result.taxAmount);
  $("#summaryRounding").textContent = formatMoney(result.roundingAdjustment);
  $("#summaryMargin").textContent = `${formatPercent(result.marginPercent)}`;
  $("#summaryRoi").textContent = `${formatPercent(result.roiPercent)}`;

  renderPurchaseTable(result.purchaseRows);
  renderLineStats(result.lineStats);
  renderExpenseStats();
  renderBarChart(result);
}

function renderPurchaseTable(rows) {
  const body = $("#purchaseBody");

  if (rows.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">Agrega productos para ver la lista de compras.</div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = rows.map((row) => `
    <tr>
      <td>
        <strong>${escapeHTML(row.name)}</strong>
        <br>
        <small>Usado en: ${escapeHTML(row.products.join(", "))}</small>
      </td>
      <td>${formatQty(row.baseQty)} ${escapeHTML(row.unit)}</td>
      <td>${formatQty(row.buyQty)} ${escapeHTML(row.unit)}</td>
      <td>${formatMoney(row.totalCost)}</td>
    </tr>
  `).join("");
}

function renderLineStats(lines) {
  const body = $("#lineStatsBody");

  if (lines.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">Sin productos cotizados.</div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = lines.map((line) => `
    <tr>
      <td>
        <strong>${escapeHTML(line.productName)}</strong>
        <br>
        <small>${escapeHTML(line.category || "General")}</small>
      </td>
      <td>${formatQty(line.servings)} ${escapeHTML(line.unitLabel || "porciones")}</td>
      <td>${formatMoney(line.totalCost)}</td>
      <td>${formatMoney(line.costPerServing)}</td>
    </tr>
  `).join("");
}

function renderExpenseStats() {
  const body = $("#expenseStatsBody");
  const expenses = quote.expenses.filter((expense) => toNumber(expense.amount) > 0 || expense.name.trim());

  if (expenses.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="2">
          <div class="empty-state">Sin gastos registrados.</div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = expenses.map((expense) => `
    <tr>
      <td>${escapeHTML(expense.name || "Gasto sin nombre")}</td>
      <td>${formatMoney(expense.amount)}</td>
    </tr>
  `).join("");
}

function renderBarChart(result) {
  const chart = $("#barChart");

  const rows = [
    { label: "Materia prima", value: result.materialSubtotal },
    { label: "Gastos extra", value: result.expensesTotal },
    { label: "Ganancia neta", value: Math.max(0, result.netProfit) },
    { label: "Descuento", value: result.discountAmount },
    { label: "Impuesto", value: result.taxAmount }
  ];

  const max = Math.max(...rows.map((row) => row.value), 1);

  chart.innerHTML = rows.map((row) => {
    const width = Math.max(2, (row.value / max) * 100);

    return `
      <div class="bar-row">
        <div class="bar-row-top">
          <span>${escapeHTML(row.label)}</span>
          <strong>${formatMoney(row.value)}</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function exportQuotePdf() {
  updateQuoteFromForm();

  if (quote.items.length === 0) {
    showToast("Agrega productos antes de exportar el PDF.");
    return;
  }

  const result = calculateQuote();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const accent = [255, 61, 139];
  const purple = [109, 61, 245];
  const dark = [33, 24, 39];

  doc.setFillColor(...accent);
  doc.roundedRect(margin, 12, pageWidth - margin * 2, 28, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Loca Adicción", margin + 6, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Cotización profesional de barra de snacks", margin + 6, 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(formatMoney(result.totalCharge), pageWidth - margin - 6, 25, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Total recomendado", pageWidth - margin - 6, 32, { align: "right" });

  doc.setTextColor(...dark);

  const eventRows = [
    ["Cliente", quote.event.client || "No especificado"],
    ["Evento", quote.event.type || "No especificado"],
    ["Fecha", quote.event.date ? formatDate(quote.event.date) : "No especificada"],
    ["Lugar", quote.event.location || "No especificado"],
    ["Personas", String(result.people)],
    ["Cotización", getQuoteDisplayName(quote)]
  ];

  doc.autoTable({
    startY: 48,
    head: [["Dato", "Información"]],
    body: eventRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.6
    },
    headStyles: {
      fillColor: purple,
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold" },
      1: { cellWidth: "auto" }
    },
    margin: { left: margin, right: margin }
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Concepto", "Monto"]],
    body: [
      ["Materia prima", formatMoney(result.materialSubtotal)],
      ["Gastos extra", formatMoney(result.expensesTotal)],
      ["Costo total", formatMoney(result.baseCost)],
      [`Ganancia objetivo (${formatPercent(quote.settings.profitPercent)})`, formatMoney(result.targetProfit)],
      ["Descuento", `-${formatMoney(result.discountAmount)}`],
      ["Impuesto", formatMoney(result.taxAmount)],
      ["Ajuste por redondeo", formatMoney(result.roundingAdjustment)],
      ["TOTAL A COBRAR", formatMoney(result.totalCharge)],
      ["Ganancia estimada", formatMoney(result.netProfit)],
      ["Precio por persona", formatMoney(result.perPerson)]
    ],
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.8
    },
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    didParseCell(data) {
      if (data.section === "body" && data.row.index === 7) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [255, 224, 238];
        data.cell.styles.textColor = dark;
      }
    },
    margin: { left: margin, right: margin }
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Producto", "Consumo/persona", "Extras", "Porciones", "Costo"]],
    body: result.lineStats.map((line) => [
      line.productName,
      formatQty(line.consumption),
      formatQty(line.extraServings),
      formatQty(line.servings),
      formatMoney(line.totalCost)
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 2.5
    },
    headStyles: {
      fillColor: dark,
      textColor: [255, 255, 255]
    },
    margin: { left: margin, right: margin }
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Materia prima", "Cantidad base", "Cantidad con merma", "Costo"]],
    body: result.purchaseRows.map((row) => [
      row.name,
      `${formatQty(row.baseQty)} ${row.unit}`,
      `${formatQty(row.buyQty)} ${row.unit}`,
      formatMoney(row.totalCost)
    ]),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: 8.2,
      cellPadding: 2.4
    },
    headStyles: {
      fillColor: purple,
      textColor: [255, 255, 255]
    },
    margin: { left: margin, right: margin }
  });

  if (quote.expenses.length > 0) {
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Gasto", "Monto"]],
      body: quote.expenses.map((expense) => [
        expense.name || "Gasto sin nombre",
        formatMoney(expense.amount)
      ]),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 2.5
      },
      headStyles: {
        fillColor: accent,
        textColor: [255, 255, 255]
      },
      margin: { left: margin, right: margin }
    });
  }

  if (quote.event.notes) {
    const finalY = doc.lastAutoTable.finalY + 10;
    const availableY = doc.internal.pageSize.getHeight() - 30;

    if (finalY > availableY) {
      doc.addPage();
    }

    const y = finalY > availableY ? 20 : finalY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text("Notas", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(quote.event.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, y + 7);
  }

  addPdfFooters(doc);

  const fileName = sanitizeFileName(`Cotizacion_Loca_Adiccion_${getQuoteDisplayName(quote)}.pdf`);
  doc.save(fileName);
  showToast("PDF exportado.");
}

function addPdfFooters(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 104, 120);
    doc.text(
      `Generado el ${formatDateTime(new Date())} · Página ${page} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }
}

function exportAllData() {
  const payload = {
    app: "Loca Adiccion Cotizador",
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    quotes: savedQuotes
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `loca-adiccion-datos-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showToast("Datos exportados.");
}

function importAllData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));

      if (!Array.isArray(payload.products)) {
        throw new Error("Archivo inválido: no contiene productos.");
      }

      const confirmed = window.confirm("Esto reemplazará productos y cotizaciones guardadas. ¿Continuar?");
      if (!confirmed) return;

      products = payload.products.map(normalizeProduct);
      savedQuotes = Array.isArray(payload.quotes) ? payload.quotes : [];
      quote = createEmptyQuote();

      writeStorage(STORAGE_KEYS.products, products);
      writeStorage(STORAGE_KEYS.quotes, savedQuotes);
      persistCurrentQuote();

      hydrateQuoteForm();
      resetProductForm();
      renderEverything();

      showToast("Datos importados correctamente.");
    } catch (error) {
      console.error(error);
      showToast("No se pudo importar el archivo.");
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

function normalizeProduct(product) {
  return {
    id: product.id || cryptoId(),
    name: String(product.name || "Producto sin nombre"),
    category: String(product.category || "General"),
    defaultConsumption: Math.max(0.01, toNumber(product.defaultConsumption) || 1),
    unitLabel: String(product.unitLabel || "porción"),
    notes: String(product.notes || ""),
    ingredients: Array.isArray(product.ingredients)
      ? product.ingredients.map((ingredient) => ({
          id: ingredient.id || cryptoId(),
          name: String(ingredient.name || "Materia prima"),
          qty: Math.max(0, toNumber(ingredient.qty)),
          unit: String(ingredient.unit || "pz"),
          unitCost: Math.max(0, toNumber(ingredient.unitCost))
        }))
      : []
  };
}

function getProductById(productId) {
  return products.find((product) => product.id === productId);
}

function getProductCostPerServing(product) {
  return product.ingredients.reduce((sum, ingredient) => {
    return sum + toNumber(ingredient.qty) * toNumber(ingredient.unitCost);
  }, 0);
}

function getQuoteDisplayName(targetQuote) {
  const title = targetQuote.event.title?.trim();
  const client = targetQuote.event.client?.trim();
  const date = targetQuote.event.date ? formatDate(targetQuote.event.date) : "";

  if (title) return title;
  if (client && date) return `${client} · ${date}`;
  if (client) return client;
  if (date) return `Evento ${date}`;

  return "Cotización sin nombre";
}

function showTab(tabId) {
  $$(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  $$(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function persistCurrentQuote() {
  writeStorage(STORAGE_KEYS.currentQuote, quote);
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return deepClone(fallback);
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`No se pudo leer ${key}`, error);
    return deepClone(fallback);
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`No se pudo guardar ${key}`, error);
    showToast("El navegador no permitió guardar los datos.");
  }
}

function cryptoId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function roundUp(value, multiple) {
  if (multiple <= 0) return value;
  return Math.ceil(value / multiple) * multiple;
}

function normalizeKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(toNumber(value));
}

function formatQty(value) {
  const number = toNumber(value);

  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: number < 10 ? 3 : 2
  }).format(number);
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(toNumber(value))}%`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function sanitizeFileName(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}