// ============== REFERENCIAS AL DOM DEL DECK BUILDER ==============
const deckBuilderScreen = document.getElementById('deck-builder-screen');
const libraryCardsContainer = document.getElementById('library-cards');
const deckCardsContainer = document.getElementById('deck-cards');
const deckCountSpan = document.getElementById('deck-count');
const saveDeckBtn = document.getElementById('save-deck-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const deckBuilderBtn = document.getElementById('deck-builder-btn');

// ============== ESTADO DEL DECK BUILDER ==============
let playerLibrary = []; // Cartas que el jugador posee
let currentDeck = [];   // Cartas actualmente en la baraja
const MAX_DECK_SIZE = 30;

// ============== FUNCIONES DEL DECK BUILDER ==============

// Inicializa el Deck Builder
async function initDeckBuilder() {
    if (!currentUser) return;

    // 1. Cargar la biblioteca del jugador con todas las cartas definidas
    playerLibrary = cardDefinitions.map(card => card.id);

    // 2. Cargar la baraja guardada del jugador desde Firestore
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (userDoc.exists && userDoc.data().deck) {
        currentDeck = userDoc.data().deck;
    } else {
        currentDeck = []; // O una baraja inicial por defecto
    }

    // 3. Renderizar la UI
    renderLibrary();
    renderDeck();
}

// Renderiza las cartas en la biblioteca
function renderLibrary() {
    libraryCardsContainer.innerHTML = '';
    playerLibrary.forEach(cardId => {
        const cardDef = cardDefinitions.find(c => c.id === cardId);
        if (cardDef) {
            const cardElement = createDeckBuilderCard(cardDef, 'library');
            libraryCardsContainer.appendChild(cardElement);
        }
    });
}

// Renderiza las cartas en la baraja actual
function renderDeck() {
    deckCardsContainer.innerHTML = '';
    currentDeck.forEach((cardId, index) => {
        const cardDef = cardDefinitions.find(c => c.id === cardId);
        if (cardDef) {
            const cardElement = createDeckBuilderCard(cardDef, 'deck', index);
            deckCardsContainer.appendChild(cardElement);
        }
    });
    updateDeckCount();
}

// Crea el elemento visual de una carta para el deck builder
function createDeckBuilderCard(cardDef, location, index = -1) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'deck-builder-card';
    cardWrapper.innerHTML = `
        <div class="card-image">
            <img src="${cardDef.image}" alt="${cardDef.name}" onerror="this.src=BASE64_IMAGE_PLACEHOLDER;">
        </div>
        <div class="card-info">
            <div class="card-name-value">${cardDef.name}</div>
        </div>
        <div class="card-action-overlay"></div>
    `;

    const overlay = cardWrapper.querySelector('.card-action-overlay');
    const actionButton = document.createElement('button');

    if (location === 'library') {
        actionButton.textContent = 'Añadir';
        actionButton.onclick = () => addCardToDeck(cardDef.id);
    } else { // location === 'deck'
        actionButton.textContent = 'Quitar';
        actionButton.onclick = () => removeCardFromDeck(index);
    }
    overlay.appendChild(actionButton);

    return cardWrapper;
}

// Añade una carta a la baraja
function addCardToDeck(cardId) {
    if (currentDeck.length < MAX_DECK_SIZE) {
        currentDeck.push(cardId);
        renderDeck();
    } else {
        alert(`La baraja no puede tener más de ${MAX_DECK_SIZE} cartas.`);
    }
}

// Quita una carta de la baraja
function removeCardFromDeck(index) {
    if (index > -1 && index < currentDeck.length) {
        currentDeck.splice(index, 1);
        renderDeck();
    }
}

// Actualiza el contador de cartas
function updateDeckCount() {
    deckCountSpan.textContent = currentDeck.length;
    if (currentDeck.length === MAX_DECK_SIZE) {
        deckCountSpan.style.color = '#28a745'; // Verde
    } else {
        deckCountSpan.style.color = '#ffffff'; // Blanco
    }
}

// Guarda la baraja en Firestore (CORREGIDO)
async function saveDeck() {
    if (!currentUser) return;
    saveDeckBtn.disabled = true;
    saveDeckBtn.textContent = 'Guardando...';
    try {
        // Usamos .set con { merge: true } para crear o actualizar el campo 'deck' de forma segura
        await db.collection('users').doc(currentUser.uid).set({
            deck: currentDeck
        }, { merge: true });
        alert('¡Baraja guardada con éxito!');
    } catch (error) {
        console.error("Error al guardar la baraja:", error);
        alert('Hubo un error al guardar la baraja.');
    } finally {
        saveDeckBtn.disabled = false;
        saveDeckBtn.textContent = 'Guardar Baraja';
    }
}


// ============== EVENT LISTENERS ==============
deckBuilderBtn.addEventListener('click', () => {
    initDeckBuilder();
    showScreen('deck-builder');
});

backToMenuBtn.addEventListener('click', () => {
    showScreen('matchmaking');
});

saveDeckBtn.addEventListener('click', saveDeck);
