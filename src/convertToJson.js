import fs from "fs";
import { matches } from "./matches.js";

const json = JSON.stringify(matches, null, 4);

fs.writeFileSync("./matches.json", json, "utf8");

console.log("✅ matches.json wurde erfolgreich erstellt.");
console.log(`Anzahl Spiele: ${matches.length}`);