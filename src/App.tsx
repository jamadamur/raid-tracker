import React, { useEffect, useState } from "react";
import "./App.css";

const RAID_LIST = [
  { key: "VOA", label: "VOA" },
  { key: "RS", label: "RS" },
  { key: "ICC", label: "ICC" },
  { key: "TOC", label: "TOC" },
  { key: "Naxx", label: "Naxx" },
  { key: "Ulduar", label: "Ulduar" },
];

const DIFFICULTIES = ["10", "25"];

interface Character {
  name: string;
  gearScore: string;
  raids: Record<string, Record<"10" | "25", boolean>>;
}

const LOCAL_STORAGE_KEY = "raidtracker-characters";
const LAST_VISIT_KEY = "raidtracker-last-visit";

function getInitialCharacters(): Character[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];
  try {
    const characters = JSON.parse(data);
    // Migrate characters to include any new raids
    return characters.map((char: Character) => migrateCharacter(char));
  } catch {
    return [];
  }
}

// Migrate character data to include all current raids
function migrateCharacter(char: Character): Character {
  const migratedRaids: Record<string, Record<"10" | "25", boolean>> = {};

  // Initialize all raids from current RAID_LIST
  RAID_LIST.forEach((raid) => {
    // If character has this raid data, use it; otherwise default to unchecked
    if (char.raids && char.raids[raid.key]) {
      migratedRaids[raid.key] = {
        "10": char.raids[raid.key]["10"] || false,
        "25": char.raids[raid.key]["25"] || false,
      };
    } else {
      // New raid - default to unchecked
      migratedRaids[raid.key] = { "10": false, "25": false };
    }
  });

  return {
    ...char,
    raids: migratedRaids,
  };
}

// Get the most recent Wednesday 6 AM CEST
function getLastWednesday6AM(): Date {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 3 = Wednesday
  const daysSinceWednesday = (currentDay + 4) % 7; // Days since last Wednesday

  const lastWednesday = new Date(now);
  lastWednesday.setDate(now.getDate() - daysSinceWednesday);
  lastWednesday.setHours(6, 0, 0, 0); // 6 AM

  // Adjust for CEST (UTC+2) - convert to UTC
  lastWednesday.setHours(lastWednesday.getHours() - 2);

  return lastWednesday;
}

// Check if automatic reset should be triggered
function shouldAutoReset(): boolean {
  const lastVisitStr = localStorage.getItem(LAST_VISIT_KEY);
  if (!lastVisitStr) return false;

  try {
    const lastVisit = new Date(parseInt(lastVisitStr));
    const lastWednesday6AM = getLastWednesday6AM();

    return lastVisit < lastWednesday6AM;
  } catch {
    return false;
  }
}

function App() {
  const [characters, setCharacters] =
    useState<Character[]>(getInitialCharacters);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(characters));
  }, [characters]);

  // Check for automatic reset on component mount
  useEffect(() => {
    if (shouldAutoReset()) {
      resetAllRaids();
    }
    // Update last visit timestamp
    localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
  }, []);

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
                        checked={
                          char.raids[raid.key]?.[diff as "10" | "25"] || false
                        }
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
