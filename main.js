// ============== CONFIGURACIÓN DE FIREBASE ==============
const firebaseConfig = {
    apiKey: "AIzaSyAfK_AOq-Pc2bzgXEzIEZ1ESWvnhMJUvwI",
    authDomain: "enraya-51670.firebaseapp.com",
    databaseURL: "https://enraya-51670-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "enraya-51670",
    storageBucket: "enraya-51670.appspot.com",
    messagingSenderId: "103343380727",
    appId: "1:103343380727:web:b2fa02aee03c9506915bf2",
    measurementId: "G-2G31LLJY1T"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============== REFERENCIAS A ELEMENTOS DEL DOM ==============
const screens = {
    loading: document.getElementById('loading-screen'),
    login: document.getElementById('login-screen'),
    username: document.getElementById('username-screen'),
    matchmaking: document.getElementById('matchmaking-screen'),
    game: document.getElementById('screen3'),
    gameOver: document.getElementById('screen2'),
    'deck-builder': document.getElementById('deck-builder-screen')
};

const loginGoogleBtn = document.getElementById('login-google-btn');
const usernameInput = document.getElementById('username-input');
const saveUsernameBtn = document.getElementById('save-username-btn');
const usernameError = document.getElementById('username-error');
const currentUsernameDisplay = document.getElementById('current-username-display');
const rivalNameInput = document.getElementById('rivalName-input');
const btnFindGame = document.getElementById('btnFindGame');
const rivalError = document.getElementById('rival-error');
const logoutBtn = document.getElementById('logout-btn');

// Referencias a elementos del juego
const opponentNameDisplay = document.getElementById('opponentNameDisplay');
const ownNameDisplay = document.getElementById('ownNameDisplay');
const gameMessageDiv = document.getElementById('gameMessage');
const btnPassTurn = document.getElementById('btnPassTurn');
const discardPileDiv = document.getElementById('discardPile');
const ownActiveEffectsDiv = document.getElementById('ownActiveEffects');
const opponentActiveEffectsDiv = document.getElementById('opponentActiveEffects');


// Referencias a elementos del modal
const cardInteractionModal = document.getElementById('cardInteractionModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalButtons = document.getElementById('modalButtons');


// ============== ESTADO GLOBAL DE LA APLICACIÓN ==============
let currentUser = null; // { uid, email, username }
let currentRoomId = null;
let currentRivalId = null;
let unsubscribeRoom = null;


// ============== FUNCIONES DE UTILIDAD ==============
function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    if (screens[screenId]) {
        screens[screenId].classList.add('active');
    } else {
        console.error(`Error: La pantalla con id '${screenId}' no fue encontrada.`);
    }
}

// ============== LÓGICA DE AUTENTICACIÓN Y USUARIO ==============

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().username) {
            currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
            currentUsernameDisplay.textContent = currentUser.username;
            showScreen('matchmaking');
        } else {
            showScreen('username');
        }
    } else {
        currentUser = null;
        showScreen('login');
    }
});

loginGoogleBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error("Error al iniciar sesión con Google:", error);
        alert("Hubo un error al iniciar sesión. Por favor, inténtalo de nuevo.");
    });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

saveUsernameBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim().toLowerCase();
    const user = auth.currentUser;
    usernameError.textContent = '';

    if (!user) {
        showScreen('login');
        return;
    }

    if (username.length < 3 || username.length > 20) {
        usernameError.textContent = 'El nombre debe tener entre 3 y 20 caracteres.';
        return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
        usernameError.textContent = 'Solo letras minúsculas, números y guiones bajos.';
        return;
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).get();

    if (!snapshot.empty) {
        if (snapshot.docs[0].id === user.uid) {
            const userDocData = snapshot.docs[0].data();
            currentUser = { uid: user.uid, email: user.email, ...userDocData };
            currentUsernameDisplay.textContent = currentUser.username;
            showScreen('matchmaking');
        } else {
            usernameError.textContent = 'Ese nombre de usuario ya está en uso.';
        }
        return;
    }

    await usersRef.doc(user.uid).set({
        username: username,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    currentUser = { uid: user.uid, email: user.email, username: username };
    currentUsernameDisplay.textContent = currentUser.username;
    showScreen('matchmaking');
});


// ============== LÓGICA DE PARTIDAS ==============

btnFindGame.addEventListener('click', async () => {
    const rivalUsername = rivalNameInput.value.trim().toLowerCase();
    rivalError.textContent = '';

    if (!rivalUsername) {
        rivalError.textContent = 'Introduce el nombre de un rival.';
        return;
    }
    if (rivalUsername === currentUser.username) {
        rivalError.textContent = 'No puedes jugar contra ti mismo.';
        return;
    }

    const usersRef = db.collection('users');
    const rivalSnapshot = await usersRef.where('username', '==', rivalUsername).get();

    if (rivalSnapshot.empty) {
        rivalError.textContent = 'No se encontró a ningún jugador con ese nombre.';
        return;
    }

    const rivalUser = { id: rivalSnapshot.docs[0].id, ...rivalSnapshot.docs[0].data() };

    await findOrCreateRoom(currentUser, rivalUser);
});

async function findOrCreateRoom(player1, player2) {
    const roomsRef = db.collection('rooms');
    const roomId = [player1.uid, player2.id].sort().join('_');
    const roomRef = roomsRef.doc(roomId);
    const roomDoc = await roomRef.get();

    if (roomDoc.exists) {
        currentRoomId = roomId;
        currentRivalId = roomDoc.data().player1.uid === currentUser.uid ? roomDoc.data().player2.uid : roomDoc.data().player1.uid;
        listenToRoomChanges(currentRoomId);
        showScreen('game');
    } else {
        const player1Doc = await db.collection('users').doc(player1.uid).get();
        const player2Doc = await db.collection('users').doc(player2.id).get();

        let player1Deck = player1Doc.data()?.deck;
        let player2Deck = player2Doc.data()?.deck;

        if (!player1Deck || player1Deck.length === 0) {
            player1Deck = generateInitialDeck();
        }
        if (!player2Deck || player2Deck.length === 0) {
            player2Deck = generateInitialDeck();
        }

        const shuffledDeck1 = shuffleArray(player1Deck);
        const shuffledDeck2 = shuffleArray(player2Deck);

        const initialHand1 = shuffledDeck1.splice(0, 3);
        const initialHand2 = shuffledDeck2.splice(0, 3);

        const newRoomData = {
            player1: { uid: player1.uid, username: player1.username },
            player2: { uid: player2.id, username: player2.username },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            gameState: {
                deck_player1: shuffledDeck1,
                deck_player2: shuffledDeck2,
                discardPile_player1: [],
                discardPile_player2: [],
                hand_player1: initialHand1,
                hand_player2: initialHand2,
                pos_player1: 0,
                pos_player2: 0,
                lastPlayedCard: null,
                currentTurn: Math.random() < 0.5 ? player1.uid : player2.id,
                gameStatus: "inProgress",
                winner: null,
                effectsActivos: {},
                // --- AÑADIDO: Control de robo de carta por turno ---
                drawStatus: {
                    [player1.uid]: false,
                    [player2.uid]: false
                }
            }
        };
        await roomRef.set(newRoomData);
        currentRoomId = roomId;
        currentRivalId = player2.id;
        listenToRoomChanges(currentRoomId);
        showScreen('game');
    }
}

function listenToRoomChanges(roomId) {
    if (unsubscribeRoom) {
        unsubscribeRoom();
    }
    const roomRef = db.collection('rooms').doc(roomId);
    unsubscribeRoom = roomRef.onSnapshot(async (doc) => { // <--- Convertido a async
        if (doc.exists) {
            const roomData = doc.data();
            await updateGameUI(roomData); // <--- Esperar a que la UI se actualice
        } else {
            alert("La partida ha terminado o fue cancelada.");
            showScreen('matchmaking');
        }
    }, error => {
        console.error("Error escuchando la sala:", error);
        alert("Se perdió la conexión con la partida.");
        showScreen('matchmaking');
    });
}


async function updateGameUI(roomData) { // <--- Convertido a async
    console.log("Actualizando UI con nuevos datos de la sala:", roomData);

    const gameState = roomData.gameState;
    const isPlayer1 = roomData.player1.uid === currentUser.uid;

    ownNameDisplay.textContent = isPlayer1 ? roomData.player1.username : roomData.player2.username;
    opponentNameDisplay.textContent = isPlayer1 ? roomData.player2.username : roomData.player1.username;

    const ownHand = isPlayer1 ? gameState.hand_player1 : gameState.hand_player2;
    const opponentHandCount = (isPlayer1 ? gameState.hand_player2 : gameState.hand_player1).length;
    renderOwnHand(ownHand);
    renderOpponentHand(opponentHandCount);

    const ownPos = isPlayer1 ? gameState.pos_player1 : gameState.pos_player2;
    const opponentPos = isPlayer1 ? gameState.pos_player2 : gameState.pos_player1;
    renderGameBoard(ownPos, opponentPos);

    if (gameState.currentTurn === currentUser.uid) {
        gameMessageDiv.textContent = "¡Es tu turno!";
        btnPassTurn.disabled = false;

        // --- AÑADIDO: Lógica para robar carta automáticamente ---
        if (gameState.drawStatus && gameState.drawStatus[currentUser.uid] === false) {
            const roomRef = db.collection('rooms').doc(currentRoomId);
            
            let ownDeck = isPlayer1 ? [...gameState.deck_player1] : [...gameState.deck_player2];
            let ownDiscard = isPlayer1 ? [...gameState.discardPile_player1] : [...gameState.discardPile_player2];
            let currentOwnHand = isPlayer1 ? [...gameState.hand_player1] : [...gameState.hand_player2];

            const newCard = drawCardForTurn(ownDeck, ownDiscard, gameMessageDiv);

            if (newCard) {
                currentOwnHand.push(newCard);
                
                const updatePayload = {
                    [`gameState.drawStatus.${currentUser.uid}`]: true,
                    [isPlayer1 ? 'gameState.deck_player1' : 'gameState.deck_player2']: ownDeck,
                    [isPlayer1 ? 'gameState.discardPile_player1' : 'gameState.discardPile_player2']: ownDiscard,
                    [isPlayer1 ? 'gameState.hand_player1' : 'gameState.hand_player2']: currentOwnHand
                };

                await roomRef.update(updatePayload);
                gameMessageDiv.textContent += ' Has robado una carta.';
            }
        }

    } else {
        gameMessageDiv.textContent = `Turno de ${opponentNameDisplay.textContent}`;
        btnPassTurn.disabled = true;
    }

    if (gameState.gameStatus === 'finished') {
        const winnerUsername = gameState.winner === roomData.player1.uid ? roomData.player1.username : roomData.player2.username;
        document.getElementById('winnerDisplay').textContent = `Ganador: ${winnerUsername}`;
        showScreen('gameOver');
    }
}


// ============== LÓGICA DEL JUEGO (Funciones auxiliares) ==============
function generateInitialDeck() {
    let deck = [];
    cardDefinitions.forEach(card => {
        for (let i = 0; i < card.count; i++) {
            deck.push(card.id);
        }
    });
    return deck;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ============== LÓGICA DE ACCIONES DE JUEGO ==============

async function playCard(cardId) {
    const roomRef = db.collection('rooms').doc(currentRoomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
        console.error("La sala no existe.");
        return;
    }

    const roomData = roomDoc.data();
    const gameState = roomData.gameState;

    if (gameState.currentTurn !== currentUser.uid) {
        gameMessageDiv.textContent = '¡No es tu turno!';
        return;
    }

    const playedCard = cardDefinitions.find(c => c.id === cardId);
    if (!playedCard) {
        console.error(`No se encontró la definición de la carta con id: ${cardId}`);
        return;
    }
    gameMessageDiv.textContent = `Jugando ${playedCard.name}...`;

    const isPlayer1 = roomData.player1.uid === currentUser.uid;

    let ownHand = isPlayer1 ? [...gameState.hand_player1] : [...gameState.hand_player2];
    let rivalHand = isPlayer1 ? [...gameState.hand_player2] : [...gameState.hand_player1];
    let ownDeck = isPlayer1 ? [...gameState.deck_player1] : [...gameState.deck_player2];
    let rivalDeck = isPlayer1 ? [...gameState.deck_player2] : [...gameState.deck_player1];
    let ownDiscard = isPlayer1 ? [...gameState.discardPile_player1] : [...gameState.discardPile_player2];
    let rivalDiscard = isPlayer1 ? [...gameState.discardPile_player2] : [...gameState.discardPile_player1];
    
    let ownPos = isPlayer1 ? gameState.pos_player1 : gameState.pos_player2;
    let rivalPos = isPlayer1 ? gameState.pos_player2 : gameState.pos_player1;
    let effectsActivos = gameState.effectsActivos ? { ...gameState.effectsActivos } : {};

    const cardIndex = ownHand.indexOf(cardId);
    if (cardIndex === -1) {
        console.error("La carta no está en la mano del jugador.");
        return;
    }

    ownHand.splice(cardIndex, 1);
    ownDiscard.push(cardId);

    let mutableState = {
        ownHand, rivalHand, ownPos, rivalPos, 
        ownDeck, rivalDeck, ownDiscard, rivalDiscard,
        lastPlayedCardId: gameState.lastPlayedCard,
        currentUserId: currentUser.uid,
        currentRivalId: currentRivalId,
        roomData: roomData,
        roomRef: roomRef,
        effectsActivos
    };

    await applyCardEffect(playedCard, mutableState);

    let nextTurnPlayerId = currentRivalId;
    if (playedCard.id === 'semidios' || playedCard.id === 'perro') {
        nextTurnPlayerId = currentUser.uid;
    }

    const updatePayload = {
        'gameState.lastPlayedCard': cardId,
        'gameState.hand_player1': isPlayer1 ? mutableState.ownHand : mutableState.rivalHand,
        'gameState.hand_player2': isPlayer1 ? mutableState.rivalHand : mutableState.ownHand,
        'gameState.deck_player1': isPlayer1 ? mutableState.ownDeck : mutableState.rivalDeck,
        'gameState.deck_player2': isPlayer1 ? mutableState.rivalDeck : mutableState.ownDeck,
        'gameState.discardPile_player1': isPlayer1 ? mutableState.ownDiscard : mutableState.rivalDiscard,
        'gameState.discardPile_player2': isPlayer1 ? mutableState.rivalDiscard : mutableState.ownDiscard,
        'gameState.pos_player1': isPlayer1 ? mutableState.ownPos : mutableState.rivalPos,
        'gameState.pos_player2': isPlayer1 ? mutableState.rivalPos : mutableState.ownPos,
        'gameState.currentTurn': nextTurnPlayerId,
        'gameState.effectsActivos': mutableState.effectsActivos,
        // --- AÑADIDO: Resetear el estado de robo para el siguiente jugador ---
        [`gameState.drawStatus.${nextTurnPlayerId}`]: false
    };

    await roomRef.update(updatePayload);
}

async function passTurn() {
    const roomRef = db.collection('rooms').doc(currentRoomId);
    // --- MODIFICACIÓN: Resetear el estado de robo al pasar turno ---
    await roomRef.update({ 
        'gameState.currentTurn': currentRivalId,
        [`gameState.drawStatus.${currentRivalId}`]: false
    });
}
btnPassTurn.addEventListener('click', passTurn);


// ============== FUNCIONES DE MODAL Y AUXILIARES ==============

function displayModal(title, contentEl, buttons, customClass = '') {
    return new Promise(resolve => {
        modalTitle.textContent = title;
        modalBody.innerHTML = '';
        modalBody.appendChild(contentEl);
        modalButtons.innerHTML = '';
        buttons.forEach(btn => {
            const buttonElement = document.createElement('button');
            buttonElement.textContent = btn.text;
            buttonElement.addEventListener('click', () => {
                hideModal();
                resolve(btn.action);
            });
            modalButtons.appendChild(buttonElement);
        });
        if (customClass) {
            cardInteractionModal.querySelector('.modal-content').classList.add(customClass);
        }
        cardInteractionModal.style.display = 'flex';
    });
}

function hideModal() {
    cardInteractionModal.style.display = 'none';
    cardInteractionModal.querySelector('.modal-content').className = 'modal-content';
}

async function choosePlayer() {
    return currentRivalId;
}

async function chooseCardsToDiscard(hand, numToDiscard, targetPlayerName) {
    return new Promise(resolve => resolve([])); 
}

async function chooseCardFromAllDefinitions(promptText) {
    return new Promise(resolve => resolve(null));
}


// Iniciar la aplicación
showScreen('loading');
