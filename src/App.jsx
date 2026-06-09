import React, { useState, useMemo, useEffect } from "react";

// --- Helper functions ---
function havePlayedTogether(p1, p2, history) {
  return history.some(h => h.partners.some(pair =>
    (pair[0] === p1 && pair[1] === p2) ||
    (pair[0] === p2 && pair[1] === p1)
  ));
}

function havePlayedAgainst(p1, p2, history) {
  return history.some(h => h.matches.some(m =>
    (m.team1.includes(p1) && m.team2.includes(p2)) ||
    (m.team1.includes(p2) && m.team2.includes(p1))
  ));
}

function generateSmartPairs(players, history) {
  let sorted = [...players].sort((a, b) => b.points - a.points);
  let matches = [];

  for (let i = 0; i < sorted.length; i += 4) {
    let g = sorted.slice(i, i + 4);
    if (g.length < 4) continue;

    let combos = [
      [[g[0], g[3]], [g[1], g[2]]],
      [[g[0], g[2]], [g[1], g[3]]],
      [[g[0], g[1]], [g[2], g[3]]]
    ];

    let best = combos.find(c =>
      !havePlayedTogether(c[0][0].name, c[0][1].name, history) &&
      !havePlayedTogether(c[1][0].name, c[1][1].name, history) &&
      !havePlayedAgainst(c[0][0].name, c[1][0].name, history)
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

  return matches;
}

export default function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [round, setRound] = useState(1);
  const [matches, setMatches] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  const addPlayer = () => {
    if (!name || players.find(p => p.name === name)) return;
    setPlayers([...players, { name, points: 0 }]);
    setName("");
  };

  const generateRound = () => {
    setMatches(generateSmartPairs(players, history));
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
        [m.team2[0].name, m.team2[1].name]
      );

      newHistory.matches.push({
        team1: m.team1.map(p => p.name),
        team2: m.team2.map(p => p.name)
      });
    });

    setPlayers(updated);
    setHistory([...history, newHistory]);
    setMatches([]);
    setRound(round + 1);
  };

  const leaderboard = useMemo(
    () => [...players].sort((a, b) => b.points - a.points),
    [players]
  );

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1>🏆 Padel Mexicano Pro</h1>

      <div>
        <input
          placeholder="Mängija nimi"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={addPlayer}>Lisa</button>
      </div>

      <h2>📊 Edetabel</h2>
      {leaderboard.map((p, i) => (
        <div key={p.name}>
          {i + 1}. {p.name} — {p.points}
        </div>
      ))}

      <h2>🎾 Voor {round}</h2>
      <button onClick={generateRound}>Genereeri voor</button>

      {matches.map((m, i) => (
        <div key={i} style={{ border: "1px solid #ccc", margin: 8, padding: 8 }}>
          <b>Väljak {m.court}</b>
          <div>
            {m.team1[0].name} + {m.team1[1].name}
            <b> vs </b>
            {m.team2[0].name} + {m.team2[1].name}
          </div>
          <input placeholder="16" onChange={e => updateScore(i, "score1", e.target.value)} />
          <input placeholder="10" onChange={e => updateScore(i, "score2", e.target.value)} />
        </div>
      ))}

      {matches.length > 0 && (
        <button onClick={submitRound}>Salvesta voor</button>
      )}

      <h2>📺 TV vaade (lihtne scoreboard)</h2>
      {leaderboard.slice(0, 10).map((p, i) => (
        <div key={p.name} style={{ fontSize: 20 }}>
          #{i + 1} {p.name} — {p.points}
        </div>
      ))}
    </div>
  );
}
