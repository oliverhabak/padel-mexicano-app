import React, { useState, useMemo } from "react";

// --- Helperid ---
function havePlayedTogether(p1, p2, history) {
  return history.some(h =>
    h.partners.some(
      pair =>
        (pair[0] === p1 && pair[1] === p2) ||
        (pair[0] === p2 && pair[1] === p1)
    )
  );
}

function havePlayedAgainstRecently(p1, p2, history, roundsBack = 2) {
  let recent = history.slice(-roundsBack);

  return recent.some(h =>
    h.matches?.some(m =>
      (m.team1.includes(p1) && m.team2.includes(p2)) ||
      (m.team1.includes(p2) && m.team2.includes(p1))
    )
  );
}

// --- PRO PAIRING ---
function generateSmartPairs(players, history) {
  let sorted = [...players].sort((a, b) => b.points - a.points);

  let matches = [];
  let waiting = [];

  for (let i = 0; i < sorted.length; i += 4) {
    let group = sorted.slice(i, i + 4);

    if (group.length < 4) {
      waiting = group;
      continue;
    }

    const combos = [
      [[group[0], group[3]], [group[1], group[2]]],
      [[group[0], group[2]], [group[1], group[3]]],
      [[group[0], group[1]], [group[2], group[3]]]
    ];

    let bestScore = Infinity;
    let bestCombo = combos[0];

    combos.forEach(combo => {
      let score = 0;

      // Partner kordus = väga halb
      combo.forEach(team => {
        if (havePlayedTogether(team[0].name, team[1].name, history)) {
          score += 50;
        }
      });

      // Vastase kordus hiljuti = halb
      if (
        havePlayedAgainstRecently(
          combo[0][0].name,
          combo[1][0].name,
          history
        )
      ) {
        score += 20;
      }

      // Tasakaal
      let t1 = combo[0][0].points + combo[0][1].points;
      let t2 = combo[1][0].points + combo[1][1].points;

      score += Math.abs(t1 - t2) * 0.1;

      // väike random
      score += Math.random() * 2;

      if (score < bestScore) {
        bestScore = score;
        bestCombo = combo;
      }
    });

    matches.push({
      court: matches.length + 1,
      team1: bestCombo[0],
      team2: bestCombo[1],
      score1: "",
      score2: ""
    });
  }

  return { matches, waiting };
}

// --- APP ---
export default function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [round, setRound] = useState(1);
  const [matches, setMatches] = useState([]);
