export const GAME_CONFIG = {
    defaultBalance: 25,
    defaultBet: 5,
    currency: '€',
    targetBalance: 200,
    spinButtonLabel: 'PLAY',
    ballDropIndices: [1, 2, 3, 7, 10], // Indices where balls will fall
    welcomeModal: {
        title: 'Welcome Bonus',
        subTitle: '',
        actionLabel: 'RECEIVE',
        amountTemplate: '{amount} {currency}',
    },
    finalModal: {
        title: 'Congratulations!',
        subTitle: 'YOU WON',
        freeSpins: '+ 250 free spins',
        installLabel: 'INSTALL',
    },
};

// Calculate multipliers to reach target balance
export function calculateMultipliers() {
    const {defaultBalance, defaultBet, targetBalance, ballDropIndices} = GAME_CONFIG;

    // Total money needed to win
    const totalWinNeeded = targetBalance - defaultBalance;

    // Calculate total bet cost
    const totalBetCost = defaultBet * ballDropIndices.length;

    // Total winnings from multipliers
    const totalWinnings = totalWinNeeded + totalBetCost;

    // Fixed multipliers for certain slots
    const fixedMultipliers = {
        2: 0.6,
        4: 0.3,
        5: 0.1,
        6: 0.3,
        8: 0.6
    };

    // Base symmetric template for scalable slots (0, 1, 3, 7, 9, 10)
    // Template values for slots: [0, 1, 3, 7, 9, 10]
    const template = {
        0: 30,
        1: 10,
        3: 2,
        7: 2,
        9: 10,
        10: 30
    };

    // Calculate total value from slots that will be hit (excluding fixed ones)
    let totalTemplateValue = 0;
    ballDropIndices.forEach(index => {
        if (!fixedMultipliers[index]) {
            totalTemplateValue += template[index];
        }
    });

    // Calculate scale factor
    const scaleFactor = (totalWinnings / defaultBet) / totalTemplateValue;

    // Build multipliers array
    const multipliers = [];
    for (let i = 0; i < 11; i++) {
        if (fixedMultipliers[i] !== undefined) {
            // Use fixed multiplier
            multipliers[i] = fixedMultipliers[i];
        } else if (template[i] !== undefined) {
            // Scale and round
            const scaled = template[i] * scaleFactor;
            if (scaled < 10) {
                multipliers[i] = Math.round(scaled * 2) / 2; // Round to .5
            } else {
                multipliers[i] = Math.round(scaled); // Round to whole
            }
        } else {
            multipliers[i] = 0.1; // Default
        }
    }

    return multipliers;
}

