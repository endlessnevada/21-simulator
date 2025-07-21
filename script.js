 let stayChart, hitChart;

    function toggleDarkMode() {
      document.body.classList.toggle("dark-mode");
    }

    function createDeck(numDecks) {
      const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
      let deck = [];
      for (let i = 0; i < numDecks * 4; i++) {
        for (let val of values) deck.push(val);
      }
      return deck;
    }

    function drawCard(deck) {
      const index = Math.floor(Math.random() * deck.length);
      return deck.splice(index, 1)[0];
    }

    function getHandValue(hand) {
      let val = 0, aces = 0;
      for (let card of hand) {
        if (['J','Q','K'].includes(card)) val += 10;
        else if (card === 'A') { val += 11; aces++; }
        else val += parseInt(card);
      }
      while (val > 21 && aces > 0) { val -= 10; aces--; }
      return val;
    }

    function simulateRound(playerHand, dealerCard, deck) {
      let dealerHand = [dealerCard, drawCard(deck)];
      while (getHandValue(dealerHand) < 17) {
        dealerHand.push(drawCard(deck));
      }
      const pVal = getHandValue(playerHand);
      const dVal = getHandValue(dealerHand);
      if (pVal > 21) return 'loss';
      if (dVal > 21 || pVal > dVal) return 'win';
      if (pVal < dVal) return 'loss';
      return 'push';
    }

    function evClassInterval(ev, lower, upper) {
      return lower > 0 ? 'ev-positive' : upper < 0 ? 'ev-negative' : 'ev-neutral';
    }

    function confidenceInterval(p, n) {
      const se = Math.sqrt(p * (1 - p) / n);
      const margin = 1.96 * se;
      return {
        percent: (p * 100).toFixed(2),
        lower: ((p - margin) * 100).toFixed(2),
        upper: ((p + margin) * 100).toFixed(2)
      };
    }

    function evWithCI(wins, losses, n) {
      const ev = (wins - losses) / n;
      const pWin = wins / n;
      const pLoss = losses / n;
      const se = Math.sqrt((pWin * (1 - pWin) + pLoss * (1 - pLoss)) / n);
      const margin = 1.96 * se;
      return {
        value: ev.toFixed(3),
        lower: (ev - margin).toFixed(3),
        upper: (ev + margin).toFixed(3)
      };
    }

    async function calculate() {
      const numDecks = parseInt(document.getElementById("numDecks").value);
      const c1 = document.getElementById("c1").value.toUpperCase();
      const c2 = document.getElementById("c2").value.toUpperCase();
      const dealerCard = document.getElementById("dealer").value.toUpperCase();
      const showDetails = document.getElementById("showDetails").checked;

      const output = document.getElementById("output");
      output.innerHTML = "";

      const validCards = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
      if (![c1, c2, dealerCard].every(card => validCards.includes(card))) {
        output.innerHTML = `<p style="color: red; font-weight: bold;">❌ Errore: hai inserito una o più carte non valide. Usa solo: 2-10, J, Q, K, A.</p>`;
        return;
      }

      output.innerHTML = "<p>⏳ Calcolo in corso...</p>";
      document.getElementById("tableStay").innerHTML = '';
      document.getElementById("tableHitAgain").innerHTML = '';
      document.getElementById("decisionSummary").innerHTML = '';

      await new Promise(r => setTimeout(r, 10));

     

      let winStay = 0, lossStay = 0, pushStay = 0;
      let winHit = 0, lossHit = 0, pushHit = 0;
      const TOTAL = 100000;

      for (let i = 0; i < TOTAL; i++) {
        let res1 = simulateRound([c1, c2], dealerCard, createDeck(numDecks));
        if (res1 === 'win') winStay++;
        else if (res1 === 'loss') lossStay++;
        else pushStay++;

        let deck = createDeck(numDecks);
        let playerHand = [c1, c2];
        for (let card of [...playerHand, dealerCard]) {
          let idx = deck.indexOf(card);
          if (idx !== -1) deck.splice(idx, 1);
        }
        playerHand.push(drawCard(deck));
        while (getHandValue(playerHand) < 17) {
          playerHand.push(drawCard(deck));
        }
        let res2 = simulateRound(playerHand, dealerCard, deck);
        if (res2 === 'win') winHit++;
        else if (res2 === 'loss') lossHit++;
        else pushHit++;
      }

     function resultLine(label, count) {
  const ci = confidenceInterval(count / TOTAL, TOTAL);

  let color;
  if (label === "Vittorie") color = "green";
  else if (label === "Pareggi") color = "gold"; // o "yellow"
  else if (label === "Sconfitte") color = "red";

  return `<li style="color: ${color}; font-size: 13px;">
            <strong>${label}:</strong> ${ci.percent}% [${ci.lower} - ${ci.upper}]%
          </li>`;
}


      const evStay = evWithCI(winStay, lossStay, TOTAL);
      const evHit = evWithCI(winHit, lossHit, TOTAL);

      output.innerHTML = `
        <h3>🟡 Se STAI:</h3>
        <ul>
          ${resultLine("Vittorie", winStay)}
          ${resultLine("Pareggi", pushStay)}
          ${resultLine("Sconfitte", lossStay)}
          <li><strong>Valore Atteso (EV):</strong> <span class="${evClassInterval(evStay.value, evStay.lower, evStay.upper)}">${evStay.value} [${evStay.lower} - ${evStay.upper}]</span></li>
        </ul>
        <h3>🔠 Se CHIEDI CARTA:</h3>
        <ul>
          ${resultLine("Vittorie", winHit)}
          ${resultLine("Pareggi", pushHit)}
          ${resultLine("Sconfitte", lossHit)}
          <li><strong>Valore Atteso (EV):</strong> <span class="${evClassInterval(evHit.value, evHit.lower, evHit.upper)}">${evHit.value} [${evHit.lower} - ${evHit.upper}]</span></li>
        </ul>`;

      if (stayChart) stayChart.destroy();
      if (hitChart) hitChart.destroy();

      stayChart = new Chart(document.getElementById('chartStay'), {
        type: 'doughnut',
        data: {
          labels: ['Vittorie', 'Pareggi', 'Sconfitte'],
          datasets: [{
            data: [winStay, pushStay, lossStay],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545']
          }]
        },
        options: { plugins: { title: { display: true, text: 'STAI' } }, responsive: true }
      });

      hitChart = new Chart(document.getElementById('chartHit'), {
        type: 'doughnut',
        data: {
          labels: ['Vittorie', 'Pareggi', 'Sconfitte'],
          datasets: [{
            data: [winHit, pushHit, lossHit],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545']
          }]
        },
        options: { plugins: { title: { display: true, text: 'PESCA' } }, responsive: true }
      });

 if (showDetails) {
        const baseCards = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        let decisionHTML = `<h3>🔍 Decisione consigliata dopo la TERZA carta:</h3><ul>`;
        let table1 = `<h3>Tabella: Terza carta e poi STAI</h3><table><tr><th>Carta</th><th>Win%</th><th>Loss%</th><th>Push%</th><th>EV</th></tr>`;
        let table2 = `<h3>Tabella: Terza carta e poi PESCHI ANCORA</h3><table><tr><th>Carta</th><th>Win%</th><th>Loss%</th><th>Push%</th><th>EV</th></tr>`;

        for (let card of baseCards) {
          let win1 = 0, loss1 = 0, push1 = 0;
          let win2 = 0, loss2 = 0, push2 = 0;
          const N = 5000;

          for (let i = 0; i < N; i++) {
            let deck1 = createDeck(numDecks);
            let playerHand1 = [c1, c2, card];
            for (let used of [...playerHand1, dealerCard]) {
              let idx = deck1.indexOf(used);
              if (idx !== -1) deck1.splice(idx, 1);
            }
            let result1 = simulateRound(playerHand1, dealerCard, [...deck1]);
            if (result1 === 'win') win1++;
            else if (result1 === 'loss') loss1++;
            else push1++;

            let deck2 = [...deck1];
            let playerHand2 = [...playerHand1];
            playerHand2.push(drawCard(deck2));
            let result2 = simulateRound(playerHand2, dealerCard, [...deck2]);
            if (result2 === 'win') win2++;
            else if (result2 === 'loss') loss2++;
            else push2++;
          }

          function cell(label, count) {
            const ci = confidenceInterval(count / N, N);
            return `${ci.percent}% [${ci.lower}-${ci.upper}]`;
          }

          const ev1 = (win1 - loss1)/N;
          const ev2 = (win2 - loss2)/N;

          table1 += `<tr><td>${card}</td><td>${cell("W", win1)}</td><td>${cell("L", loss1)}</td><td>${cell("P", push1)}</td><td>${ev1.toFixed(3)}</td></tr>`;
          table2 += `<tr><td>${card}</td><td>${cell("W", win2)}</td><td>${cell("L", loss2)}</td><td>${cell("P", push2)}</td><td>${ev2.toFixed(3)}</td></tr>`;

          let bustCheck = getHandValue([c1, c2, card]) > 21;
          const best = bustCheck ? `❌ SBALLATO` : ev1 > ev2 ? `✅ STAI (EV: ${ev1.toFixed(3)})` : `📥 PESCA (EV: ${ev2.toFixed(3)})`;
          decisionHTML += `<li>Se ricevi <strong>${card}</strong>: ${best}</li>`;
        }

        table1 += '</table>';
        table2 += '</table>';
        decisionHTML += '</ul>';

        document.getElementById("tableStay").innerHTML = table1;
        document.getElementById("tableHitAgain").innerHTML = table2;
        document.getElementById("decisionSummary").innerHTML = decisionHTML;
      }
    }

