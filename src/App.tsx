import React, { useEffect, useState } from "react";
import "./App.css";

const RAID_LIST = [
  { key: "VOA", label: "VOA" },
  { key: "RS", label: "RS" },
  { key: "ICC", label: "ICC" },
  { key: "TOC", label: "TOC" },
];
const DIFFICULTIES = ["10", "25"];

interface Character {
  name: string;
  gearScore: string;
  raids: Record<string, Record<"10" | "25", boolean>>;
}

const LOCAL_STORAGE_KEY = "raidtracker-characters";

function getInitialCharacters(): Character[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function App() {
  const [characters, setCharacters] =
    useState<Character[]>(getInitialCharacters);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(characters));
  }, [characters]);

  const addCharacter = () => {
    if (!newName.trim()) return;
    setCharacters([
      ...characters,
      {
        name: newName.trim(),
        gearScore: "",
        raids: RAID_LIST.reduce((acc, raid) => {
          acc[raid.key] = { "10": false, "25": false };
          return acc;
        }, {} as Record<string, Record<"10" | "25", boolean>>),
      },
    ]);
    setNewName("");
  };

  const updateCharacter = (idx: number, updated: Partial<Character>) => {
    setCharacters((chars) =>
      chars.map((c, i) => (i === idx ? { ...c, ...updated } : c))
    );
  };

  const updateGearScore = (idx: number, value: string) => {
    updateCharacter(idx, { gearScore: value });
  };

  const updateName = (idx: number, value: string) => {
    updateCharacter(idx, { name: value });
  };

  const toggleRaid = (idx: number, raid: string, diff: "10" | "25") => {
    setCharacters((chars) =>
      chars.map((c, i) =>
        i === idx
          ? {
              ...c,
              raids: {
                ...c.raids,
                [raid]: {
                  ...c.raids[raid],
                  [diff]: !c.raids[raid][diff],
                },
              },
            }
          : c
      )
    );
  };

  const resetAllRaids = () => {
    setCharacters((chars) =>
      chars.map((char) => ({
        ...char,
        raids: RAID_LIST.reduce((acc, raid) => {
          acc[raid.key] = { "10": false, "25": false };
          return acc;
        }, {} as Record<string, Record<"10" | "25", boolean>>),
      }))
    );
  };

  return (
    <div className="tracker-container">
      <h1>WotLK Raid Tracker</h1>
      <div className="add-row">
        <input
          type="text"
          placeholder="Character Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCharacter()}
        />
        <button onClick={addCharacter}>Add Character</button>
        <button onClick={resetAllRaids} className="reset-button">
          Reset All Raids
        </button>
      </div>
      <div className="table-wrapper">
        <table className="raid-table">
          <thead>
            <tr>
              <th rowSpan={2}>Name</th>
              <th rowSpan={2}>Gear Score</th>
              {RAID_LIST.map((raid) => (
                <th key={raid.key} colSpan={2}>
                  {raid.label}
                </th>
              ))}
            </tr>
            <tr>
              {RAID_LIST.map((raid) =>
                DIFFICULTIES.map((diff) => (
                  <th key={raid.key + diff}>{diff}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {characters.map((char, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    className="cell-input"
                    type="text"
                    value={char.name}
                    onChange={(e) => updateName(idx, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="cell-input"
                    type="text"
                    value={char.gearScore}
                    onChange={(e) => updateGearScore(idx, e.target.value)}
                  />
                </td>
                {RAID_LIST.map((raid) =>
                  DIFFICULTIES.map((diff) => (
                    <td key={raid.key + diff} className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={char.raids[raid.key][diff as "10" | "25"]}
                        onChange={() =>
                          toggleRaid(idx, raid.key, diff as "10" | "25")
                        }
                      />
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
