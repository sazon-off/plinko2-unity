const runtimeConfig = typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : {};

const readNumber = (key, fallback) => {
    const value = Number(runtimeConfig?.[key]);
    return Number.isFinite(value) ? value : fallback;
};

const readString = (key, fallback) => {
    const value = runtimeConfig?.[key];
    return typeof value === 'string' ? value : fallback;
};

export const GAME_CONFIG = {
    defaultBalance: readNumber('INITIAL_BALANCE', 25),
    defaultBet: readNumber('BET_AMOUNT', 5),
    currency: readString('CURRENCY', 'EUR'),
    targetBalance: readNumber('TARGET_BALANCE', 200),
    spinButtonLabel: readString('PLAY_BUTTON_TEXT', 'Play'),
    ballDropIndices: [1, 2, 3, 7, 10], // Indices where balls will fall
    welcomeModal: {
        title: readString('WELCOME_TEXT', 'Welcome Bonus'),
        subTitle: readString('WELCOME_TEXT_2', ''),
        actionLabel: readString('RECEIVE_BUTTON_TEXT', 'RECEIVE'),
        amountTemplate: '{amount} {currency}',
    },
    finalModal: {
        title: readString('FINAL_TITLE_TEXT', 'Congratulations!'),
        subTitle: readString('FINAL_TEXT', 'YOU WON'),
        freeSpins: readString('FREE_SPINS_TEXT', '+ 250 free spins'),
        installLabel: readString('INSTALL_BUTTON_TEXT', 'INSTALL'),
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
