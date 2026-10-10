/**
 * AlgoPlay - Grade 6 Fraction Assessment & Adaptive Learning Engine
 * Targets: Adding fractions with unlike denominators in an Indian Marketplace context.
 * 
 * Includes:
 * - Deterministic misconception detection
 * - Pedagogical visual fraction strip definitions
 * - Step-by-step scaffolding & targeted hints
 * - Adaptive branching logic
 * - Pre-Test and Post-Test learning gain measurement
 * - English and Telugu bilingual support strings
 */

const FractionEngine = {
  // Common Misconception Definitions
  MISCONCEPTIONS: {
    ADD_NUM_AND_DENOM: {
      id: "ADD_NUM_AND_DENOM",
      name: "Adding numerators and denominators directly",
      nameTe: "లవాలను మరియు హారాలను నేరుగా కూడటం",
      description: "Student treats fractions as independent whole numbers, adding tops and bottoms (e.g. 1/2 + 1/4 = 2/6).",
      explanation: "Remember: Denominators represent the *size* of each slice, not the count! If you cut a watermelon into 2 big halves and another into 4 slices, adding them does not give you tiny sixths (2/6). You must make the slices the same size first!",
      explanationTe: "గుర్తుంచుకోండి: హారాలు ముక్కల పరిమాణాన్ని సూచిస్తాయి! 1/2 మరియు 1/4 ముక్కలు వేర్వేరు పరిమాణంలో ఉంటాయి. హారాలను నేరుగా కూడితే ముక్కలు మరింత చిన్నవిగా (2/6) అయిపోతాయి. ముందుగా సమాన హారాలను (LCM) కనుగొనాలి!",
      remedy: "Convert both fractions to have the same common denominator (LCM) before adding numerators."
    },
    ADD_NUM_KEEP_DENOM: {
      id: "ADD_NUM_KEEP_DENOM",
      name: "Adding numerators without converting to common denominator",
      nameTe: "హారాలను సమానం చేయకుండా లవాలను మాత్రమే కూడటం",
      description: "Student adds numerators (1+1=2) and keeps one of the denominators without scaling (e.g. 1/2 + 1/4 = 2/4).",
      explanation: "You added 1 + 1 = 2, but 1/2 is ALREADY equal to 2/4! You cannot add half a roti to a quarter of a roti without first converting the half into two quarters (2/4). So 2/4 + 1/4 = 3/4.",
      explanationTe: "మీరు 1 + 1 = 2 అని కూడారు, కానీ 1/2 అనేది ఇప్పటికే 2/4 కు సమానం! కాబట్టి 2/4 + 1/4 = 3/4 అవుతుంది.",
      remedy: "First rename the fraction with the smaller denominator to match the common denominator."
    },
    FORGOT_TO_SCALE_NUM: {
      id: "FORGOT_TO_SCALE_NUM",
      name: "Changed denominator but forgot to scale the numerator",
      nameTe: "హారాన్ని మార్చారు కానీ లవాన్ని గుణించడం మర్చిపోయారు",
      description: "Student identifies common denominator but leaves original numerator unchanged (e.g. 1/2 + 1/4 -> 1/4 + 1/4 = 2/4).",
      explanation: "Golden Rule of Fractions: Whatever you multiply the bottom by to reach the common denominator, you MUST also multiply the top by! If 2 × 2 = 4, then 1 × 2 = 2, so 1/2 becomes 2/4.",
      explanationTe: "భిన్నాల సువర్ణ సూత్రం: హారాన్ని దేనితో గుణిస్తారో, లవాన్ని కూడా అదే సంఖ్యతో గుణించాలి! 2 × 2 = 4 అయితే, 1 × 2 = 2 అవుతుంది, అంటే 1/2 = 2/4.",
      remedy: "Always multiply both numerator and denominator by the same scaling factor."
    },
    MULTIPLIED_INSTEAD: {
      id: "MULTIPLIED_INSTEAD",
      name: "Multiplied fractions instead of adding",
      nameTe: "కూడికకు బదులుగా గుణకారం చేయడం",
      description: "Student multiplied numerators and denominators (e.g. 1/2 * 1/4 = 1/8).",
      explanation: "Watch the operator sign! We are combining amounts (+), not finding a fraction of a fraction (×).",
      explanationTe: "గుర్తును జాగ్రత్తగా చూడండి! మనం పరిమాణాలను కలుపుతున్నాము (+), గుణించడం లేదు.",
      remedy: "Check operation symbol: addition means combining parts."
    },
    UNCLASSIFIED_ERROR: {
      id: "UNCLASSIFIED_ERROR",
      name: "Unclassified arithmetic or calculation error",
      nameTe: "సాధారణ లెక్కింపు పొరపాటు",
      description: "The student's answer does not match a documented systematic misconception.",
      explanation: "Let's review this step-by-step. Break the problem down: find the common denominator, convert both fractions, and then add.",
      explanationTe: "మరోసారి దశలవారీగా చూద్దాం: కాసాగు (LCM) కనుగొని, సమాన భిన్నాలుగా మార్చి కూడండి.",
      remedy: "Follow the 3-step fraction addition framework."
    }
  },

  // PRE-TEST QUESTIONS (Baseline Diagnostic before instruction)
  PRE_TEST_QUESTIONS: [
    {
      id: "PRE_1",
      concept: "equivalent_fractions",
      prompt: "What is an equivalent fraction for 1/2 with a denominator of 6?",
      promptTe: "హారం 6 గా ఉండేలా 1/2 కు సమానమైన భిన్నం ఏది?",
      context: "Ramu Kaka's Fruit Stall",
      options: [
        { key: "a", text: "2/6", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "b", text: "3/6", isCorrect: true },
        { key: "c", text: "1/6", misconception: "UNCLASSIFIED_ERROR" },
        { key: "d", text: "4/6", misconception: "UNCLASSIFIED_ERROR" }
      ],
      correct: "b",
      explanation: "Multiply numerator and denominator by 3: (1 × 3) / (2 × 3) = 3/6."
    },
    {
      id: "PRE_2",
      concept: "unlike_addition_same_family",
      prompt: "Calculate: 1/2 + 1/4 = ?",
      promptTe: "లెక్కించండి: 1/2 + 1/4 = ?",
      context: "Indian Bazaar Vegetable Basket",
      options: [
        { key: "a", text: "2/6", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "2/4", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "c", text: "3/4", isCorrect: true },
        { key: "d", text: "1/8", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "c",
      explanation: "Common denominator is 4. 1/2 = 2/4. Then 2/4 + 1/4 = 3/4."
    },
    {
      id: "PRE_3",
      concept: "unlike_addition_same_family",
      prompt: "Calculate: 1/3 + 1/6 = ?",
      promptTe: "లెక్కించండి: 1/3 + 1/6 = ?",
      context: "Sweet Stall Lassi Glasses",
      options: [
        { key: "a", text: "2/9", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "3/6 (or 1/2)", isCorrect: true },
        { key: "c", text: "2/6", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "d", text: "1/18", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "Common denominator is 6. 1/3 = 2/6. 2/6 + 1/6 = 3/6 = 1/2."
    },
    {
      id: "PRE_4",
      concept: "unlike_addition_coprime",
      prompt: "Calculate: 1/3 + 1/2 = ?",
      promptTe: "లెక్కించండి: 1/3 + 1/2 = ?",
      context: "Spice Market (Haldi & Jeera)",
      options: [
        { key: "a", text: "2/5", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "5/6", isCorrect: true },
        { key: "c", text: "2/6", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "d", text: "1/6", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "LCM of 3 and 2 is 6. 1/3 = 2/6, 1/2 = 3/6. 2/6 + 3/6 = 5/6."
    },
    {
      id: "PRE_5",
      concept: "marketplace_word_problems",
      prompt: "Priya bought 1/2 kg of potatoes and 1/4 kg of tomatoes from the bazaar. What is the total weight in kg?",
      promptTe: "ప్రియా బజారులో 1/2 కేజీ బంగాళాదుంపలు, 1/4 కేజీ టమాటాలు కొన్నది. మొత్తం బరువు ఎంత?",
      context: "Weekly Mandi Shopping Bag",
      options: [
        { key: "a", text: "2/6 kg", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "3/4 kg", isCorrect: true },
        { key: "c", text: "2/4 kg", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "d", text: "1/4 kg", misconception: "UNCLASSIFIED_ERROR" }
      ],
      correct: "b",
      explanation: "Convert 1/2 kg into 2/4 kg. Total weight = 2/4 + 1/4 = 3/4 kg."
    }
  ],

  // MISSION 1: Understand Fractions (Visual strips, Equivalents & LCM)
  MISSION_1_QUESTIONS: [
    {
      id: "M1_Q1",
      concept: "equivalent_fractions",
      difficulty: 1,
      title: "Market Bar Scale: Equivalent Fractions",
      prompt: "Look at the fraction strips below: 1/2 of a melon is equal to how many fourths (1/4)?",
      promptTe: "కింది భిన్నాల పట్టీలను చూడండి: 1/2 పుచ్చకాయ ఎన్ని నాల్గవ భాగాలకు (1/4) సమానం?",
      visual: {
        strip1: { total: 2, filled: 1, label: "1/2" },
        strip2: { total: 4, filled: 2, label: "? / 4" }
      },
      options: [
        { key: "a", text: "1/4", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "b", text: "2/4", isCorrect: true },
        { key: "c", text: "3/4", misconception: "UNCLASSIFIED_ERROR" },
        { key: "d", text: "4/4", misconception: "UNCLASSIFIED_ERROR" }
      ],
      correct: "b",
      explanation: "Cutting the half into 2 equal pieces gives exactly 2 out of 4 pieces! So 1/2 = 2/4.",
      hint: "Look at the two strips aligned above. One green block of 1/2 exactly covers two blue blocks of 1/4.",
      followUp: "M1_Q1_PRACTICE"
    },
    {
      id: "M1_Q1_PRACTICE",
      concept: "equivalent_fractions",
      difficulty: 1,
      isPractice: true,
      title: "Fresh Practice: Making Equivalent Slices",
      prompt: "Anand cuts a ribbon of length 1/3 meter. How many sixths (1/6) is that equal to?",
      promptTe: "ఆనంద్ 1/3 మీటర్ల రిబ్బన్ కత్తిరించాడు. అది ఎన్ని 1/6 భాగాలకు సమానం?",
      visual: {
        strip1: { total: 3, filled: 1, label: "1/3" },
        strip2: { total: 6, filled: 2, label: "? / 6" }
      },
      options: [
        { key: "a", text: "1/6", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "b", text: "2/6", isCorrect: true },
        { key: "c", text: "3/6", misconception: "UNCLASSIFIED_ERROR" },
        { key: "d", text: "4/6", misconception: "UNCLASSIFIED_ERROR" }
      ],
      correct: "b",
      explanation: "Multiply top and bottom by 2: (1 × 2) / (3 × 2) = 2/6."
    },
    {
      id: "M1_Q2",
      concept: "finding_lcm",
      difficulty: 1,
      title: "Finding the Common Size (LCM)",
      prompt: "To add 1/4 and 1/6, what is the smallest common denominator (LCM of 4 and 6)?",
      promptTe: "1/4 మరియు 1/6 లను కలపడానికి, అతి చిన్న ఉమ్మడి హారం (4 మరియు 6 ల కాసాగు) ఏది?",
      options: [
        { key: "a", text: "10 (sum of 4+6)", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "12 (LCM of 4 and 6)", isCorrect: true },
        { key: "c", text: "24 (product of 4×6)", misconception: "UNCLASSIFIED_ERROR" },
        { key: "d", text: "6", misconception: "ADD_NUM_KEEP_DENOM" }
      ],
      correct: "b",
      explanation: "Multiples of 4: 4, 8, 12, 16... Multiples of 6: 6, 12, 18... The smallest shared multiple is 12!",
      hint: "List the multiples of both denominators: 4, 8, 12... and 6, 12... Which number appears first in both lists?",
      followUp: "M1_Q2_PRACTICE"
    },
    {
      id: "M1_Q2_PRACTICE",
      concept: "finding_lcm",
      difficulty: 1,
      isPractice: true,
      title: "Fresh Practice: Common Denominator",
      prompt: "What is the lowest common denominator (LCM) for 2 and 5?",
      promptTe: "2 మరియు 5 లకు అతి చిన్న ఉమ్మడి హారం (కాసాగు) ఏది?",
      options: [
        { key: "a", text: "7 (2+5)", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "10", isCorrect: true },
        { key: "c", text: "5", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "d", text: "20", misconception: "UNCLASSIFIED_ERROR" }
      ],
      correct: "b",
      explanation: "2 and 5 are prime numbers; their LCM is 2 × 5 = 10."
    }
  ],

  // MISSION 2: Become a Fraction Expert (Unlike Denominators Addition + Misconceptions)
  MISSION_2_QUESTIONS: [
    {
      id: "M2_Q1",
      concept: "unlike_addition_same_family",
      difficulty: 2,
      title: "Level 1 Addition: Doubling Family",
      prompt: "Add the fractions: 1/2 + 1/4 = ?",
      promptTe: "భిన్నాలను కూడండి: 1/2 + 1/4 = ?",
      context: "Raju's Fruit Cart",
      visual: {
        step1: "1/2 = 2/4 (scaled by 2)",
        step2: "2/4 + 1/4 = (2+1)/4 = 3/4"
      },
      options: [
        { key: "a", text: "2/6", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "2/4", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "c", text: "3/4", isCorrect: true },
        { key: "d", text: "1/8", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "c",
      explanation: "Step 1: Common denominator is 4. Convert 1/2 to 2/4. Step 2: Add numerators: 2 + 1 = 3. Result: 3/4.",
      hint: "Never add the denominators! Convert 1/2 into fourths: 1/2 is equal to 2/4. Now add 2/4 + 1/4.",
      followUp: "M2_Q1_PRACTICE"
    },
    {
      id: "M2_Q1_PRACTICE",
      concept: "unlike_addition_same_family",
      difficulty: 2,
      isPractice: true,
      title: "Independent Verification Question",
      prompt: "Add the fractions: 1/4 + 3/8 = ?",
      promptTe: "భిన్నాలను కూడండి: 1/4 + 3/8 = ?",
      context: "Measuring Spice Packets",
      options: [
        { key: "a", text: "4/12", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "5/8", isCorrect: true },
        { key: "c", text: "4/8", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "d", text: "3/32", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "Convert 1/4 to 2/8 (multiply top and bottom by 2). Then 2/8 + 3/8 = 5/8."
    },
    {
      id: "M2_Q2",
      concept: "unlike_addition_same_family",
      difficulty: 2,
      title: "Level 2 Addition: Tripling Family",
      prompt: "Add the fractions: 2/3 + 1/6 = ?",
      promptTe: "భిన్నాలను కూడండి: 2/3 + 1/6 = ?",
      context: "Sweet Milk Mixing",
      options: [
        { key: "a", text: "3/9", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "5/6", isCorrect: true },
        { key: "c", text: "3/6", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "d", text: "2/18", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "Common denominator is 6. Convert 2/3: (2 × 2)/(3 × 2) = 4/6. Now 4/6 + 1/6 = 5/6.",
      hint: "Convert 2/3 so its denominator is 6. Multiply both 2 and 3 by 2 to get 4/6. Now add 4/6 + 1/6.",
      followUp: "M2_Q2_PRACTICE"
    },
    {
      id: "M2_Q2_PRACTICE",
      concept: "unlike_addition_same_family",
      difficulty: 2,
      isPractice: true,
      title: "Independent Verification Question",
      prompt: "Add the fractions: 1/5 + 3/10 = ?",
      promptTe: "భిన్నాలను కూడండి: 1/5 + 3/10 = ?",
      options: [
        { key: "a", text: "4/15", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "5/10 (or 1/2)", isCorrect: true },
        { key: "c", text: "4/10", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "d", text: "3/50", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "Convert 1/5 to 2/10. Then 2/10 + 3/10 = 5/10 (which simplifies to 1/2)."
    },
    {
      id: "M2_Q3",
      concept: "unlike_addition_coprime",
      difficulty: 3,
      title: "Level 3 Addition: Coprime Denominators",
      prompt: "Add the fractions: 1/3 + 1/4 = ?",
      promptTe: "భిన్నాలను కూడండి: 1/3 + 1/4 = ?",
      context: "Indian Bazaar Gold & Silver Weighing",
      options: [
        { key: "a", text: "2/7", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "7/12", isCorrect: true },
        { key: "c", text: "2/12", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "d", text: "1/12", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "LCM of 3 and 4 is 12. 1/3 = 4/12, and 1/4 = 3/12. 4/12 + 3/12 = 7/12.",
      hint: "Both denominators must change! The LCM of 3 and 4 is 12. Convert 1/3 into ?/12 and 1/4 into ?/12, then add.",
      followUp: "M2_Q3_PRACTICE"
    },
    {
      id: "M2_Q3_PRACTICE",
      concept: "unlike_addition_coprime",
      difficulty: 3,
      isPractice: true,
      title: "Independent Verification Question",
      prompt: "Add the fractions: 2/5 + 1/2 = ?",
      promptTe: "భిన్నాలను కూడండి: 2/5 + 1/2 = ?",
      options: [
        { key: "a", text: "3/7", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "9/10", isCorrect: true },
        { key: "c", text: "3/10", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "d", text: "2/10", misconception: "UNCLASSIFIED_ERROR" }
      ],
      correct: "b",
      explanation: "LCM of 5 and 2 is 10. 2/5 = 4/10, and 1/2 = 5/10. 4/10 + 5/10 = 9/10."
    }
  ],

  // MISSION 3: Smart Bazaar Challenge (Transfer of Learning to Marketplace Context)
  MISSION_3_QUESTIONS: [
    {
      id: "M3_Q1",
      concept: "marketplace_word_problems",
      difficulty: 2,
      title: "Sabzi Mandi: Vegetable Basket",
      prompt: "Farmer Suresh places 1/2 kg of green chillies and 3/8 kg of ginger into your shopping bag. What is the total weight in kg?",
      promptTe: "రైతు సురేష్ మీ సంచిలో 1/2 కేజీ పచ్చిమిర్చి, 3/8 కేజీ అల్లం వేశారు. మొత్తం బరువు ఎంత కేజీలు?",
      context: "Weekly Vegetable Mandi",
      options: [
        { key: "a", text: "4/10 kg", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "7/8 kg", isCorrect: true },
        { key: "c", text: "4/8 kg", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "d", text: "3/16 kg", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "1/2 kg = 4/8 kg. Total weight = 4/8 + 3/8 = 7/8 kg.",
      hint: "Convert 1/2 into eighths (4/8). Then add 4/8 and 3/8."
    },
    {
      id: "M3_Q2",
      concept: "marketplace_word_problems",
      difficulty: 3,
      title: "Sweet Stall: Making Gulab Jamun Syrup",
      prompt: "Halwai Ramu mixes 2/3 cup of rose water with 1/4 cup of saffron syrup for his sweets. How much total liquid does he have?",
      promptTe: "హల్వాయి రాము మిఠాయిల కోసం 2/3 కప్పు రోజ్ వాటర్, 1/4 కప్పు కుంకుమపువ్వు సిరప్ కలిపారు. మొత్తం ద్రవం ఎంత?",
      context: "Mithai Shop Kitchen",
      options: [
        { key: "a", text: "3/7 cup", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "11/12 cup", isCorrect: true },
        { key: "c", text: "3/12 cup", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "d", text: "2/12 cup", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "LCM of 3 and 4 is 12. 2/3 = 8/12, and 1/4 = 3/12. Total = 8/12 + 3/12 = 11/12 cup.",
      hint: "Find common denominator 12. 2/3 is equal to 8/12. 1/4 is equal to 3/12. Now add 8 + 3."
    },
    {
      id: "M3_Q3",
      concept: "marketplace_word_problems",
      difficulty: 3,
      title: "Grain Merchant: Basmati Rice Sack",
      prompt: "A customer buys 3/10 sack of sona masoori rice in the morning and 2/5 sack in the afternoon. What fraction of a sack was sold in total?",
      promptTe: "ఒక వ్యాపారి ఉదయం 3/10 బస్తా బియ్యం, మధ్యాహ్నం 2/5 బస్తా బియ్యం విక్రయించారు. మొత్తం అమ్మిన భాగం ఎంత?",
      context: "Grain Wholesaler",
      options: [
        { key: "a", text: "5/15 sack", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "7/10 sack", isCorrect: true },
        { key: "c", text: "5/10 sack", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "d", text: "6/50 sack", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "Convert 2/5 into tenths: (2 × 2)/(5 × 2) = 4/10. Total sold = 3/10 + 4/10 = 7/10 sack.",
      hint: "Convert 2/5 to tenths by multiplying top and bottom by 2 (giving 4/10). Then add 3/10 + 4/10."
    }
  ],

  // POST-TEST QUESTIONS (Parallel questions with different values measuring learning outcome)
  POST_TEST_QUESTIONS: [
    {
      id: "POST_1",
      concept: "equivalent_fractions",
      prompt: "What is an equivalent fraction for 1/3 with a denominator of 12?",
      promptTe: "హారం 12 గా ఉండేలా 1/3 కు సమానమైన భిన్నం ఏది?",
      context: "Ramu Kaka's Fruit Stall",
      options: [
        { key: "a", text: "2/12", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "b", text: "4/12", isCorrect: true },
        { key: "c", text: "1/12", misconception: "UNCLASSIFIED_ERROR" },
        { key: "d", text: "3/12", misconception: "UNCLASSIFIED_ERROR" }
      ],
      correct: "b",
      explanation: "Multiply numerator and denominator by 4: (1 × 4) / (3 × 4) = 4/12."
    },
    {
      id: "POST_2",
      concept: "unlike_addition_same_family",
      prompt: "Calculate: 1/4 + 1/2 = ?",
      promptTe: "లెక్కించండి: 1/4 + 1/2 = ?",
      context: "Fruit Market Shopping",
      options: [
        { key: "a", text: "2/6", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "2/4", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "c", text: "3/4", isCorrect: true },
        { key: "d", text: "1/8", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "c",
      explanation: "1/2 = 2/4. Then 1/4 + 2/4 = 3/4."
    },
    {
      id: "POST_3",
      concept: "unlike_addition_same_family",
      prompt: "Calculate: 1/6 + 2/3 = ?",
      promptTe: "లెక్కించండి: 1/6 + 2/3 = ?",
      context: "Spice Weighing",
      options: [
        { key: "a", text: "3/9", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "5/6", isCorrect: true },
        { key: "c", text: "3/6", misconception: "FORGOT_TO_SCALE_NUM" },
        { key: "d", text: "2/18", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "Common denominator is 6. 2/3 = 4/6. Then 1/6 + 4/6 = 5/6."
    },
    {
      id: "POST_4",
      concept: "unlike_addition_coprime",
      prompt: "Calculate: 1/4 + 1/3 = ?",
      promptTe: "లెక్కించండి: 1/4 + 1/3 = ?",
      context: "Sweet Stall Lassi Mixing",
      options: [
        { key: "a", text: "2/7", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "7/12", isCorrect: true },
        { key: "c", text: "2/12", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "d", text: "1/12", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "LCM of 4 and 3 is 12. 1/4 = 3/12, 1/3 = 4/12. 3/12 + 4/12 = 7/12."
    },
    {
      id: "POST_5",
      concept: "marketplace_word_problems",
      prompt: "Meera bought 3/8 kg of almonds and 1/2 kg of cashews from the dry fruit store. What is the total weight in kg?",
      promptTe: "మీరా డ్రై ఫ్రూట్స్ దుకాణంలో 3/8 కేజీ బాదం, 1/2 కేజీ జీడిపప్పు కొన్నది. మొత్తం బరువు ఎంత?",
      context: "Old City Dry Fruit Store",
      options: [
        { key: "a", text: "4/10 kg", misconception: "ADD_NUM_AND_DENOM" },
        { key: "b", text: "7/8 kg", isCorrect: true },
        { key: "c", text: "4/8 kg", misconception: "ADD_NUM_KEEP_DENOM" },
        { key: "d", text: "3/16 kg", misconception: "MULTIPLIED_INSTEAD" }
      ],
      correct: "b",
      explanation: "1/2 kg = 4/8 kg. Total weight = 3/8 + 4/8 = 7/8 kg."
    }
  ],

  // Diagnostic / Evaluation Method
  evaluateAnswer(question, selectedKey) {
    const isCorrect = (selectedKey === question.correct);
    const selectedOption = question.options.find(o => o.key === selectedKey);
    const misconceptionKey = isCorrect ? null : (selectedOption ? selectedOption.misconception : "UNCLASSIFIED_ERROR");
    const misconceptionDef = misconceptionKey ? (this.MISCONCEPTIONS[misconceptionKey] || this.MISCONCEPTIONS.UNCLASSIFIED_ERROR) : null;

    // Track in storage if StorageService is loaded
    if (typeof StorageService !== 'undefined') {
      StorageService.updateConceptMastery(question.concept, isCorrect);
      if (!isCorrect && misconceptionKey) {
        StorageService.recordMisconception(misconceptionKey, question.id, selectedKey);
      }
    }

    return {
      isCorrect,
      selectedKey,
      correctKey: question.correct,
      misconception: misconceptionDef,
      explanation: question.explanation,
      hint: question.hint || (misconceptionDef ? misconceptionDef.explanation : null),
      followUpId: question.followUp || null,
      concept: question.concept,
      difficulty: question.difficulty || 1
    };
  },

  // Calculate Learning Improvement between Pre and Post tests
  calculateLearningGain(preScore, postScore, total = 5) {
    const prePct = Math.round((preScore / total) * 100);
    const postPct = Math.round((postScore / total) * 100);
    const gainPoints = postPct - prePct;
    
    // Normalized Learning Gain (Hake's gain): g = (post% - pre%) / (100% - pre%)
    let normalizedGain = 0;
    if (prePct < 100) {
      normalizedGain = Math.round(((postPct - prePct) / (100 - prePct)) * 100) / 100;
    }

    return {
      prePct,
      postPct,
      gainPoints,
      normalizedGain,
      hasImproved: gainPoints > 0
    };
  }
};

// Export to window
if (typeof window !== 'undefined') {
  window.FractionEngine = FractionEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FractionEngine;
}
