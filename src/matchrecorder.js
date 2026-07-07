import fs from "fs";
import readline from "readline";

const MATCHES_FILE = "./matches.json";

function loadMatches() {
    return JSON.parse(fs.readFileSync(MATCHES_FILE, "utf8"));
}

function saveMatches(matches) {
    fs.writeFileSync(
        MATCHES_FILE,
        JSON.stringify(matches, null, 4),
        "utf8"
    );
}

function ask(question, rl) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer));
    });
}

function getRequiredSets(match) {
    if (match.phase === "gruppe" || match.phase === "viertelfinale") {
        return 2;
    }
    return 3;
}

function calculateSetScore(sets) {
    let player1Sets = 0;
    let player2Sets = 0;

    for (const set of sets) {
        if (set.player1 > set.player2) player1Sets++;
        if (set.player2 > set.player1) player2Sets++;
    }

    return { player1Sets, player2Sets };
}

async function main() {
    const matches = loadMatches();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const matchIdInput = await ask("Spiel-ID: ", rl);
    const matchId = Number(matchIdInput);

    const match = matches.find(match => match.id === matchId);

    if (!match) {
        console.error("Spiel nicht gefunden.");
        rl.close();
        return;
    }

    console.log(`\n${match.player1Id} vs ${match.player2Id}`);
    console.log(`${match.phase} · ${match.table} · ${match.time}\n`);

    const requiredSets = getRequiredSets(match);
    const sets = [];

    while (true) {
        const setNumber = sets.length + 1;

        const p1 = Number(await ask(`Satz ${setNumber} Punkte ${match.player1Id}: `, rl));
        const p2 = Number(await ask(`Satz ${setNumber} Punkte ${match.player2Id}: `, rl));

        sets.push({
            player1: p1,
            player2: p2
        });

        const score = calculateSetScore(sets);

        console.log(`Satzstand: ${score.player1Sets}:${score.player2Sets}\n`);

        if (
            score.player1Sets === requiredSets ||
            score.player2Sets === requiredSets
        ) {
            const winnerId =
                score.player1Sets > score.player2Sets
                    ? match.player1Id
                    : match.player2Id;

            match.status = "gespielt";
            match.result = {
                winnerId,
                player1Sets: score.player1Sets,
                player2Sets: score.player2Sets,
                sets
            };
            fillLiveMatches(matches, 2);
            saveMatches(matches);

            console.log("Ergebnis gespeichert.");
            console.log(`${match.player1Id} ${score.player1Sets}:${score.player2Sets} ${match.player2Id}`);

            rl.close();
            return;
        }
    }
}

function fillLiveMatches(matches) {
    const currentLiveMatches = matches.filter(match => match.status === "live");

    // Sobald ein Halbfinale oder Finale läuft oder ansteht,
    // gibt es nur noch ein Live-Spiel.
    const hasSingleTablePhase =
        matches.some(match =>
            match.id >= 45 &&
            (match.status === "live" || match.status === "gespielt")
        );

    const maxLiveMatches = hasSingleTablePhase ? 1 : 2;

    const missingLiveSlots = maxLiveMatches - currentLiveMatches.length;

    if (missingLiveSlots <= 0) {
        return;
    }

    const nextPlannedMatches = matches
        .filter(match => match.status === "geplant")
        .sort((a, b) => a.id - b.id)
        .slice(0, missingLiveSlots);

    for (const match of nextPlannedMatches) {
        match.status = "live";
    }
}

main();
