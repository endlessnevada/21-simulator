
const suits = ['♠','♥','♦','♣'];
const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
let deck = [];

// Mani
let hands = { player: [], cpu1: [], cpu2: [], dealer: [] };
let scores = { player: 0, cpu1: 0, cpu2: 0, dealer: 0 };

// Costruzione e mescolamento
function createDeck() {
  deck = [];
  for (let s of suits) for (let v of values) deck.push({ v, s });
  deck = deck.concat([...deck]); // doppio mazzo
  shuffle(deck);
}

function shuffle(a) {
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

// Valore mano
function getHandValue(arr) {
  let v = 0, aces = 0;
  for (let c of arr) {
    if (['J','Q','K'].includes(c.v)) v += 10;
    else if (c.v === 'A') { v += 11; aces++ }
    else v += +c.v;
  }
  while (v > 21 && aces) { v -= 10; aces--; }
  return v;
}

// Disegna la mano sul tavolo
function renderHand(id, arr) {
  const container = document.getElementById(id);
  container.innerHTML = '';
  arr.forEach(c => {
    const div = document.createElement('div');
    div.className = 'card';
    div.textContent = c.v + c.s;
    container.appendChild(div);
  });
}

function renderScores() {
  Object.keys(hands).forEach(p => {
    document.getElementById('score' + capitalize(p)).textContent = getHandValue(hands[p]);
  });
}

// Inizializza giro
function startGame() {
  hands = { player: [], cpu1: [], cpu2: [], dealer: [] };
  createDeck();
  ['player','cpu1','cpu2','dealer'].forEach(p => drawToHand(p,2));
  renderAll();
  document.getElementById('hitBtn').disabled = false;
  document.getElementById('standBtn').disabled = false;
}

// Disegna una carta in mano
function drawToHand(player, n=1) {
  for (let i=0;i<n;i++) hands[player].push(deck.pop());
}

// Controlli giocatore
document.getElementById('hitBtn').onclick = () => {
  drawToHand('player');
  renderAll();
  if (getHandValue(hands.player) > 21) endRound();
};

document.getElementById('standBtn').onclick = () => {
  document.getElementById('hitBtn').disabled = true;
  document.getElementById('standBtn').disabled = true;
  nextPlayers(['cpu1','cpu2'], () => dealerTurn());
};

// Turni CPU AI semplice (faccio draw fino a 16)
function nextPlayers(arr, callback, idx=0) {
  if (idx >= arr.length) return callback();
  const p = arr[idx];
  if (getHandValue(hands[p]) < 17) drawToHand(p);
  renderAll();
  setTimeout(() => nextPlayers(arr, callback, idx+1), 500);
}

// Banco gioca fino a 17+
function dealerTurn() {
  while (getHandValue(hands.dealer) < 17) drawToHand('dealer');
  renderAll();
  endRound();
}

function endRound() {
  renderAll();
  const results = {};
  ['cpu1','cpu2','dealer','player'].forEach(p => {
    const val = getHandValue(hands[p]);
    if (p !== 'player') {
      const pv = getHandValue(hands.player);
      if (pv > 21) results[p] = 'Lose';
      else if (val > 21 || pv > val) results[p] = 'Win';
      else if (pv < val) results[p] = 'Lose';
      else results[p] = 'Push';
      alert(`${capitalize(p)}: ${results[p]}`);
    }
  });
  setTimeout(() => startGame(), 1000);
}

function renderAll() {
  ['player','cpu1','cpu2','dealer'].forEach(p => {
    renderHand('hand' + capitalize(p), hands[p]);
  });
  renderScores();
}

function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1);}

window.onload = startGame;
