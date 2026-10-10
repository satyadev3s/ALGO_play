/**
 * AlgoPlay - Centralized Storage & Learning Analytics Service
 * Handles persistence for student progress, diagnostic results, pre/post-tests,
 * misconception logs, adaptive mastery, and teacher class analytics.
 * 
 * Safe against missing, malformed, or corrupted browser storage.
 */

const STORAGE_KEYS = {
  FRACTION_STATE: 'algoplay_fraction_state',
  PRE_TEST: 'algoplay_fraction_pretest',
  POST_TEST: 'algoplay_fraction_posttest',
  MISCONCEPTIONS: 'algoplay_fraction_misconceptions',
  MASTERY: 'algoplay_fraction_mastery',
  ATTEMPTS: 'algoplay_fraction_attempts',
  PROFILE: 'algoplay_profile',
  STUDENT_NAME: 'student_name',
  TEACHER_STUDENTS: 'algoplay_students'
};

const StorageService = {
  // Safe JSON parse with fallback
  safeGet(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data);
    } catch (e) {
      console.warn(`[StorageService] Corrupt data in key "${key}", reverting to fallback`, e);
      return fallback;
    }
  },

  safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[StorageService] Failed to set key "${key}"`, e);
      return false;
    }
  },

  // Get active student profile
  getProfile() {
    return this.safeGet(STORAGE_KEYS.PROFILE, {
      xp: 120,
      coins: 45,
      level: 1,
      name: localStorage.getItem(STORAGE_KEYS.STUDENT_NAME) || 'Explorer'
    });
  },

  // Award XP and coins safely
  addReward(xpAmount, coinAmount = 0) {
    const profile = this.getProfile();
    profile.xp = (profile.xp || 0) + xpAmount;
    profile.coins = (profile.coins || 0) + coinAmount;
    profile.level = Math.floor(profile.xp / 500) + 1;
    this.safeSet(STORAGE_KEYS.PROFILE, profile);
    return profile;
  },

  // Get Fraction Mission Progress
  getFractionState() {
    return this.safeGet(STORAGE_KEYS.FRACTION_STATE, {
      preTestCompleted: false,
      preTestScore: null,
      mission1Completed: false,
      mission2Completed: false,
      mission3Completed: false,
      postTestCompleted: false,
      postTestScore: null,
      currentMission: 1,
      totalHintsUsed: 0,
      totalAttempts: 0,
      lastUpdated: new Date().toISOString()
    });
  },

  saveFractionState(state) {
    const current = this.getFractionState();
    const updated = { ...current, ...state, lastUpdated: new Date().toISOString() };
    this.safeSet(STORAGE_KEYS.FRACTION_STATE, updated);
    return updated;
  },

  // Save Pre-Test Results
  savePreTest(score, total, details = []) {
    const result = {
      score,
      total,
      percentage: Math.round((score / total) * 100),
      timestamp: new Date().toISOString(),
      details
    };
    this.safeSet(STORAGE_KEYS.PRE_TEST, result);
    this.saveFractionState({ preTestCompleted: true, preTestScore: result.percentage });
    return result;
  },

  getPreTest() {
    return this.safeGet(STORAGE_KEYS.PRE_TEST, null);
  },

  // Save Post-Test Results
  savePostTest(score, total, details = []) {
    const pre = this.getPreTest();
    const percentage = Math.round((score / total) * 100);
    const prePercentage = pre ? pre.percentage : 0;
    const gainPoints = percentage - prePercentage;

    const result = {
      score,
      total,
      percentage,
      prePercentage,
      gainPoints, // Improvement in percentage points
      timestamp: new Date().toISOString(),
      details
    };
    this.safeSet(STORAGE_KEYS.POST_TEST, result);
    this.saveFractionState({ postTestCompleted: true, postTestScore: percentage });
    
    // Reward significant bonus XP for completing post-test and demonstrating learning
    this.addReward(150, 50);
    return result;
  },

  getPostTest() {
    return this.safeGet(STORAGE_KEYS.POST_TEST, null);
  },

  // Record a detected misconception
  recordMisconception(misconceptionId, questionId, studentChoice) {
    const log = this.safeGet(STORAGE_KEYS.MISCONCEPTIONS, []);
    log.push({
      misconceptionId,
      questionId,
      studentChoice,
      timestamp: new Date().toISOString()
    });
    this.safeSet(STORAGE_KEYS.MISCONCEPTIONS, log);
  },

  getMisconceptionLog() {
    return this.safeGet(STORAGE_KEYS.MISCONCEPTIONS, []);
  },

  // Concept Mastery tracking (requires 2 consecutive correct answers to mark Mastered)
  getConceptMastery() {
    return this.safeGet(STORAGE_KEYS.MASTERY, {
      equivalent_fractions: { streak: 0, mastered: false, attempts: 0 },
      finding_lcm: { streak: 0, mastered: false, attempts: 0 },
      unlike_addition_same_family: { streak: 0, mastered: false, attempts: 0 },
      unlike_addition_coprime: { streak: 0, mastered: false, attempts: 0 },
      marketplace_word_problems: { streak: 0, mastered: false, attempts: 0 }
    });
  },

  updateConceptMastery(concept, isCorrect) {
    const mastery = this.getConceptMastery();
    if (!mastery[concept]) {
      mastery[concept] = { streak: 0, mastered: false, attempts: 0 };
    }
    mastery[concept].attempts++;
    if (isCorrect) {
      mastery[concept].streak++;
      if (mastery[concept].streak >= 2) {
        mastery[concept].mastered = true;
      }
    } else {
      mastery[concept].streak = 0; // Reset consecutive streak on error
    }
    this.safeSet(STORAGE_KEYS.MASTERY, mastery);
    return mastery[concept];
  },

  // Aggregate Class Insights for Teacher Dashboard
  getClassLearningInsights() {
    const pre = this.getPreTest();
    const post = this.getPostTest();
    const state = this.getFractionState();
    const mastery = this.getConceptMastery();
    const miscLog = this.getMisconceptionLog();

    // Tally misconceptions
    const miscounts = {
      ADD_NUM_AND_DENOM: 0,
      ADD_NUM_KEEP_DENOM: 0,
      FORGOT_TO_SCALE_NUM: 0,
      MULTIPLIED_INSTEAD: 0,
      UNCLASSIFIED_ERROR: 0
    };
    miscLog.forEach(m => {
      if (miscounts[m.misconceptionId] !== undefined) {
        miscounts[m.misconceptionId]++;
      } else {
        miscounts.UNCLASSIFIED_ERROR++;
      }
    });

    const activeStudentName = localStorage.getItem(STORAGE_KEYS.STUDENT_NAME) || 'Current Student';

    // Demo class dataset for demonstration context
    const demoStudents = [
      {
        name: activeStudentName,
        isCurrent: true,
        missionsCompleted: [state.mission1Completed, state.mission2Completed, state.mission3Completed].filter(Boolean).length,
        preScore: pre ? pre.percentage : null,
        postScore: post ? post.percentage : null,
        gain: post && pre ? post.percentage - pre.percentage : null,
        hintsUsed: state.totalHintsUsed || 0,
        needsSupport: miscLog.length >= 3 && (!post || post.percentage < 60)
      },
      {
        name: "Aarav Patel",
        isCurrent: false,
        missionsCompleted: 3,
        preScore: 40,
        postScore: 80,
        gain: +40,
        hintsUsed: 3,
        needsSupport: false
      },
      {
        name: "Diya Sharma",
        isCurrent: false,
        missionsCompleted: 3,
        preScore: 20,
        postScore: 80,
        gain: +60,
        hintsUsed: 4,
        needsSupport: false
      },
      {
        name: "Rohan Verma",
        isCurrent: false,
        missionsCompleted: 2,
        preScore: 40,
        postScore: 60,
        gain: +20,
        hintsUsed: 6,
        needsSupport: true
      },
      {
        name: "Ananya Sen",
        isCurrent: false,
        missionsCompleted: 3,
        preScore: 60,
        postScore: 100,
        gain: +40,
        hintsUsed: 1,
        needsSupport: false
      },
      {
        name: "Kavya Reddy",
        isCurrent: false,
        missionsCompleted: 1,
        preScore: 20,
        postScore: null,
        gain: null,
        hintsUsed: 5,
        needsSupport: true
      }
    ];

    return {
      activeStudent: {
        pre,
        post,
        state,
        mastery,
        miscLog
      },
      classStudents: demoStudents,
      misconceptionTally: miscounts
    };
  },

  // Reset demo state for fresh demonstration test
  resetDemoFractionData() {
    localStorage.removeItem(STORAGE_KEYS.FRACTION_STATE);
    localStorage.removeItem(STORAGE_KEYS.PRE_TEST);
    localStorage.removeItem(STORAGE_KEYS.POST_TEST);
    localStorage.removeItem(STORAGE_KEYS.MISCONCEPTIONS);
    localStorage.removeItem(STORAGE_KEYS.MASTERY);
    console.log('[StorageService] Reset fraction mission data for fresh demo');
  }
};

// Export to window for standard script access
if (typeof window !== 'undefined') {
  window.StorageService = StorageService;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageService;
}
