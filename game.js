const players = [
  { id: 'player0', hand: [], stand: false, isCPU: false },
  { id: 'player1', hand: [], stand: false, isCPU: true },
  { id: 'player2', hand: [], stand: false, isCPU: true }
];

const dealer = { id: 'dealer', hand: [], stand: false };

let deck = [];

function createDeck(num = 1) {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const newDeck = [];

  for (let d = 0; d < num; d++) {
    for (let suit of suits) {
      for (let value of values) {
        newDeck.push(value + suit);
      }
    }
  }

  return newDeck;
}


function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getCardValue(card) {
  const value = card.slice(0, -1);
  if (['J', 'Q', 'K'].includes(value)) return 10;
  if (value === 'A') return 11;
  return parseInt(value);
}
function getCardFilename(card) {
  const value = card.slice(0, -1);
  const suitSymbol = card.slice(-1);
  const suitNames = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
  const valueNames = {
    'J': 'jack',
    'Q': 'queen',
    'K': 'king',
    'A': 'ace'
  };
  const cardValue = valueNames[value] || value;
  const cardSuit = suitNames[suitSymbol];
  return `${cardValue}_of_${cardSuit}.png`;
}
function calculateScore(hand) {
  let total = 0;
  let aces = 0;

  for (let card of hand) {
    const val = getCardValue(card);
    total += val;
    if (val === 11) aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function renderPlayerHand(index) {
  const player = players[index];
  const div = document.getElementById(player.id);
  const handDiv = div.querySelector('.hand');
  const scoreDiv = div.querySelector('.score');
  const statusDiv = div.querySelector('.status');

  handDiv.innerHTML = '';
   player.hand.forEach(card => {
    const cardImg = document.createElement('img');
    cardImg.src = `cards/${getCardFilename(card)}`;
    cardImg.className = 'card';
    handDiv.appendChild(cardImg);
  });


  const score = calculateScore(player.hand);
  scoreDiv.textContent = `Punteggio: ${score}`;

    if (score > 21) {
    statusDiv.textContent = 'Sballato!';
    player.stand = true;

    // Se è il giocatore umano (player0), far partire i turni CPU e dealer
    if (player.id === 'player0') {
      setTimeout(() => {
        cpuPlays();
      }, 500);
    }
  } else {
    statusDiv.textContent = '';
  }
}

function renderDealer(showAll = false) {
  const div = document.getElementById(dealer.id);
  const handDiv = div.querySelector('.hand');
  const scoreDiv = div.querySelector('.score');
  const statusDiv = div.querySelector('.status');

  handDiv.innerHTML = '';

  dealer.hand.forEach((card, index) => {
    const cardImg = document.createElement('img');
    if (index === 1 && !showAll) {
      cardImg.src = `cards/back.png`; // immagine della carta coperta
    } else {
      cardImg.src = `cards/${getCardFilename(card)}`;
    }
    cardImg.className = 'card';
    handDiv.appendChild(cardImg);
  });

  const score = showAll ? calculateScore(dealer.hand) : getCardValue(dealer.hand[0]);
  scoreDiv.textContent = `Punteggio: ${score}`;
}


function dealInitialCards(numDecks = 1) {
  deck = createDeck(numDecks); // <-- numDecks passato correttamente
console.log(`Numero di mazzi selezionato: ${numDecks}`);
console.log(`Carte totali nel mazzo: ${deck.length}`); // dovrebbe essere 52 * numDecks

  shuffle(deck);

  for (let player of players) {
    player.hand = [deck.pop(), deck.pop()];
    player.stand = false;
  }

  dealer.hand = [deck.pop(), deck.pop()];
  dealer.stand = false;

  players.forEach((_, i) => renderPlayerHand(i));
  renderDealer();
}


function playerHit(index) {
  const player = players[index];
  if (!player.stand) {
    player.hand.push(deck.pop());
    renderPlayerHand(index);
  }
}

function playerStand(index) {
  players[index].stand = true;
}

function cpuPlays() {
  for (let i = 1; i < players.length; i++) {
    const cpu = players[i];
    while (!cpu.stand && calculateScore(cpu.hand) < 17) {
      cpu.hand.push(deck.pop());
    }
    cpu.stand = true;
    renderPlayerHand(i);
  }

  dealerPlays();
}

function dealerPlays() {
  while (calculateScore(dealer.hand) < 17) {
    dealer.hand.push(deck.pop());
  }
  dealer.stand = true;
  renderDealer(true);
  showResults();
}

function showResults() {
  const dealerScore = calculateScore(dealer.hand);
  players.forEach((player, i) => {
    const playerScore = calculateScore(player.hand);
    const statusDiv = document.getElementById(player.id).querySelector('.status');

    if (playerScore > 21) {
      statusDiv.textContent = 'Hai perso!';
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      statusDiv.textContent = 'Hai vinto!';
    } else if (playerScore === dealerScore) {
      statusDiv.textContent = 'Pareggio!';
    } else {
      statusDiv.textContent = 'Hai perso!';
    }
  });
}

window.onload = dealInitialCards;
document.getElementById('startGameBtn').addEventListener('click', () => {
  const numDecksInput = document.getElementById('numDecks');
  const numDecks = parseInt(numDecksInput.value);

  if (!numDecks || numDecks < 1 || numDecks > 8) {
    alert("Inserisci un numero valido di mazzi (1-8)");
    return;
  }

  // Mostra il tavolo e avvia la partita
  document.getElementById('gameTable').style.display = 'flex';
  document.querySelector('.setup-container').style.display = 'none';
  dealInitialCards(numDecks);
});
document.getElementById('resetBtn').addEventListener('click', () => {
  // Torna alla schermata di configurazione
  document.getElementById('gameTable').style.display = 'none';
  document.querySelector('.setup-container').style.display = 'flex';

  // Reset mani e punteggi
  players.forEach(player => {
    player.hand = [];
    player.stand = false;
    const div = document.getElementById(player.id);
    div.querySelector('.hand').innerHTML = '';
    div.querySelector('.score').textContent = '';
    div.querySelector('.status').textContent = '';
  });

  dealer.hand = [];
  dealer.stand = false;
  const dealerDiv = document.getElementById('dealer');
  dealerDiv.querySelector('.hand').innerHTML = '';
  dealerDiv.querySelector('.score').textContent = '';
  dealerDiv.querySelector('.status').textContent = '';
});
