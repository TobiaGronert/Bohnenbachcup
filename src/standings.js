/*
import { players } from "./players.js";
import { loadMatches } from "./dataLoader.js";
const matches = await loadMatches();
export function calculateStandings(group) {
    const groupPlayers = players.filter(player => player.group === group);

    const standings = groupPlayers.map(player => ({
        playerId: player.id,
        name: player.name,
        group: player.group,

        matchesPlayed: 0,
        wins: 0,
        losses: 0,

        setsWon: 0,
        setsLost: 0,
        setDifference: 0,

        pointsWon: 0,
        pointsLost: 0,
        pointDifference: 0,
    }));

    const groupMatches = matches.filter(match =>
        match.phase === "gruppe" &&
        match.group === group &&
        match.status === "gespielt" &&
        match.result !== null
    );

    for (const match of groupMatches) {
        const player1 = standings.find(player => player.playerId === match.player1Id);
        const player2 = standings.find(player => player.playerId === match.player2Id);

        if (!player1 || !player2) {
            continue;
        }

        const player1Sets = match.result.player1Sets;
        const player2Sets = match.result.player2Sets;

        player1.matchesPlayed++;
        player2.matchesPlayed++;

        player1.setsWon += player1Sets;
        player1.setsLost += player2Sets;

        player2.setsWon += player2Sets;
        player2.setsLost += player1Sets;

        if (player1Sets > player2Sets) {
            player1.wins++;
            player2.losses++;
        } else {
            player2.wins++;
            player1.losses++;
        }

        if (Array.isArray(match.result.sets)) {
            for (const set of match.result.sets) {
                player1.pointsWon += set.player1;
                player1.pointsLost += set.player2;

                player2.pointsWon += set.player2;
                player2.pointsLost += set.player1;
            }
        }
    }

    for (const player of standings) {
        player.setDifference = player.setsWon - player.setsLost;
        player.pointDifference = player.pointsWon - player.pointsLost;
    }

    standings.sort((a, b) => {
        if (b.wins !== a.wins) {
            return b.wins - a.wins;
        }

        if (b.setDifference !== a.setDifference) {
            return b.setDifference - a.setDifference;
        }

        return b.pointDifference - a.pointDifference;
    });

    return standings;
}

export function calculateAllStandings() {
    return {
        A: calculateStandings("A"),
        B: calculateStandings("B"),
        C: calculateStandings("C"),
        D: calculateStandings("D"),
    };
}*/


import { players } from "./players.js";
import { getMatches } from "./helpers.js";

export function calculateStandings(group) {
    const matches = getMatches();

    const groupPlayers = players.filter(player => player.group === group);

    const standings = groupPlayers.map(player => ({
        playerId: player.id,
        name: player.name,
        group: player.group,

        matchesPlayed: 0,
        wins: 0,
        losses: 0,

        setsWon: 0,
        setsLost: 0,
        setDifference: 0,

        pointsWon: 0,
        pointsLost: 0,
        pointDifference: 0,
    }));

    const groupMatches = matches.filter(match =>
        match.phase === "gruppe" &&
        match.group === group &&
        match.status === "gespielt" &&
        match.result
    );

    for (const match of groupMatches) {
        const player1 = standings.find(p => p.playerId === match.player1Id);
        const player2 = standings.find(p => p.playerId === match.player2Id);

        if (!player1 || !player2) continue;

        const r = match.result;

        player1.matchesPlayed++;
        player2.matchesPlayed++;

        player1.setsWon += r.player1Sets;
        player1.setsLost += r.player2Sets;

        player2.setsWon += r.player2Sets;
        player2.setsLost += r.player1Sets;

        if (r.winnerId === match.player1Id) {
            player1.wins++;
            player2.losses++;
        } else {
            player2.wins++;
            player1.losses++;
        }

        for (const set of r.sets) {
            player1.pointsWon += set.player1;
            player1.pointsLost += set.player2;

            player2.pointsWon += set.player2;
            player2.pointsLost += set.player1;
        }
    }

    for (const player of standings) {
        player.setDifference = player.setsWon - player.setsLost;
        player.pointDifference = player.pointsWon - player.pointsLost;
    }

    return sortStandingsWithTieBreaker(standings, groupMatches);
}

function sortStandingsWithTieBreaker(standings, groupMatches) {
    const winGroups = {};

    for (const player of standings) {
        if (!winGroups[player.wins]) {
            winGroups[player.wins] = [];
        }

        winGroups[player.wins].push(player);
    }

    return Object.values(winGroups)
        .sort((a, b) => b[0].wins - a[0].wins)
        .flatMap(tiedPlayers => sortTieGroup(tiedPlayers, groupMatches));
}

function sortTieGroup(tiedPlayers, groupMatches) {
    if (tiedPlayers.length === 1) {
        return tiedPlayers;
    }

    const tiedIds = tiedPlayers.map(player => player.playerId);

    const directMatches = groupMatches.filter(match =>
        tiedIds.includes(match.player1Id) &&
        tiedIds.includes(match.player2Id)
    );

    const miniTable = tiedPlayers.map(player => ({
        ...player,
        h2hWins: 0,
        h2hSetsWon: 0,
        h2hSetsLost: 0,
        h2hSetDifference: 0,
        h2hPointsWon: 0,
        h2hPointsLost: 0,
        h2hPointDifference: 0,
    }));

    for (const match of directMatches) {
        const player1 = miniTable.find(p => p.playerId === match.player1Id);
        const player2 = miniTable.find(p => p.playerId === match.player2Id);

        if (!player1 || !player2 || !match.result) continue;

        const r = match.result;

        if (r.winnerId === match.player1Id) {
            player1.h2hWins++;
        } else {
            player2.h2hWins++;
        }

        player1.h2hSetsWon += r.player1Sets;
        player1.h2hSetsLost += r.player2Sets;

        player2.h2hSetsWon += r.player2Sets;
        player2.h2hSetsLost += r.player1Sets;

        for (const set of r.sets) {
            player1.h2hPointsWon += set.player1;
            player1.h2hPointsLost += set.player2;

            player2.h2hPointsWon += set.player2;
            player2.h2hPointsLost += set.player1;
        }
    }

    for (const player of miniTable) {
        player.h2hSetDifference = player.h2hSetsWon - player.h2hSetsLost;
        player.h2hPointDifference = player.h2hPointsWon - player.h2hPointsLost;
    }

    return miniTable.sort((a, b) =>
        b.h2hWins - a.h2hWins ||
        b.h2hSetDifference - a.h2hSetDifference ||
        b.h2hPointDifference - a.h2hPointDifference ||
        b.setDifference - a.setDifference ||
        b.pointDifference - a.pointDifference
    );
}

export function calculateAllStandings() {
    return {
        A: calculateStandings("A"),
        B: calculateStandings("B"),
        C: calculateStandings("C"),
        D: calculateStandings("D"),
    };
}
