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
}