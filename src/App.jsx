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

// --- SMART PAIRING ---
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

    let combos = [
      [[group[0], group[3]], [group[1], group[2]]],
      [[group[0], group[2]], [group[1], group[3]]],
      [[group[0], group[1]], [group[2], group[3]]]
    ];

    let best = combos.find(c =>
      !havePlayedTogether(c[0][0].name, c[0][1].name, history) &&
      !havePlayedTogether(c[1][0].name, c[1][1].name, history)
    );

    let chosen = best || combos[0];

    matches.push({
      court: matches.length + 1,
      team1: chosen[0],
      team2: chosen[1],
      score1: "",
      score2: ""
    });
  }

  return { matches, waiting };
}

export default function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [round, setRound] = useState(1);
  const [matches, setMatches] = useState([]);
  const [history, setHistory] = useState([]);
  const [waitingPlayers, setWaitingPlayers] = useState([]);

  // --- Lisa mängija ---
  const addPlayer = () => {
    if (!name || players.find(p => p.name === name)) return;
    setPlayers([...players, { name, points: 0 }]);
    setName("");
  };

  // --- Genereeri voor ---
  const generateRound = () => {
    const { matches, waiting } = generateSmartPairs(players, history);
    setMatches(matches);
    setWaitingPlayers(waiting);
  };

  // --- Skoor update ---
  const updateScore = (i, field, value) => {
    let copy = [...matches];
    copy[i][field] = value;
    setMatches(copy);
  };

  // --- Salvesta voor ---
  const submitRound = () => {
    let updated = [...players];
    let newHistory = { partners: [] };

    matches.forEach(m => {
      let s1 = parseInt(m.score1 || 0);
      let s2 = parseInt(m.score2 || 0);

      m.team1.forEach(p => {
