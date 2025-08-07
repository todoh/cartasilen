// ============== REFERENCIAS A ELEMENTOS DEL DOM DEL JUEGO ==============
const ownHandDiv = document.getElementById('ownHand');
const opponentHandDiv = document.getElementById('opponentHand');
const gameBoardDiv = document.getElementById('gameBoard');
const screen1 = document.getElementById('login-screen');
const screen2 = document.getElementById('screen2');
const screen3 = document.getElementById('screen3');


// Función para cambiar de pantalla
function showScreen(screenToShow) {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('username-screen').classList.remove('active');
    document.getElementById('matchmaking-screen').classList.remove('active');
    document.getElementById('deck-builder-screen').classList.remove('active');
    document.getElementById('screen2').classList.remove('active');
    document.getElementById('screen3').classList.remove('active');
    
    if (screenToShow && typeof screenToShow.classList !== 'undefined') {
        screenToShow.classList.add('active');
    } else if (typeof screenToShow === 'string') {
        const screenEl = document.getElementById(screenToShow);
        if(screenEl) {
            screenEl.classList.add('active');
        }
    }
}

// Función para generar una carta visualmente
function createCardElement(card, isFaceDown = false) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-in-hand');
    
    if (card && card.id) {
        cardDiv.dataset.cardId = card.id;
    }

    if (isFaceDown) {
        cardDiv.classList.add('card-back');
        cardDiv.innerHTML = 'CS';
    } else {
        cardDiv.innerHTML = `
            <div class="card-image">
                <img src="${card.image}" alt="${card.name}" onerror="this.style.display='none';">
            </div>
            <div class="card-info">
                <div class="card-name-value">
                    <span>${card.name}</span>
                    <span>${card.value}</span>
                </div>
                <div class="card-effect">${card.effect}</div>
            </div>
        `;
    }
    return cardDiv;
}

// Función para renderizar la mano del jugador
function renderOwnHand(hand) {
    console.log("Rendering own hand with card IDs:", hand); 
    if (!ownHandDiv) return;
    ownHandDiv.innerHTML = '';
    (hand || []).forEach(cardId => {
        const card = cardDefinitions.find(c => c.id === cardId);
        if (card) {
            const cardElement = createCardElement(card);
            cardElement.addEventListener('click', () => showCardOptions(cardElement, card));
            ownHandDiv.appendChild(cardElement);
        } else {
            console.warn("Card definition not found for ID:", cardId);
        }
    });
}

// Función para renderizar la mano del oponente (boca abajo)
function renderOpponentHand(numCards) {
    console.log("Rendering opponent hand with", numCards, "cards (face down).");
    if (!opponentHandDiv) return;
    opponentHandDiv.innerHTML = '';
    for (let i = 0; i < numCards; i++) {
        const cardElement = createCardElement({}, true);
        cardElement.classList.remove('card-in-hand');
        cardElement.classList.add('card-back');
        opponentHandDiv.appendChild(cardElement);
    }
}

// --- AÑADIDO: Función para renderizar ambas pilas de descarte ---
function renderDiscardPiles(ownDiscard, opponentDiscard) {
    const ownDiscardDiv = document.getElementById('ownDiscardPile');
    const opponentDiscardDiv = document.getElementById('opponentDiscardPile');

    // Renderizar tu pila de descarte
    if (ownDiscardDiv) {
        ownDiscardDiv.innerHTML = '';
        if (ownDiscard.length > 0) {
            const lastCardId = ownDiscard[ownDiscard.length - 1];
            const card = cardDefinitions.find(c => c.id === lastCardId);
            if (card) {
                const cardElement = createCardElement(card);
                cardElement.style.cursor = 'default'; // No se puede hacer clic
                ownDiscardDiv.appendChild(cardElement);
            }
        } else {
            ownDiscardDiv.textContent = 'Tu Descarte';
        }
    }

    // Renderizar la pila de descarte del rival
    if (opponentDiscardDiv) {
        opponentDiscardDiv.innerHTML = '';
        if (opponentDiscard.length > 0) {
            const lastCardId = opponentDiscard[opponentDiscard.length - 1];
            const card = cardDefinitions.find(c => c.id === lastCardId);
            if (card) {
                const cardElement = createCardElement(card);
                cardElement.style.cursor = 'default';
                opponentDiscardDiv.appendChild(cardElement);
            }
        } else {
            opponentDiscardDiv.textContent = 'Descarte Rival';
        }
    }
}


// Función para mostrar las opciones de una carta (jugar/nada)
function showCardOptions(cardElement, card) {
    const existingOptions = document.querySelector('.card-options');
    if (existingOptions) {
        existingOptions.remove();
    }

    const optionsDiv = document.createElement('div');
    optionsDiv.classList.add('card-options');
    optionsDiv.style.position = 'absolute';
    optionsDiv.style.zIndex = '20';

    const playButton = document.createElement('button');
    playButton.textContent = 'Jugar';
    playButton.onclick = (e) => {
        e.stopPropagation();
        playCard(card.id);
        optionsDiv.remove();
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Nada';
    cancelButton.onclick = (e) => {
        e.stopPropagation();
        optionsDiv.remove();
    };

    optionsDiv.appendChild(playButton);
    optionsDiv.appendChild(cancelButton);
    
    document.body.appendChild(optionsDiv); 

    const cardRect = cardElement.getBoundingClientRect();
    optionsDiv.style.left = `${cardRect.left + window.scrollX}px`;
    optionsDiv.style.top = `${cardRect.top + window.scrollY - optionsDiv.offsetHeight - 5}px`;

    const closeOptions = (event) => {
        if (!optionsDiv.contains(event.target) && !cardElement.contains(event.target)) {
            if(document.body.contains(optionsDiv)) {
                optionsDiv.remove();
            }
            document.removeEventListener('click', closeOptions, true);
        }
    };
    document.addEventListener('click', closeOptions, true);
}


// Función para renderizar el tablero lineal
function renderGameBoard(player1Pos, player2Pos) {
    if (!gameBoardDiv) return;
    gameBoardDiv.innerHTML = '';
    const numCells = 14;

    for (let i = 0; i < numCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('board-cell');
        cell.textContent = i;
        cell.dataset.cellIndex = i;
        gameBoardDiv.appendChild(cell);
    }

    const player1Token = document.createElement('div');
    player1Token.classList.add('player-token', 'player1-token');
    player1Token.id = 'player1Token';
    gameBoardDiv.appendChild(player1Token);

    const player2Token = document.createElement('div');
    player2Token.classList.add('player-token', 'player2-token');
    player2Token.id = 'player2Token';
    gameBoardDiv.appendChild(player2Token);

    updatePlayerTokens(player1Pos, player2Pos);
}

// Función para actualizar la posición de los tokens de jugador en el tablero lineal
function updatePlayerTokens(player1Pos, player2Pos) {
    const player1Token = document.getElementById('player1Token');
    const player2Token = document.getElementById('player2Token');
    const cells = gameBoardDiv.querySelectorAll('.board-cell');

    if (cells.length > 0 && player1Token && player2Token) {
        const p1Pos = Math.max(0, Math.min(player1Pos, cells.length - 1));
        const p2Pos = Math.max(0, Math.min(player2Pos, cells.length - 1));

        const cell1 = cells[p1Pos];
        player1Token.style.left = `${cell1.offsetLeft + (cell1.offsetWidth / 2) - (player1Token.offsetWidth / 2)}px`; 
        player1Token.style.top = `${cell1.offsetTop + (cell1.offsetHeight / 4) - (player1Token.offsetHeight / 2)}px`;

        const cell2 = cells[p2Pos];
        player2Token.style.left = `${cell2.offsetLeft + (cell2.offsetWidth / 2) - (player2Token.offsetWidth / 2)}px`;
        player2Token.style.top = `${cell2.offsetTop + (cell2.offsetHeight * 0.75) - (player2Token.offsetHeight / 2)}px`;
    }
}

// CORRECCIÓN: Función para robar carta, manejando el barajado del descarte
function drawCardForTurn(deck, discardPile, messageDiv) {
    if (deck.length === 0) {
        if (discardPile.length > 0) {
            console.log("Mazo vacío. Barajando descarte...");
            deck.push(...shuffleArray(discardPile));
            discardPile.length = 0;
            if(messageDiv) messageDiv.textContent = '¡Mazo barajado con el descarte!';
        } else {
            if(messageDiv) messageDiv.textContent = 'No hay cartas en el mazo ni en el descarte para robar.';
            return null;
        }
    }
    return deck.shift();
}
