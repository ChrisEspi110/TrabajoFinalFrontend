// ============================================
// SISTEMA DE GESTIÓN DE BIBLIOTECAS
// JavaScript Vanilla
// ============================================

// 
const API_BASE_URL = 'https://trabajofinalgrupo5-production.up.railway.app/api';

// ============================================
// UTILIDADES
// ============================================

// Mostrar toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Mostrar/ocultar loading
function showLoading() {
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

// Formatear fecha DD/MM/YYYY (maneja correctamente zonas horarias)
function formatDate(dateString) {
    // Si es formato YYYY-MM-DD, parsearlo correctamente
    let date;
    if (dateString.includes('T')) {
        date = new Date(dateString);
    } else {
        // Formato YYYY-MM-DD
        const [year, month, day] = dateString.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', dateString);
        return '';
    }
    
    const dayFormatted = String(date.getDate()).padStart(2, '0');
    const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
    const yearFormatted = date.getFullYear();
    
    return `${dayFormatted}/${monthFormatted}/${yearFormatted}`;
}

// Validar número de días
function validateDays(days) {
    const num = parseInt(days);
    if (isNaN(num) || num < 1 || num > 15) {
        return { valid: false, message: 'Los días deben ser un número entre 1 y 15' };
    }
    return { valid: true };
}

// ============================================
// NAVEGACIÓN POR TABS
// ============================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Actualizar secciones
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${tab}-section`).classList.add('active');
        
        // Cargar datos según la pestaña
        if (tab === 'loan') {
            loadAvailableBooks();
        } else if (tab === 'loans') {
            loadActiveLoans();
        } else if (tab === 'stats') {
            loadStatistics();
        }
    });
});

// ============================================
// BÚSQUEDA DE LIBROS
// ============================================

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');

// Debounce para búsqueda reactiva
let searchTimeout = null;
const SEARCH_DELAY = 300; // milisegundos

async function searchBooks(query = '', showLoader = true) {
    try {
        if (showLoader) {
            showLoading();
        }
        
        // Mostrar indicador de búsqueda
        if (query.trim()) {
            searchResults.innerHTML = '<div class="search-loading"><div class="spinner-small"></div><p>Buscando...</p></div>';
        }
        
        const response = await fetch(`${API_BASE_URL}/books/search?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displaySearchResults(data.data, query);
        } else {
            showToast(data.message || 'Error al buscar libros', 'error');
            searchResults.innerHTML = `<div class="no-results"><div class="no-results-icon">${getIconSVG('frown', 64, '#64748b')}</div><p>No se pudieron cargar los libros</p></div>`;
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        showToast(`Error de conexión: ${error.message}`, 'error');
        searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">${getIconSVG('alert-circle', 64, '#dc2626')}</div>
                <p>Error de conexión con el servidor</p>
                <p class="error-hint">Verifica que el backend esté corriendo en http://localhost:3000</p>
            </div>
        `;
    } finally {
        if (showLoader) {
            hideLoading();
        }
    }
}

function displaySearchResults(books, query = '') {
    if (books.length === 0) {
        const message = query.trim() 
            ? `No se encontraron libros que coincidan con "${query}"`
            : 'No hay libros disponibles en la biblioteca';
        searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">${getIconSVG('inbox', 64, '#64748b')}</div>
                <p>${message}</p>
                ${query.trim() ? '<p class="search-hint">Intenta con otros términos de búsqueda</p>' : ''}
            </div>
        `;
        return;
    }
    
    // Animación de entrada
    searchResults.style.opacity = '0';
    
    let tableHTML = `
        <div class="results-header">
            <span class="results-count">${books.length} ${books.length === 1 ? 'libro encontrado' : 'libros encontrados'}</span>
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    books.forEach((book, index) => {
        const statusClass = book.available ? 'status-available' : 'status-unavailable';
        const statusText = book.available ? 'Disponible' : 'Prestado';
        const statusIconSVG = book.available 
            ? getIconSVG('check', 14, '#065f46') 
            : getIconSVG('x', 14, '#991b1b');
        
        tableHTML += `
            <tr class="table-row" style="animation-delay: ${index * 0.05}s">
                <td class="code-cell"><strong>${escapeHtml(book.code)}</strong></td>
                <td class="title-cell">${escapeHtml(book.title)}</td>
                <td class="author-cell">${escapeHtml(book.author)}</td>
                <td class="status-cell">
                    <span class="status-badge ${statusClass}">
                        <span class="status-icon">${statusIconSVG}</span>
                        ${statusText}
                    </span>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    searchResults.innerHTML = tableHTML;
    
    // Animación de entrada
    setTimeout(() => {
        searchResults.style.opacity = '1';
        searchResults.style.transition = 'opacity 0.3s ease-in';
    }, 10);
}

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Funciones helper para iconos SVG
function getIconSVG(iconName, size = 24, color = 'currentColor') {
    const icons = {
        'search': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
        'book': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
        'check': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        'x': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        'alert-circle': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        'inbox': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
        'plug': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 7V2"/><path d="M15 7V2"/><path d="M6 13V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v5"/><rect x="2" y="13" width="20" height="8" rx="2"/></svg>`,
        'frown': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
        'book-open': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
    };
    return icons[iconName] || '';
}

// Búsqueda reactiva (mientras se escribe)
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Limpiar timeout anterior
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Si el campo está vacío, mostrar todos los libros
    if (query === '') {
        searchTimeout = setTimeout(() => {
            searchBooks('', false);
        }, SEARCH_DELAY);
        return;
    }
    
    // Búsqueda con debounce
    searchTimeout = setTimeout(() => {
        searchBooks(query, false);
    }, SEARCH_DELAY);
    
    // Mostrar indicador visual mientras se escribe
    if (query.length > 0) {
        searchInput.classList.add('searching');
    } else {
        searchInput.classList.remove('searching');
    }
});

// Event listener para botón de búsqueda
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    searchBooks(query, true);
});

// Búsqueda con Enter
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        searchBooks(query, true);
    }
});

// Verificar conexión con el backend
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
        const data = await response.json();
        if (data.success) {
            console.log('✅ Backend conectado correctamente');
            return true;
        }
    } catch (error) {
        console.error('❌ No se pudo conectar al backend:', error);
        showToast('No se pudo conectar al backend. Verifica que esté corriendo en http://localhost:3000', 'error');
        return false;
    }
}

// Búsqueda inicial al cargar
window.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando aplicación...');
    console.log('URL del API:', API_BASE_URL);
    
    // Verificar conexión primero
    const connected = await checkBackendConnection();
    if (connected) {
        searchBooks('');
    } else {
        searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">${getIconSVG('plug', 64, '#dc2626')}</div>
                <p>No se pudo conectar al servidor</p>
                <p style="font-size: 0.9rem; margin-top: 10px; color: var(--text-secondary);">
                    Asegúrate de que el backend esté corriendo:
                </p>
                <p style="font-size: 0.85rem; margin-top: 5px; color: var(--text-secondary); font-family: monospace;">
                    cd backend && npm start
                </p>
            </div>
        `;
    }
});

// ============================================
// PRÉSTAMO DE LIBROS
// ============================================

const bookSelect = document.getElementById('book-select');
const daysInput = document.getElementById('days-input');
const returnDateInput = document.getElementById('return-date');
const readerFirstNameInput = document.getElementById('reader-first-name');
const readerLastNameInput = document.getElementById('reader-last-name');
const loanForm = document.getElementById('loan-form');
const bookError = document.getElementById('book-error');
const daysError = document.getElementById('days-error');
const readerFirstNameError = document.getElementById('reader-first-name-error');
const readerLastNameError = document.getElementById('reader-last-name-error');

// Cargar libros disponibles
async function loadAvailableBooks() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/books/search?query=`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            const availableBooks = data.data.filter(book => book.available);
            populateBookSelect(availableBooks);
            
            if (availableBooks.length === 0) {
                showToast('No hay libros disponibles en este momento', 'warning');
            }
        } else {
            throw new Error(data.message || 'Error al cargar libros');
        }
    } catch (error) {
        console.error('Error al cargar libros:', error);
        showToast(`Error al cargar libros: ${error.message}`, 'error');
        bookSelect.innerHTML = '<option value="">Error al cargar libros disponibles</option>';
        bookSelect.disabled = true;
    } finally {
        hideLoading();
    }
}

function populateBookSelect(books) {
    bookSelect.innerHTML = '<option value="">-- Seleccione un libro disponible --</option>';
    
    if (books.length === 0) {
        bookSelect.innerHTML = '<option value="">No hay libros disponibles</option>';
        bookSelect.disabled = true;
        bookSelect.classList.add('error');
        return;
    }
    
    bookSelect.disabled = false;
    bookSelect.classList.remove('error');
    
    // Ordenar libros por título para mejor UX
    const sortedBooks = [...books].sort((a, b) => {
        return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    });
    
    sortedBooks.forEach(book => {
        const option = document.createElement('option');
        option.value = book.id;
        option.textContent = `${book.code} - ${escapeHtml(book.title)} (${escapeHtml(book.author)})`;
        option.setAttribute('data-book-code', book.code);
        option.setAttribute('data-book-title', book.title);
        option.setAttribute('data-book-author', book.author);
        bookSelect.appendChild(option);
    });
}

// Calcular fecha de devolución cuando cambian los días
daysInput.addEventListener('input', () => {
    const days = daysInput.value;
    const validation = validateDays(days);
    
    if (validation.valid && bookSelect.value) {
        calculateReturnDate(days);
    } else {
        returnDateInput.value = '';
        returnDateInput.classList.remove('calculated');
    }
});

// Calcular fecha cuando se selecciona un libro
bookSelect.addEventListener('change', () => {
    const bookInfo = document.getElementById('book-info');
    const selectedOption = bookSelect.options[bookSelect.selectedIndex];
    
    // Mostrar información del libro seleccionado
    if (bookSelect.value && selectedOption.text !== '-- Seleccione un libro disponible --') {
        bookSelect.classList.remove('error');
        bookSelect.classList.add('success');
        bookError.classList.remove('show');
        
        // Mostrar información del libro
        const bookCode = selectedOption.getAttribute('data-book-code');
        const bookTitle = selectedOption.getAttribute('data-book-title');
        const bookAuthor = selectedOption.getAttribute('data-book-author');
        
        if (bookCode && bookTitle && bookAuthor) {
            bookInfo.innerHTML = `
                <div class="book-info-card">
                    <div class="book-info-icon">${getIconSVG('book-open', 32, '#1e40af')}</div>
                    <div class="book-info-details">
                        <div class="book-info-title">${escapeHtml(bookTitle)}</div>
                        <div class="book-info-meta">
                            <span class="book-info-author">${escapeHtml(bookAuthor)}</span>
                            <span class="book-info-separator">•</span>
                            <span class="book-info-code">${escapeHtml(bookCode)}</span>
                        </div>
                    </div>
                </div>
            `;
            bookInfo.classList.add('show');
        }
    } else {
        bookSelect.classList.remove('success');
        bookInfo.innerHTML = '';
        bookInfo.classList.remove('show');
    }
    
    // Calcular fecha si hay días válidos
    if (daysInput.value && validateDays(daysInput.value).valid) {
        calculateReturnDate(daysInput.value);
    } else {
        returnDateInput.value = '';
        returnDateInput.classList.remove('calculated');
    }
});

// Calcular fecha de devolución (lógica completa: sábado/domingo → lunes)
function calculateReturnDate(days) {
    const today = new Date();
    // Asegurar que trabajamos con la fecha local sin horas
    today.setHours(0, 0, 0, 0);
    
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + parseInt(days));
    
    // Guardar el día de la semana original para mostrar mensaje
    const originalDayOfWeek = returnDate.getDay();
    
    // Ajustar si cae en sábado (6) o domingo (0) → mover al lunes
    if (originalDayOfWeek === 6) { // Sábado
        returnDate.setDate(returnDate.getDate() + 2); // +2 días = lunes
    } else if (originalDayOfWeek === 0) { // Domingo
        returnDate.setDate(returnDate.getDate() + 1); // +1 día = lunes
    }
    
    // Formatear como YYYY-MM-DD para consistencia
    const year = returnDate.getFullYear();
    const month = String(returnDate.getMonth() + 1).padStart(2, '0');
    const day = String(returnDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    returnDateInput.value = formatDate(dateString);
    returnDateInput.classList.add('calculated');
    
    // Mostrar mensaje si se ajustó
    if (originalDayOfWeek === 6 || originalDayOfWeek === 0) {
        returnDateInput.title = 'Fecha ajustada automáticamente (no cae en fin de semana)';
        returnDateInput.setAttribute('data-adjusted', 'true');
    } else {
        returnDateInput.title = '';
        returnDateInput.removeAttribute('data-adjusted');
    }
}

// Validaciones en tiempo real mejoradas
daysInput.addEventListener('input', () => {
    const days = daysInput.value;
    const validation = validateDays(days);
    
    // Limpiar mensajes previos
    daysError.textContent = '';
    daysError.classList.remove('show');
    daysInput.classList.remove('error', 'success');
    
    if (days === '') {
        returnDateInput.value = '';
        returnDateInput.classList.remove('calculated');
        return;
    }
    
    if (!validation.valid) {
        daysError.textContent = validation.message;
        daysError.classList.add('show');
        daysInput.classList.add('error');
        returnDateInput.value = '';
        returnDateInput.classList.remove('calculated');
    } else {
        daysInput.classList.add('success');
        // Calcular fecha si hay libro seleccionado
        if (bookSelect.value) {
            calculateReturnDate(days);
        }
    }
});

daysInput.addEventListener('blur', () => {
    const days = daysInput.value;
    if (days) {
        const validation = validateDays(days);
        if (!validation.valid) {
            daysInput.value = '';
            returnDateInput.value = '';
            returnDateInput.classList.remove('calculated');
        }
    }
});

// Prevenir entrada de valores inválidos
daysInput.addEventListener('keydown', (e) => {
    // Permitir teclas de control
    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        return;
    }
    
    // Permitir Ctrl/Cmd + A, C, V, X
    if (e.ctrlKey || e.metaKey) {
        if (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }
    }
    
    // Permitir solo números
    if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
    }
});

// Validar al pegar
daysInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const numericValue = pastedText.replace(/\D/g, '');
    
    if (numericValue) {
        const num = parseInt(numericValue);
        if (num >= 1 && num <= 15) {
            daysInput.value = num;
            daysInput.dispatchEvent(new Event('input'));
        }
    }
});

// Submit del formulario
loanForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Limpiar errores previos
    bookError.classList.remove('show');
    daysError.classList.remove('show');
    readerFirstNameError.classList.remove('show');
    readerLastNameError.classList.remove('show');
    bookSelect.classList.remove('error');
    daysInput.classList.remove('error');
    readerFirstNameInput.classList.remove('error');
    readerLastNameInput.classList.remove('error');
    
    // Validaciones
    let hasErrors = false;
    
    const readerFirstName = readerFirstNameInput.value.trim();
    const readerLastName = readerLastNameInput.value.trim();
    
    if (!readerFirstName) {
        readerFirstNameError.textContent = 'El nombre del lector es requerido';
        readerFirstNameError.classList.add('show');
        readerFirstNameInput.classList.add('error');
        hasErrors = true;
    }
    
    if (!readerLastName) {
        readerLastNameError.textContent = 'El apellido del lector es requerido';
        readerLastNameError.classList.add('show');
        readerLastNameInput.classList.add('error');
        hasErrors = true;
    }
    
    if (!bookSelect.value) {
        bookError.textContent = 'Debe seleccionar un libro';
        bookError.classList.add('show');
        bookSelect.classList.add('error');
        hasErrors = true;
    }
    
    const days = daysInput.value;
    const validation = validateDays(days);
    if (!validation.valid) {
        daysError.textContent = validation.message;
        daysError.classList.add('show');
        daysInput.classList.add('error');
        hasErrors = true;
    }
    
    if (hasErrors) {
        showToast('Por favor, complete todos los campos correctamente', 'error');
        return;
    }
    
    // Crear préstamo
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/loans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookId: parseInt(bookSelect.value),
                daysRequested: parseInt(days),
                readerFirstName: readerFirstName,
                readerLastName: readerLastName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mostrar mensaje de éxito con animación
            showToast('Préstamo registrado exitosamente', 'success');
            
            // Animación de éxito en el formulario
            loanForm.classList.add('success-animation');
            setTimeout(() => {
                loanForm.classList.remove('success-animation');
            }, 2000);
            
            // Resetear formulario
            loanForm.reset();
            returnDateInput.value = '';
            returnDateInput.classList.remove('calculated');
            returnDateInput.removeAttribute('data-adjusted');
            returnDateInput.title = '';
            bookSelect.classList.remove('error', 'success');
            daysInput.classList.remove('error', 'success');
            bookError.classList.remove('show');
            daysError.classList.remove('show');
            
            // Limpiar información del libro
            const bookInfo = document.getElementById('book-info');
            if (bookInfo) {
                bookInfo.innerHTML = '';
                bookInfo.classList.remove('show');
            }
            
            // Recargar libros disponibles y actualizar vista
            setTimeout(() => {
                loadAvailableBooks();
                // Cambiar a la pestaña de préstamos activos para ver el resultado
                document.querySelector('[data-tab="loans"]').click();
                loadActiveLoans();
            }, 1500);
        } else {
            showToast(`${data.message || 'Error al registrar el préstamo'}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión con el servidor', 'error');
    } finally {
        hideLoading();
    }
});

// ============================================
// PRÉSTAMOS ACTIVOS
// ============================================

async function loadActiveLoans() {
    const container = document.getElementById('active-loans-results');
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/loans/active`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayActiveLoans(data.data);
        } else {
            container.innerHTML = '<div class="no-results"><p>Error al cargar préstamos</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="no-results"><p>Error de conexión</p></div>';
        showToast('Error al cargar préstamos activos', 'error');
    } finally {
        hideLoading();
    }
}

function displayActiveLoans(loans) {
    const container = document.getElementById('active-loans-results');
    
    if (loans.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">📭</div>
                <p>No hay préstamos activos en este momento</p>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <div class="results-header">
            <span class="results-count">${loans.length} ${loans.length === 1 ? 'préstamo activo' : 'préstamos activos'}</span>
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Lector</th>
                    <th>Fecha Préstamo</th>
                    <th>Fecha Devolución</th>
                    <th>Estado</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    loans.forEach((loan, index) => {
        const returnDate = new Date(loan.return_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        returnDate.setHours(0, 0, 0, 0);
        
        let statusClass = 'status-active';
        let statusText = 'Activo';
        let statusIcon = 'check'; // Icono por defecto
        
        if (returnDate < today) {
            statusClass = 'status-overdue';
            statusText = 'Vencido';
            statusIcon = 'alert-circle';
        } else if (returnDate.getTime() === today.getTime()) {
            statusClass = 'status-due-today';
            statusText = 'Vence hoy';
            statusIcon = 'check';
        }
        
        // Generar SVG del icono de estado
        const statusIconSVG = getIconSVG(statusIcon, 14, 'currentColor');
        
        tableHTML += `
            <tr style="animation-delay: ${index * 0.05}s">
                <td><strong>${escapeHtml(loan.code)}</strong></td>
                <td>${escapeHtml(loan.title)}</td>
                <td>${escapeHtml(loan.author)}</td>
                <td>${escapeHtml(loan.reader_first_name)} ${escapeHtml(loan.reader_last_name)}</td>
                <td>${formatDate(loan.loan_date)}</td>
                <td>${formatDate(loan.return_date)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        <span class="status-icon">${statusIconSVG}</span>
                        ${statusText}
                    </span>
                </td>
                <td>
                    <button class="btn-return" onclick="returnBook(${loan.id})" title="Registrar devolución">
                        ${getIconSVG('inbox', 16, 'currentColor')}
                        Devolver
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// Función global para devolver libro
window.returnBook = async function(loanId) {
    if (!confirm('¿Está seguro de que desea registrar la devolución de este libro?')) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/loans/return/${loanId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Libro devuelto exitosamente', 'success');
            loadActiveLoans();
            // Recargar búsqueda para actualizar disponibilidad
            if (document.getElementById('search-section').classList.contains('active')) {
                searchBooks('');
            }
            // Actualizar estadísticas si están visibles o en caché
            // (Opcional, se recargarán al cambiar de tab)
        } else {
            showToast(data.message || 'Error al devolver el libro', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        hideLoading();
    }
};

// ============================================
// ESTADÍSTICAS
// ============================================

async function loadStatistics() {
    const container = document.getElementById('statistics-container');
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/loans/statistics`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayStatistics(data.data);
        } else {
            container.innerHTML = '<div class="no-results"><p>Error al cargar estadísticas</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="no-results"><p>Error de conexión</p></div>';
        showToast('Error al cargar estadísticas', 'error');
    } finally {
        hideLoading();
    }
}

function displayStatistics(stats) {
    const container = document.getElementById('statistics-container');
    
    // Calcular porcentaje de disponibilidad
    const availabilityPercent = stats.total_books > 0 
        ? Math.round((stats.available_books / stats.total_books) * 100) 
        : 0;
        
    const statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                </div>
                <div>
                    <div class="stat-value">${stats.total_books}</div>
                    <div class="stat-label">Total Libros</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                    <div class="stat-value">${stats.available_books}</div>
                    <div class="stat-label">Disponibles (${availabilityPercent}%)</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <div>
                    <div class="stat-value">${stats.loaned_books}</div>
                    <div class="stat-label">En Préstamo</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <div>
                    <div class="stat-value">${stats.active_loans}</div>
                    <div class="stat-label">Préstamos Activos</div>
                </div>
            </div>
        </div>

        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-header">
                    <h3 class="chart-title">Distribución de Libros</h3>
                </div>
                <div style="height: 300px; position: relative;">
                    <canvas id="inventoryChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <h3 class="chart-title">Estado de Préstamos</h3>
                </div>
                <div style="height: 300px; position: relative;">
                    <canvas id="loansChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = statsHTML;
    
    // Renderizar gráficos
    renderCharts(stats);
}

function renderCharts(stats) {
    // Configuración común
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';
    
    // Gráfico de Inventario (Doughnut)
    const inventoryCtx = document.getElementById('inventoryChart').getContext('2d');
    new Chart(inventoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Disponibles', 'Prestados'],
            datasets: [{
                data: [stats.available_books, stats.loaned_books],
                backgroundColor: [
                    '#10b981', // Emerald 500
                    '#3b82f6'  // Blue 500
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Gráfico de Préstamos (Bar)
    const loansCtx = document.getElementById('loansChart').getContext('2d');
    new Chart(loansCtx, {
        type: 'bar',
        data: {
            labels: ['Activos (A tiempo)', 'Vencidos'],
            datasets: [{
                label: 'Cantidad',
                data: [stats.active_loans - stats.overdue_loans, stats.overdue_loans],
                backgroundColor: [
                    '#3b82f6', // Blue 500
                    '#ef4444'  // Red 500
                ],
                borderRadius: 6,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f1f5f9'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

