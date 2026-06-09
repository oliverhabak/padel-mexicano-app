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
    h.matches.some(m =>
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
    let best = combos[0];

    combos.forEach(combo => {
      let score = 0;

      combo.forEach(team => {
        if (havePlayedTogether(team[0].name, team[1].name, history)) {
          score += 50;
        }
      });

      if (
        havePlayedAgainstRecently(
          combo[0][0].name,
          combo[1][0].name,
          history
        )
      ) {
        score += 20;
      }

      let t1 = combo[0][0].points + combo[0][1].points;
      let t2 = combo[1][0].points + combo[1][1].points;

      score += Math.abs(t1 - t2);
      score += Math.random(); // väikene random

      if (score < bestScore) {
        bestScore = score;
        best = combo;
      }
    });

    matches.push({
      court: matches.length + 1,
      team1: best[0],
      team2: best[1],
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
  const [history, setHistory] = useState([]);
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  const [tvMode, setTvMode] = useState(false);

  const addPlayer = () => {
    if (!name || players.find(p => p.name === name)) return;
    setPlayers([...players, { name, points: 0 }]);
    setName("");
  };

  const generateRound = () => {
    const { matches, waiting } = generateSmartPairs(players, history);
    setMatches(matches);
    setWaitingPlayers(waiting);
  };

  const updateScore = (i, field, value) => {
    let copy = [...matches];
    copy[i][field] = value;
    setMatches(copy);
  };

  const submitRound = () => {
    let updated = [...players];

    let newHistory = {
      partners: [],
      matches: []
    };

    matches.forEach(m => {
      let s1 = parseInt(m.score1 || 0);
      let s2 = parseInt(m.score2 || 0);

      m.team1.forEach(p => {
        updated.find(x => x.name === p.name).points += s1;
      });

      m.team2.forEach(p => {
        updated.find(x => x.name === p.name).points += s2;
      });

      newHistory.partners.push(
        [m.team1[0].name, m.team1[1].name],
