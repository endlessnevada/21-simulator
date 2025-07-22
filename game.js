const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

let deck = [];
let players = [];
let dealer = { hand: [], score: 0 };

// ==== Inizializzazione ====
function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ value, suit });
    }
  }
  deck = shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startGame() {
  createDeck();

  // Inizializza i giocatori
  players = [
    { name: "Tu", hand: [], score: 0, isHuman: true, status: "playing" },
    { name: "CPU 1", hand: [], score: 0, isHuman: false, status: "playing" },
    { name: "CPU 2", hand: [], score: 0, isHuman: false, status: "playing" }
  ];
  dealer = { name: "Dealer", hand: [], score: 0, isDealer: true };

  // Distribuzione iniziale
  for (let i = 0; i < 2; i++) {
    players.forEach(p => p.hand.push(drawCard()));
    dealer.hand.push(drawCard());
  }

  updateUI();
  checkForBlackjack();
}

function drawCard() {
  return deck.pop();
}

// ==== Punteggio ====
function calculateScore(hand) {
  let score = 0;
  let aces = 0;

  hand.forEach(card => {
    if (["J", "Q", "K"].includes(card.value)) score += 10;
    else if (card.value === "A") {
      score += 11;
      aces += 1;
    } else score += parseInt(card.value);
  });

  // Gestione assi
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

function checkForBlackjack() {
  players.forEach(player => {
    player.score = calculateScore(player.hand);
    if (player.score === 21) player.status = "blackjack";
  });

  dealer.score = calculateScore(dealer.hand);
  updateUI();
}

// ==== Gioco ====
function playerHit(playerIndex) {
  let player = players[playerIndex];
  if (player.status !== "playing") return;

  player.hand.push(drawCard());
  player.score = calculateScore(player.hand);

  if (player.score > 21) player.status = "busted";
  updateUI();
}

function playerStand(playerIndex) {
  let player = players[playerIndex];
  if (player.status === "playing") {
    player.status = "stood";
  }

  if (allPlayersFinished()) dealerTurn();
  updateUI();
}

function allPlayersFinished() {
  return players.every(p => p.status !== "playing");
}

function dealerTurn() {
  dealer.score = calculateScore(dealer.hand);
  while (dealer.score < 17) {
    dealer.hand.push(drawCard());
    dealer.score = calculateScore(dealer.hand);
  }
  updateUI();
  determineWinners();
}

function cpuPlays() {
  players.forEach((p, i) => {
    if (!p.isHuman && p.status === "playing") {
      while (p.score < 17) {
        p.hand.push(drawCard());
        p.score = calculateScore(p.hand);
        if (p.score > 21) p.status = "busted";
      }
      if (p.status === "playing") p.status = "stood";
    }
  });

  if (allPlayersFinished()) dealerTurn();
  updateUI();
}

// ==== Risultati ====
function determineWinners() {
  const dealerBust = dealer.score > 21;

  players.forEach(player => {
    if (player.status === "busted") {
      player.result = "❌ Sballato";
    } else if (player.status === "blackjack") {
      player.result = "🂡 Blackjack!";
    } else if (dealerBust) {
      player.result = "✅ Vince (dealer sballato)";
    } else if (player.score > dealer.score) {
      player.result = "✅ Vince";
    } else if (player.score < dealer.score) {
      player.result = "❌ Perde";
    } else {
      player.result = "🤝 Pareggio";
    }
  });

  updateUI();
}

// ==== UI (semplificata, da adattare al tuo HTML) ====
function updateUI() {
  players.forEach((p, i) => {
    const el = document.getElementById(`player${i}`);
    if (!el) return;

    el.querySelector(".hand").innerHTML = p.hand.map(c => cardHTML(c)).join("");
    el.querySelector(".score").textContent = `Punteggio: ${p.score}`;
    el.querySelector(".status").textContent = p.result || p.status;
  });

  const dealerEl = document.getElementById("dealer");
  dealerEl.querySelector(".hand").innerHTML = dealer.hand.map(c => cardHTML(c)).join("");
  dealerEl.querySelector(".score").textContent = `Punteggio: ${dealer.score}`;
}

// ==== Utility ====
function cardHTML(card) {
  return `<div class="card">${card.value}${card.suit}</div>`;
}
