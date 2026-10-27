
"use strict";

const STORAGE_KEY = "leaf_letter_library_v1";

const starterBooks = [
  { id: 1, title: "The Alchemist", author: "Paulo Coelho", isbn: "9780061122415", category: "Fiction", quantity: 8, issued: 3 },
  { id: 2, title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", category: "Self-Help", quantity: 6, issued: 2 },
  { id: 3, title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Technology", quantity: 5, issued: 4 },
  { id: 4, title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", category: "Science", quantity: 7, issued: 1 },
  { id: 5, title: "Wings of Fire", author: "A. P. J. Abdul Kalam", isbn: "9788173711466", category: "Biography", quantity: 10, issued: 6 },
  { id: 6, title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "Literature", quantity: 4, issued: 4 },
  { id: 7, title: "Think and Grow Rich", author: "Napoleon Hill", isbn: "9781585424337", category: "Business", quantity: 6, issued: 0 },
  { id: 8, title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "9780262046305", category: "Education", quantity: 5, issued: 2 },
  { id: 9, title: "India After Gandhi", author: "Ramachandra Guha", isbn: "9780060198817", category: "History", quantity: 3, issued: 1 },
  { id: 10, title: "Oxford English Dictionary", author: "Oxford University Press", isbn: "9780199571123", category: "Reference", quantity: 4, issued: 0 }
];

const $ = id => document.getElementById(id);

const ui = {
  titles: $("totalTitles"),
  copies: $("totalCopies"),
  available: $("availableCopies"),
  issued: $("issuedCopies"),
  search: $("searchInput"),
  category: $("categoryFilter"),
  availability: $("availabilityFilter"),
  grid: $("bookGrid"),
  empty: $("emptyState"),
  results: $("resultsCount"),
  label: $("resultsLabel"),
  modal: $("bookModal"),
  form: $("bookForm"),
  id: $("bookId"),
  title: $("bookTitle"),
  author: $("bookAuthor"),
  isbn: $("bookIsbn"),
  categoryInput: $("bookCategory"),
  quantity: $("bookQuantity"),
  modalTitle: $("modalTitle"),
  saveButton: $("saveBookBtn"),
  error: $("formError"),
  toast: $("toast")
};

function loadBooks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored !== null) {
      const data = JSON.parse(stored);

      if (Array.isArray(data)) {
        return data.filter(book =>
          book &&
          Number.isSafeInteger(book.id) &&
          typeof book.title === "string" &&
          typeof book.author === "string" &&
          typeof book.isbn === "string" &&
          typeof book.category === "string" &&
          Number.isInteger(book.quantity) &&
          book.quantity >= 1 &&
          Number.isInteger(book.issued) &&
          book.issued >= 0 &&
          book.issued <= book.quantity
        );
      }
    }
  } catch (error) {
    console.warn("Unable to load saved books.", error);
  }

  return starterBooks.map(book => ({ ...book }));
}

let books = loadBooks();
let nextId = Math.max(0, ...books.map(book => book.id)) + 1;
let toastTimer;

function saveBooks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return true;
  } catch (error) {
    console.error("Unable to save books.", error);
    notify("Unable to save data in this browser.", true);
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function availableCount(book) {
  return book.quantity - book.issued;
}

function notify(message, isError = false) {
  clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.style.color = isError ? "#b83d48" : "#315b40";
  ui.toast.style.borderColor = isError ? "#f0c8c8" : "#d8e7d4";
  ui.toast.classList.add("show");

  toastTimer = setTimeout(() => {
    ui.toast.classList.remove("show");
  }, 3000);
}

function updateDashboard() {
  const totalCopies = books.reduce(
    (sum, book) => sum + book.quantity, 0
  );

  const issuedCopies = books.reduce(
    (sum, book) => sum + book.issued, 0
  );

  ui.titles.textContent = books.length;
  ui.copies.textContent = totalCopies;
  ui.issued.textContent = issuedCopies;
  ui.available.textContent = totalCopies - issuedCopies;
}

function updateCategories() {
  const previous = ui.category.value;

  const categories = [...new Set(
    books.map(book => book.category)
  )].sort((a, b) => a.localeCompare(b));

  ui.category.innerHTML =
    '<option value="">All Categories</option>' +
    categories.map(category =>
      `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
    ).join("");

  if (categories.includes(previous)) {
    ui.category.value = previous;
  }
}

function getFilteredBooks() {
  const query = ui.search.value.trim().toLowerCase();
  const category = ui.category.value;
  const status = ui.availability.value;

  return books.filter(book => {
    const matchesSearch = [
      book.title,
      book.author,
      book.isbn
    ].some(value => value.toLowerCase().includes(query));

    const matchesCategory =
      !category || book.category === category;

    const available = availableCount(book);
    let matchesStatus = true;

    if (status === "available") {
      matchesStatus = available > 0;
    } else if (status === "issued") {
      matchesStatus = available === 0 && book.issued > 0;
    } else if (status === "out") {
      matchesStatus = available === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });
}

function renderBooks() {
  updateDashboard();
  updateCategories();

  const filtered = getFilteredBooks();

  ui.results.textContent =
    `${filtered.length} ${filtered.length === 1 ? "title" : "titles"}`;

  ui.label.textContent =
    ui.search.value.trim() ||
    ui.category.value ||
    ui.availability.value
      ? "Search Results"
      : "All Books";

  ui.empty.hidden = filtered.length > 0;

  if (filtered.length === 0) {
    ui.grid.innerHTML = "";
    return;
  }

  ui.grid.innerHTML = filtered.map(book => {
    const available = availableCount(book);
    const percentage = Math.round(
      available / book.quantity * 100
    );

    let status = "Available";
    let statusClass = "";

    if (available === 0 && book.issued > 0) {
      status = "Fully Issued";
      statusClass = "issued";
    } else if (available === 0) {
      status = "Out of Stock";
      statusClass = "out";
    }

    const coverClass = Math.abs(book.id) % 8 + 1;

    return `
      <article class="book-card">
        <div class="cover-area cover-${coverClass}">
          <span class="book-status ${statusClass}">
            ${status}
          </span>

          <div class="cover-illustration">
            ${escapeHTML(book.title)}
          </div>
        </div>

        <div class="card-content">
          <span class="card-category">
            ${escapeHTML(book.category)}
          </span>

          <h3>${escapeHTML(book.title)}</h3>

          <p class="card-author">
            by ${escapeHTML(book.author)}
          </p>

          <p class="card-isbn">
            ISBN: ${escapeHTML(book.isbn)}
          </p>

          <div class="copy-info">
            <span>Available Copies</span>
            <strong>${available} / ${book.quantity}</strong>
          </div>

          <div class="stock-track">
            <div class="stock-fill" style="width:${percentage}%"></div>
          </div>

          <div class="card-actions">
            <button class="card-action"
              data-action="issue" data-id="${book.id}"
              ${available === 0 ? "disabled" : ""}>
              Issue
            </button>

            <button class="card-action"
              data-action="return" data-id="${book.id}"
              ${book.issued === 0 ? "disabled" : ""}>
              Return
            </button>

            <button class="card-action"
              data-action="edit" data-id="${book.id}">
              Edit
            </button>

            <button class="card-action delete"
              data-action="delete" data-id="${book.id}">
              Delete
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function openModal(book = null) {
  ui.form.reset();
  ui.error.textContent = "";
  ui.id.value = book ? book.id : "";

  ui.modalTitle.textContent =
    book ? "Edit Book Details" : "Add a Book";

  ui.saveButton.textContent =
    book ? "Save Changes" : "Save Book";

  ui.quantity.value = book ? book.quantity : 1;

  if (book) {
    ui.title.value = book.title;
    ui.author.value = book.author;
    ui.isbn.value = book.isbn;
    ui.categoryInput.value = book.category;
  }

  ui.modal.hidden = false;
  document.body.style.overflow = "hidden";
  ui.title.focus();
}

function closeModal() {
  ui.modal.hidden = true;
  document.body.style.overflow = "";
  ui.error.textContent = "";
}

function handleSave(event) {
  event.preventDefault();
  ui.error.textContent = "";

  const idValue = ui.id.value;
  const title = ui.title.value.trim();
  const author = ui.author.value.trim();
  const isbn = ui.isbn.value.trim();
  const category = ui.categoryInput.value;
  const quantity = Number(ui.quantity.value);

  if (!title || !author || !isbn || !category) {
    ui.error.textContent = "Please fill in all the required fields.";
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    ui.error.textContent = "Enter a quantity between 1 and 10000.";
    return;
  }

  const duplicate = books.find(book =>
    book.isbn.toLowerCase() === isbn.toLowerCase() &&
    String(book.id) !== idValue
  );

  if (duplicate) {
    ui.error.textContent = "This ISBN already exists.";
    return;
  }

  if (idValue) {
    const existing = books.find(
      book => book.id === Number(idValue)
    );

    if (!existing) {
      ui.error.textContent = "Book not found. Please try again.";
      return;
    }

    if (quantity < existing.issued) {
      ui.error.textContent =
        `Quantity cannot be less than ${existing.issued} issued copies.`;
      return;
    }

    Object.assign(existing, {
      title,
      author,
      isbn,
      category,
      quantity
    });

    notify("Book details updated successfully.");
  } else {
    books.unshift({
      id: nextId++,
      title,
      author,
      isbn,
      category,
      quantity,
      issued: 0
    });

    notify("Book added successfully.");
  }

  saveBooks();
  closeModal();
  renderBooks();
}

function issueBook(id) {
  const book = books.find(item => item.id === id);
  if (!book) return;

  if (availableCount(book) <= 0) {
    notify("No available copies to issue.", true);
    return;
  }

  book.issued++;
  saveBooks();
  renderBooks();
  notify("Book issued successfully.");
}

function returnBook(id) {
  const book = books.find(item => item.id === id);
  if (!book) return;

  if (book.issued <= 0) {
    notify("There are no issued copies to return.", true);
    return;
  }

  book.issued--;
  saveBooks();
  renderBooks();
  notify("Book returned successfully.");
}

function deleteBook(id) {
  const book = books.find(item => item.id === id);
  if (!book) return;

  if (book.issued > 0) {
    notify("Return all issued copies before deleting this book.", true);
    return;
  }

  if (!window.confirm(`Delete "${book.title}" from the collection?`)) {
    return;
  }

  books = books.filter(item => item.id !== id);
  saveBooks();
  renderBooks();
  notify("Book deleted successfully.");
}

ui.grid.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button || button.disabled) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const book = books.find(item => item.id === id);

  if (!book) return;

  if (action === "issue") issueBook(id);
  if (action === "return") returnBook(id);
  if (action === "edit") openModal(book);
  if (action === "delete") deleteBook(id);
});

$("addBookBtn").addEventListener("click", () => openModal());
$("emptyAddBtn").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

$("resetFilters").addEventListener("click", () => {
  ui.search.value = "";
  ui.category.value = "";
  ui.availability.value = "";
  renderBooks();
});

ui.form.addEventListener("submit", handleSave);
ui.search.addEventListener("input", renderBooks);
ui.category.addEventListener("change", renderBooks);
ui.availability.addEventListener("change", renderBooks);

ui.modal.addEventListener("click", event => {
  if (event.target === ui.modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !ui.modal.hidden) {
    closeModal();
  }
});

renderBooks();
