// ============== REFERENCIAS A ELEMENTOS DEL DOM DEL JUEGO ==============
// CORRECCIÓN: Se declaran aquí para que sean globales y accesibles por todas las funciones.
const ownHandDiv = document.getElementById('ownHand');
const opponentHandDiv = document.getElementById('opponentHand');
const gameBoardDiv = document.getElementById('gameBoard');
const screen1 = document.getElementById('login-screen'); // Asumiendo que screen1 es login
const screen2 = document.getElementById('screen2');
const screen3 = document.getElementById('screen3');


// Función para cambiar de pantalla
function showScreen(screenToShow) {
    // Es mejor obtener los elementos aquí o pasarlos como argumentos si no están todos definidos globalmente
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
        cardDiv.dataset.cardId = card.id; // Almacenar el ID de la carta
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
    if (!ownHandDiv) return; // Comprobación de seguridad
    ownHandDiv.innerHTML = '';
    hand.forEach(cardId => {
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
    if (!opponentHandDiv) return; // Comprobación de seguridad
    opponentHandDiv.innerHTML = '';
    for (let i = 0; i < numCards; i++) {
        const cardElement = createCardElement({}, true);
        // Para la mano del oponente, usamos un estilo más simple
        cardElement.classList.remove('card-in-hand');
        cardElement.classList.add('card-back');
        opponentHandDiv.appendChild(cardElement);
    }
}

// Función para mostrar las opciones de una carta (jugar/nada)
function showCardOptions(cardElement, card) {
    // Eliminar opciones anteriores si existen
    const existingOptions = document.querySelector('.card-options');
    if (existingOptions) {
        existingOptions.remove();
    }

    const optionsDiv = document.createElement('div');
    optionsDiv.classList.add('card-options');
    optionsDiv.style.position = 'absolute'; // Asegurar posicionamiento absoluto
    optionsDiv.style.zIndex = '20'; // Poner por encima de las cartas

    const playButton = document.createElement('button');
    playButton.textContent = 'Jugar';
    playButton.onclick = (e) => {
        e.stopPropagation(); // Evitar que el click se propague
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
    
    // Añadir al body para evitar problemas de posicionamiento con contenedores relativos
    document.body.appendChild(optionsDiv); 

    // Posicionar el menú relativo al cardElement
    const cardRect = cardElement.getBoundingClientRect();
    optionsDiv.style.left = `${cardRect.left + window.scrollX}px`;
    optionsDiv.style.top = `${cardRect.top + window.scrollY - optionsDiv.offsetHeight - 5}px`;

    // Cerrar opciones si se clica fuera
    const closeOptions = (event) => {
        if (!optionsDiv.contains(event.target) && !cardElement.contains(event.target)) {
            if(document.body.contains(optionsDiv)) {
                optionsDiv.remove();
            }
            document.removeEventListener('click', closeOptions, true);
        }
    };
    // Usar 'true' para capturar el evento en la fase de captura y evitar que otros listeners interfieran
    document.addEventListener('click', closeOptions, true);
}


// Función para renderizar el tablero lineal
function renderGameBoard(player1Pos, player2Pos) {
    if (!gameBoardDiv) return;
    gameBoardDiv.innerHTML = ''; // Limpiar casillas existentes
    const numCells = 14; // De 0 a 13

    for (let i = 0; i < numCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('board-cell');
        cell.textContent = i;
        cell.dataset.cellIndex = i; // Almacenar el índice de la casilla
        gameBoardDiv.appendChild(cell);
    }

    // Renderizar tokens de jugador
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
        // Asegurarse de que las posiciones no se salgan del rango
        const p1Pos = Math.max(0, Math.min(player1Pos, cells.length - 1));
        const p2Pos = Math.max(0, Math.min(player2Pos, cells.length - 1));

        const cell1 = cells[p1Pos];
        player1Token.style.left = `${cell1.offsetLeft + (cell1.offsetWidth / 2) - (player1Token.offsetWidth / 2)}px`; 
        player1Token.style.top = `${cell1.offsetTop + (cell1.offsetHeight / 4) - (player1Token.offsetHeight / 2)}px`; // Un poco más arriba

        const cell2 = cells[p2Pos];
        let offset = (p1Pos === p2Pos) ? 15 : 0; // Desplazamiento si están en la misma casilla
        player2Token.style.left = `${cell2.offsetLeft + (cell2.offsetWidth / 2) - (player2Token.offsetWidth / 2)}px`;
        player2Token.style.top = `${cell2.offsetTop + (cell2.offsetHeight * 0.75) - (player2Token.offsetHeight / 2)}px`; // Un poco más abajo
    }
}

// Helper function to draw a card, handling reshuffling
function drawCardForTurn(mazo, pilaDescarte, messageDiv) {
    if (mazo.length === 0) {
        if (pilaDescarte.length > 0) {
            mazo.push(...shuffleArray(pilaDescarte));
            pilaDescarte.length = 0;
            if(messageDiv) messageDiv.textContent = '¡Mazo barajado con el descarte!';
        } else {
            if(messageDiv) messageDiv.textContent = 'No hay cartas en el mazo ni en el descarte para robar.';
            return null;
        }
    }
    return mazo.shift();
}
