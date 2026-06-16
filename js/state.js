            export let isP1Frozen = false;
            export let isP2Frozen = false;

export const gameState = {
                    isPlaying: false,
                    isTransitioning: false,
                    mode: 'sequential',
                    stunTime: 2000,
                    dataPool: [],
                    activePool: [],
                    wrongPool: [], 
                    isRetryPhase: false, 
                    currentQuestionFails: 0, 
                    currentQuiz: null,
                    totalQuestions: 0,
                    questionsPassed: 0,
                    matchStartTime: 0,
                    isSuddenDeath: false,
                    p1: { name: 'HERO', hp: 100, maxHp: 100, mana: 0, shield: 0, isStunned: false, isFrozen: false, deck: [], queue: [] },
                    p2: { name: 'BOSS', hp: 1000, maxHp: 1000, mana: 0, shield: 0, isStunned: false, isFrozen: false, deck: [], queue: [] }
                },;
