const players = [
  { id: 'player0', hand: [], stand: false, isCPU: false },
  { id: 'player1', hand: [], stand: false, isCPU: true },
  { id: 'player2', hand: [], stand: false, isCPU: true }
];

const dealer = { id: 'dealer', hand: [], stand: false };
let deck = [];
let stayChart, hitChart; // Grafici probabilità live

// --- CREAZIONE E SHUFFLE DEL MAZZO ---
function createDeck(num = 1) {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
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

// --- VALORE DELLE CARTE ---
function getCardValue(card) {
  const value = card.slice(0, -1);
  if (['J','Q','K'].includes(value)) return 10;
  if (value==='A') return 11;
  return parseInt(value);
}

function getCardFilename(card) {
  const value = card.slice(0, -1);
  const suitSymbol = card.slice(-1);
  const suitNames = { '♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs' };
  const valueNames = { 'J':'jack','Q':'queen','K':'king','A':'ace' };
  const cardValue = valueNames[value] || value;
  const cardSuit = suitNames[suitSymbol];
  return `${cardValue}_of_${cardSuit}.png`;
}

// --- CALCOLO PUNTEGGIO ---
function calculateScore(hand) {
  let total = 0, aces = 0;
  for (let card of hand) {
    let val = getCardValue(card);
    total += val;
    if (val === 11) aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

// --- RENDER MANI ---
function renderPlayerHand(index) {
  const player = players[index];
  const div = document.getElementById(player.id);
  const handDiv = div.querySelector('.hand');
  const scoreDiv = div.querySelector('.score');
  const statusDiv = div.querySelector('.status');

  handDiv.innerHTML = '';
  player.hand.forEach(card => {
    const img = document.createElement('img');
    img.src = `cards/${getCardFilename(card)}`;
    img.className = 'card';
    handDiv.appendChild(img);
  });

  const score = calculateScore(player.hand);
  scoreDiv.textContent = `Punteggio: ${score}`;

  if (score > 21) {
    statusDiv.textContent = player.isCPU ? 'CPU ha sballato!' : 'Hai sballato!';
    player.stand = true;
  } else if (score === 21 && player.hand.length === 2) {
    statusDiv.textContent = player.isCPU ? 'Blackjack CPU!' : 'Blackjack!';
    player.stand = true;
  } else {
    statusDiv.textContent = '';
  }

  if (!player.isCPU) {
    const controls = div.querySelector('.controls');
    controls.querySelectorAll('button').forEach(btn => btn.disabled = player.stand);
  }

  if (!player.isCPU) calculateLive(); // aggiorna probabilità live per il giocatore
}

function renderDealer(showAll = false) {
  const div = document.getElementById(dealer.id);
  const handDiv = div.querySelector('.hand');
  const scoreDiv = div.querySelector('.score');
  const statusDiv = div.querySelector('.status');

  handDiv.innerHTML = '';
  dealer.hand.forEach((card, i) => {
    const img = document.createElement('img');
    img.src = (i === 1 && !showAll) ? `cards/back.png` : `cards/${getCardFilename(card)}`;
    img.className = 'card';
    handDiv.appendChild(img);
  });

  const score = showAll ? calculateScore(dealer.hand) : getCardValue(dealer.hand[0]);
  scoreDiv.textContent = `Punteggio: ${score}`;
  statusDiv.textContent = '';
}

// --- DISTRIBUZIONE CARTE INIZIALI ---
function dealInitialCards(numDecks = 1) {
  deck = createDeck(numDecks);
  shuffle(deck);
  for (let p of players) {
    p.hand = [deck.pop(), deck.pop()];
    p.stand = false;
  }
  dealer.hand = [deck.pop(), deck.pop()];
  dealer.stand = false;
  players.forEach((_,i) => renderPlayerHand(i));
  renderDealer();
}

// --- AZIONI GIOCATORE ---
function playerHit(index) {
  const player = players[index];
  if (!player.stand) {
    player.hand.push(deck.pop());
    renderPlayerHand(index);
    if (player.stand) setTimeout(cpuPlays,500);
  }
}

function playerStand(index) {
  players[index].stand = true;
  renderPlayerHand(index);
  setTimeout(cpuPlays,500);
}

// --- TURNO CPU ---
async function cpuPlays() {
  for (let i=1;i<players.length;i++){
    const cpu=players[i];
    while(!cpu.stand && calculateScore(cpu.hand)<17){
      cpu.hand.push(deck.pop());
      renderPlayerHand(i);
      await new Promise(r=>setTimeout(r,500));
    }
    cpu.stand=true;
    renderPlayerHand(i);
  }
  dealerPlays();
}

// --- TURNO DEALER ---
async function dealerPlays() {
  renderDealer(true);
  while(calculateScore(dealer.hand)<17){
    dealer.hand.push(deck.pop());
    renderDealer(true);
    await new Promise(r=>setTimeout(r,500));
  }
  dealer.stand=true;
  renderDealer(true);
  showResults();
}

// --- RISULTATI FINALI ---
function showResults() {
  const dealerScore = calculateScore(dealer.hand);
  players.forEach(player=>{
    const score = calculateScore(player.hand);
    const statusDiv = document.getElementById(player.id).querySelector('.status');
    if(score>21) statusDiv.textContent = player.isCPU?'CPU ha perso!':'Hai perso!';
    else if(dealerScore>21 || score>dealerScore) statusDiv.textContent = player.isCPU?'CPU ha vinto!':'Hai vinto!';
    else if(score===dealerScore) statusDiv.textContent='Pareggio!';
    else statusDiv.textContent = player.isCPU?'CPU ha perso!':'Hai perso!';
  });
}

// --- CALCOLO PROBABILITÀ LIVE ---
async function calculateLive() {
  const numDecks = parseInt(document.getElementById("numDecks").value) || 1;
  const player = players[0]; // giocatore umano
  if(player.hand.length<2 || dealer.hand.length<1) return;

  const c1 = player.hand[0].slice(0,-1);
  const c2 = player.hand[1].slice(0,-1);
  const dealerCard = dealer.hand[0].slice(0,-1);
  const output = document.getElementById("output");
  const tableStay = document.getElementById("tableStay");
  const tableHit = document.getElementById("tableHitAgain");
  const decisionSummary = document.getElementById("decisionSummary");

  output.innerHTML = "<p>⏳ Calcolo probabilità...</p>";
  tableStay.innerHTML = tableHit.innerHTML = decisionSummary.innerHTML = '';

  let winStay=0, lossStay=0, pushStay=0;
  let winHit=0, lossHit=0, pushHit=0;
  const TOTAL = 20000;

  function getHandValueSimple(hand){
    let total=0, aces=0;
    for(let card of hand){
      let val = (['J','Q','K'].includes(card)?10:(card==='A'?11:parseInt(card)));
      total+=val; if(val===11) aces++;
    }
    while(total>21 && aces>0){ total-=10; aces--; }
    return total;
  }

  function draw(deck){ return deck.splice(Math.floor(Math.random()*deck.length),1)[0]; }

  function simulateRound(playerHand,dealerC,deck){
    let dealerHand=[dealerC,draw(deck)];
    while(getHandValueSimple(dealerHand)<17) dealerHand.push(draw(deck));
    const pVal=getHandValueSimple(playerHand), dVal=getHandValueSimple(dealerHand);
    if(pVal>21) return 'loss';
    if(dVal>21 || pVal>dVal) return 'win';
    if(pVal<dVal) return 'loss';
    return 'push';
  }

  for(let i=0;i<TOTAL;i++){
    // STAI
    let deckStay=createDeck(numDecks).map(c=>c.slice(0,-1));
    [c1,c2,dealerCard].forEach(c=>{ const idx=deckStay.indexOf(c); if(idx!==-1) deckStay.splice(idx,1); });
    let res1=simulateRound([c1,c2],dealerCard,[...deckStay]);
    if(res1==='win') winStay++; else if(res1==='loss') lossStay++; else pushStay++;

    // CHIEDI CARTA
    let deckHit=createDeck(numDecks).map(c=>c.slice(0,-1));
    [c1,c2,dealerCard].forEach(c=>{ const idx=deckHit.indexOf(c); if(idx!==-1) deckHit.splice(idx,1); });
    let playerHand=[c1,c2,draw(deckHit)];
    while(getHandValueSimple(playerHand)<17) playerHand.push(draw(deckHit));
    let res2=simulateRound(playerHand,dealerCard,[...deckHit]);
    if(res2==='win') winHit++; else if(res2==='loss') lossHit++; else pushHit++;
  }

  function ci(count,n){ const p=count/n; const se=Math.sqrt(p*(1-p)/n); const m=1.96*se; return {percent:(p*100).toFixed(2),lower:((p-m)*100).toFixed(2),upper:((p+m)*100).toFixed(2)}; }
  function ev(w,l,n){ const v=(w-l)/n; const pWin=w/n, pLoss=l/n; const se=Math.sqrt((pWin*(1-pWin)+pLoss*(1-pLoss))/n); const m=1.96*se; return {value:v.toFixed(3),lower:(v-m).toFixed(3),upper:(v+m).toFixed(3)}; }

  const evStay = ev(winStay,lossStay,TOTAL);
  const evHit = ev(winHit,lossHit,TOTAL);

  output.innerHTML = `
    <h3>🟡 Se STAI:</h3>
    <ul>
      <li>Vittorie: ${ci(winStay,TOTAL).percent}%</li>
      <li>Pareggi: ${ci(pushStay,TOTAL).percent}%</li>
      <li>Sconfitte: ${ci(lossStay,TOTAL).percent}%</li>
      <li>EV: ${evStay.value} [${evStay.lower}-${evStay.upper}]</li>
    </ul>
    <h3>🔠 Se CHIEDI CARTA:</h3>
    <ul>
      <li>Vittorie: ${ci(winHit,TOTAL).percent}%</li>
      <li>Pareggi: ${ci(pushHit,TOTAL).percent}%</li>
      <li>Sconfitte: ${ci(lossHit,TOTAL).percent}%</li>
      <li>EV: ${evHit.value} [${evHit.lower}-${evHit.upper}]</li>
    </ul>
  `;

  if(stayChart) stayChart.destroy();
  if(hitChart) hitChart.destroy();

  stayChart = new Chart(document.getElementById('chartStay'),{
    type:'doughnut',
    data:{labels:['Vittorie','Pareggi','Sconfitte'],datasets:[{data:[winStay,pushStay,lossStay],backgroundColor:['#28a745','#ffc107','#dc3545']}]},
    options:{plugins:{title:{display:true,text:'STAI'}},responsive:true}
  });

  hitChart = new Chart(document.getElementById('chartHit'),{
    type:'doughnut',
    data:{labels:['Vittorie','Pareggi','Sconfitte'],datasets:[{data:[winHit,pushHit,lossHit],backgroundColor:['#28a745','#ffc107','#dc3545']}]},
    options:{plugins:{title:{display:true,text:'CHIEDI CARTA'}},responsive:true}
  });
}

// --- EVENT LISTENERS ---
document.getElementById('startGameBtn').addEventListener('click', () => {
  const numDecksInput = document.getElementById('numDecks');
  const numDecks = parseInt(numDecksInput.value);
  if(!numDecks || numDecks<1 || numDecks>8){ alert("Inserisci un numero valido di mazzi (1-8)"); return; }
  document.getElementById('gameTable').style.display='flex';
  document.querySelector('.setup-container').style.display='none';
  dealInitialCards(numDecks);
});

document.getElementById('resetBtn').addEventListener('click',()=>{
  document.getElementById('gameTable').style.display='none';
  document.querySelector('.setup-container').style.display='flex';
  players.forEach(player=>{
    player.hand=[]; player.stand=false;
    const div=document.getElementById(player.id);
    div.querySelector('.hand').innerHTML='';
    div.querySelector('.score').textContent='';
    div.querySelector('.status').textContent='';
    const controls=div.querySelector('.controls');
    if(controls) controls.querySelectorAll('button').forEach(btn=>btn.disabled=false);
  });
  dealer.hand=[]; dealer.stand=false;
  const d=document.getElementById('dealer');
  d.querySelector('.hand').innerHTML='';
  d.querySelector('.score').textContent='';
  d.querySelector('.status').textContent='';
  if(stayChart) stayChart.destroy();
  if(hitChart) hitChart.destroy();
});
