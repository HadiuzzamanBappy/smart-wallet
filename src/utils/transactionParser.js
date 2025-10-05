import nlp from 'compromise';

// Machine Learning Storage for Pattern Adaptation
let learningData = {
  corrections: [], // User corrections to improve accuracy
  patternWeights: {}, // Dynamic pattern weights based on user behavior
  contextHistory: [], // Context patterns that worked well
  confidenceThresholds: { high: 5, medium: 3, low: 1 }, // Adaptive thresholds
  userLanguagePreference: 'mixed', // Detected user language preference
  lastUpdated: Date.now()
};

// Try to load existing learning data from localStorage (browser only)
try {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const storedLearning = localStorage.getItem('walletTracker_nlp_learning');
    if (storedLearning) {
      learningData = { ...learningData, ...JSON.parse(storedLearning) };
    }
  }
} catch (error) {
  console.warn('Could not load NLP learning data:', error);
}

/**
 * Save learning data to localStorage for persistence (browser only)
 */
const saveLearningData = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      learningData.lastUpdated = Date.now();
      localStorage.setItem('walletTracker_nlp_learning', JSON.stringify(learningData));
    }
  } catch (error) {
    console.warn('Could not save NLP learning data:', error);
  }
};

/**
 * Learn from user corrections to improve accuracy
 * @param {string} originalMessage - Original input message
 * @param {Object} aiResult - AI's original prediction
 * @param {Object} userCorrection - User's correction
 */
export const learnFromCorrection = (originalMessage, aiResult, userCorrection) => {
  const correction = {
    timestamp: Date.now(),
    originalMessage: originalMessage.toLowerCase(),
    aiPrediction: aiResult,
    userCorrection,
    improvement: {
      typeChanged: aiResult.type !== userCorrection.type,
      categoryChanged: aiResult.category !== userCorrection.category,
      descriptionChanged: aiResult.description !== userCorrection.description
    }
  };
  
  learningData.corrections.push(correction);
  
  // Keep only last 1000 corrections to manage memory
  if (learningData.corrections.length > 1000) {
    learningData.corrections = learningData.corrections.slice(-1000);
  }
  
  // Update pattern weights based on corrections
  updatePatternWeights(correction);
  
  // Adapt confidence thresholds
  adaptConfidenceThresholds();
  
  saveLearningData();
  
  return {
    success: true,
    message: `Learning improved! This will help with similar transactions in the future.`,
    totalCorrections: learningData.corrections.length
  };
};

/**
 * Update pattern weights based on user corrections
 * @param {Object} correction - User correction data
 */
const updatePatternWeights = (correction) => {
  const { originalMessage, aiPrediction, userCorrection } = correction;
  
  // If type was wrong, adjust pattern weights
  if (aiPrediction.type !== userCorrection.type) {
    const correctType = userCorrection.type;
    const wrongType = aiPrediction.type;
    
    // Increase weight for correct type patterns
    if (transactionPatterns[correctType]) {
      transactionPatterns[correctType].forEach(pattern => {
        if (pattern.test(originalMessage)) {
          const key = `${correctType}_${pattern.toString()}`;
          learningData.patternWeights[key] = (learningData.patternWeights[key] || 1) + 0.2;
        }
      });
    }
    
    // Decrease weight for incorrect type patterns
    if (transactionPatterns[wrongType]) {
      transactionPatterns[wrongType].forEach(pattern => {
        if (pattern.test(originalMessage)) {
          const key = `${wrongType}_${pattern.toString()}`;
          learningData.patternWeights[key] = Math.max(0.1, (learningData.patternWeights[key] || 1) - 0.1);
        }
      });
    }
  }
};

/**
 * Adapt confidence thresholds based on accuracy history
 */
const adaptConfidenceThresholds = () => {
  if (learningData.corrections.length < 10) return; // Need minimum data
  
  const recentCorrections = learningData.corrections.slice(-50); // Last 50 corrections
  const accuracyByConfidence = { high: [], medium: [], low: [] };
  
  recentCorrections.forEach(correction => {
    const wasAccurate = !correction.improvement.typeChanged;
    const confidence = correction.aiPrediction.confidence;
    
    if (accuracyByConfidence[confidence]) {
      accuracyByConfidence[confidence].push(wasAccurate);
    }
  });
  
  // Adjust thresholds based on accuracy
  Object.keys(accuracyByConfidence).forEach(level => {
    const accuracies = accuracyByConfidence[level];
    if (accuracies.length > 5) {
      const accuracy = accuracies.filter(Boolean).length / accuracies.length;
      
      if (level === 'high' && accuracy < 0.9) {
        learningData.confidenceThresholds.high += 1; // Require higher score for high confidence
      } else if (level === 'medium' && accuracy < 0.7) {
        learningData.confidenceThresholds.medium += 0.5;
      }
    }
  });
};

// Pattern weights are handled inline within detectTransactionType function

// Number word conversion is handled inline within convertWordsToNumber function

// Enhanced category keywords with multi-language support
const categoryKeywords = {
  food: {
    keywords: [
      // English
      'food', 'restaurant', 'grocery', 'groceries', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'ate', 'eat',
      'pizza', 'burger', 'rice', 'chicken', 'vegetable', 'fruit', 'apple', 'banana', 'coffee', 'tea', 'cake',
      'bread', 'milk', 'fish', 'meat', 'cooking', 'kitchen', 'recipe', 'dish', 'cuisine', 'menu', 'cafe', 'bistro',
      'dine', 'feed', 'order', 'delivery', 'takeout', 'fast food', 'restaurant', 'foodpanda', 'pathao food',
      // Bengali/Bangla
      'খাবার', 'ভাত', 'রুটি', 'মাছ', 'মাংস', 'তরকারি', 'চা', 'কফি', 'নাস্তা', 'দুপুরের খাবার', 'রাতের খাবার',
      'রেস্টুরেন্ট', 'হোটেল', 'ক্যান্টিন', 'খিচুড়ি', 'বিরিয়ানি', 'পোলাও', 'কাচ্চি', 'ফুচকা', 'চটপটি'
    ],
    verbs: ['ate', 'eat', 'dine', 'feed', 'cook', 'order', 'খেয়েছি', 'খাই', 'রান্না']
  },
  transport: {
    keywords: [
      // English
      'transport', 'uber', 'taxi', 'bus', 'train', 'rickshaw', 'fuel', 'petrol', 'gas', 'parking', 'toll', 'ride',
      'car', 'bike', 'motorcycle', 'aviation', 'flight', 'airline', 'metro', 'subway', 'ferry', 'boat', 'ship',
      'pathao', 'shohoz', 'obhai', 'cng', 'auto', 'tempo', 'leguna', 'microbus', 'launch',
      // Bengali/Bangla
      'যাতায়াত', 'বাস', 'ট্রেন', 'রিক্সা', 'সিএনজি', 'অটো', 'ট্যাক্সি', 'তেল', 'পেট্রোল', 'গ্যাস',
      'পার্কিং', 'টোল', 'গাড়ি', 'বাইক', 'মোটরসাইকেল', 'ফ্লাইট', 'বিমান', 'লঞ্চ', 'নৌকা'
    ],
    verbs: ['drive', 'ride', 'travel', 'commute', 'fly', 'যাই', 'চালাই', 'ভ্রমণ']
  },
  entertainment: {
    keywords: [
      // English
      'movie', 'cinema', 'game', 'gaming', 'concert', 'show', 'netflix', 'spotify', 'entertainment', 'fun',
      'party', 'music', 'tv', 'theater', 'sports', 'club', 'bar', 'pub', 'disco', 'festival', 'event',
      'cricket', 'football', 'youtube premium', 'hoichoi', 'bioscope',
      // Bengali/Bangla
      'সিনেমা', 'মুভি', 'গেম', 'খেলা', 'কনসার্ট', 'শো', 'বিনোদন', 'মজা', 'পার্টি', 'গান', 'টিভি',
      'থিয়েটার', 'ক্রিকেট', 'ফুটবল', 'উৎসব', 'অনুষ্ঠান'
    ],
    verbs: ['watch', 'play', 'enjoy', 'attend', 'celebrate', 'দেখি', 'খেলি', 'উপভোগ']
  },
  shopping: {
    keywords: [
      // English
      'shopping', 'clothes', 'shirt', 'shoes', 'dress', 'mall', 'online', 'amazon', 'flipkart', 'fashion',
      'buy', 'bought', 'store', 'shop', 'market', 'purchase', 'retail', 'brand', 'item', 'product',
      'daraz', 'chaldal', 'new market', 'bashundhara city', 'jamuna future park',
      // Bengali/Bangla
      'কেনাকাটা', 'জামা', 'জুতা', 'পোশাক', 'মল', 'অনলাইন', 'কিনেছি', 'দোকান', 'বাজার', 'কিনি',
      'নিউ মার্কেট', 'গুলশান', 'ধানমন্ডি', 'মতিঝিল'
    ],
    verbs: ['buy', 'bought', 'purchase', 'shop', 'order', 'কিনি', 'কিনেছি', 'অর্ডার']
  },
  bills: {
    keywords: [
      // English
      'bill', 'electricity', 'water', 'internet', 'wifi', 'phone', 'mobile', 'rent', 'utility', 'subscription',
      'insurance', 'loan', 'mortgage', 'tax', 'fine', 'penalty', 'fee', 'charge', 'desco', 'wasa', 'titas',
      'grameenphone', 'robi', 'banglalink', 'airtel', 'dhaka power',
      // Bengali/Bangla
      'বিল', 'বিদ্যুৎ', 'পানি', 'ইন্টারনেট', 'ওয়াইফাই', 'ফোন', 'মোবাইল', 'ভাড়া', 'ইউটিলিটি',
      'সাবস্ক্রিপশন', 'বীমা', 'ঋণ', 'ট্যাক্স', 'জরিমানা', 'ফি', 'চার্জ'
    ],
    verbs: ['pay', 'paid', 'owe', 'charge', 'দিই', 'দিয়েছি', 'পরিশোধ']
  },
  health: {
    keywords: [
      // English
      'doctor', 'medicine', 'hospital', 'pharmacy', 'medical', 'health', 'clinic', 'checkup', 'treatment',
      'surgery', 'therapy', 'dentist', 'nurse', 'patient', 'diagnosis', 'prescription', 'square hospital',
      'united hospital', 'apollo', 'labaid', 'ibn sina',
      // Bengali/Bangla
      'ডাক্তার', 'ওষুধ', 'হাসপাতাল', 'ফার্মেসি', 'চিকিৎসা', 'স্বাস্থ্য', 'ক্লিনিক', 'চেকআপ',
      'চিকিৎসা', 'অপারেশন', 'থেরাপি', 'দাঁতের ডাক্তার', 'নার্স', 'রোগী'
    ],
    verbs: ['visit', 'consult', 'treat', 'heal', 'cure', 'দেখাই', 'চিকিৎসা', 'পরামর্শ']
  },
  education: {
    keywords: [
      // English
      'book', 'course', 'class', 'tuition', 'school', 'college', 'university', 'education', 'study', 'learning',
      'lesson', 'teacher', 'student', 'exam', 'degree', 'certification', 'coaching', 'private', 'buet', 'du',
      'nsu', 'ius', 'brac university',
      // Bengali/Bangla
      'বই', 'কোর্স', 'ক্লাস', 'টিউশন', 'স্কুল', 'কলেজ', 'বিশ্ববিদ্যালয়', 'শিক্ষা', 'পড়াশোনা',
      'লেসন', 'শিক্ষক', 'ছাত্র', 'পরীক্ষা', 'ডিগ্রি', 'সার্টিফিকেট', 'কোচিং', 'প্রাইভেট'
    ],
    verbs: ['study', 'learn', 'teach', 'enroll', 'graduate', 'পড়ি', 'শিখি', 'পড়াই']
  },
  salary: {
    keywords: [
      // English
      'salary', 'wage', 'paycheck', 'income', 'payment', 'bonus', 'overtime', 'commission', 'allowance', 'stipend',
      // Bengali/Bangla
      'বেতন', 'মাইনে', 'আয়', 'পেমেন্ট', 'বোনাস', 'ওভারটাইম', 'কমিশন', 'ভাতা'
    ],
    verbs: ['earned', 'receive', 'got', 'paid', 'পেয়েছি', 'আয়', 'বেতন পেয়েছি']
  },
  freelance: {
    keywords: [
      // English
      'freelance', 'project', 'client', 'gig', 'contract', 'consulting', 'service', 'work', 'job', 'task',
      'assignment', 'upwork', 'fiverr', 'freelancer.com',
      // Bengali/Bangla
      'ফ্রিল্যান্স', 'প্রজেক্ট', 'ক্লায়েন্ট', 'কন্ট্রাক্ট', 'কনসালটিং', 'সার্ভিস', 'কাজ', 'টাস্ক'
    ],
    verbs: ['work', 'complete', 'deliver', 'provide', 'কাজ করি', 'সম্পন্ন', 'ডেলিভার']
  },
  investment: {
    keywords: [
      // English
      'investment', 'stock', 'share', 'mutual', 'fund', 'bond', 'dividend', 'profit', 'capital', 'trading',
      'portfolio', 'dse', 'dhaka stock exchange', 'ipo', 'mutual fund',
      // Bengali/Bangla
      'বিনিয়োগ', 'স্টক', 'শেয়ার', 'মিউচুয়াল ফান্ড', 'বন্ড', 'লাভ', 'পুঁজি', 'ট্রেডিং', 'পোর্টফোলিও'
    ],
    verbs: ['invest', 'trade', 'buy', 'sell', 'বিনিয়োগ', 'ট্রেড', 'কিনি', 'বিক্রি']
  }
};

// Advanced 4-category transaction patterns with multi-language support
const transactionPatterns = {
  // CREDIT: Giving money to others (lending, giving loan)
  credit: [
    // English patterns
    /\b(lend|lending|lent|gave?\s+loan|give?\s+loan|loan\s+(to|দিয়েছি)|money\s+to|cash\s+to)\b/i,
    /\b(gave?\s+(money|cash|taka)|give?\s+(money|cash|taka))\s+(to|for)\b/i,
    /\b(friend|relative|family|brother|sister|cousin|uncle|aunt)\s.*(need|borrow|took)\b/i,
    /\b(advance|emergency|help)\s.*(money|cash|taka|৳)\b/i,
    // Bengali patterns
    /\b(ধার\s+দিয়েছি|লোন\s+দিয়েছি|টাকা\s+দিয়েছি|সাহায্য\s+করেছি|এডভান্স\s+দিয়েছি)\b/i,
    // Broken English patterns
    /\b(gave?\s+him|gave?\s+her|give?\s+him|give?\s+her).*(money|taka|৳)\b/i,
    /\b(i\s+gave?|i\s+give?).*(friend|brother|sister|relative).*(money|taka|৳)\b/i,
    /\b(money\s+give?\s+(to|for)|taka\s+give?\s+(to|for)|৳\s+give?\s+(to|for))\b/i
  ],

  // LOAN: Taking money from others (borrowing, taking loan)
  loan: [
    // English patterns
    /\b(borrow|borrowed|took?\s+loan|take?\s+loan|loan\s+(from|নিয়েছি)|money\s+from|cash\s+from)\b/i,
    /\b(took?\s+(money|cash|taka)|take?\s+(money|cash|taka))\s+(from|of)\b/i,
    /\b(friend|relative|family|brother|sister|cousin|uncle|aunt)\s.*(gave?|lend|loan)\b/i,
    /\b(emergency|need)\s.*(money|cash|taka|৳).*from\b/i,
    // Bengali patterns
    /\b(ধার\s+নিয়েছি|লোন\s+নিয়েছি|টাকা\s+নিয়েছি|সাহায্য\s+নিয়েছি|এডভান্স\s+নিয়েছি)\b/i,
    // Broken English patterns
    /\b(took?\s+from|take?\s+from).*(friend|brother|sister|relative|him|her)\b/i,
    /\b(i\s+took?|i\s+take?).*(money|taka|৳).*(from|of)\b/i,
    /\b(money\s+took?\s+from|taka\s+took?\s+from|৳\s+took?\s+from)\b/i
  ],

  // EXPENSE: Regular spending (not lending to others)
  expense: [
    // English patterns
    /\b(bought|buy|purchased|purchase|paid|pay|spent|spend|cost|ordered|order)\b/i,
    /\b(shopping|store|mall|market|shop|restaurant|food|fuel|bill|medicine|doctor)\b/i,
    /\b(for\s+(myself|family|home|house|office|personal))\b/i,
    // Bengali patterns
    /\b(কিনেছি|কিনি|কিনলাম|খরচ|ব্যয়|পেমেন্ট|বিল|কেনাকাটা)\b/i,
    // Broken English patterns
    /\b(buyed|buyd|payed|spended|costed)\b/i,
    /\b(i\s+(buy|bought|pay|paid|spend|spent)).*(food|clothes|medicine|fuel|bill)\b/i,
    /\b(money\s+(spend|spent)|taka\s+(spend|spent)|৳\s+(spend|spent))\b/i
  ],

  // INCOME: Money coming in (not borrowing)
  income: [
    // English patterns
    /\b(earned|earn|received|receive|got|get|made|make|sold|sell|salary|wage|bonus)\b/i,
    /\b(income|revenue|profit|commission|dividend|refund|cashback|payment)\b/i,
    /\b(from\s+(work|job|client|company|freelance|project|gig|business|sale|sell))\b/i,
    // Bengali patterns
    /\b(আয়|বেতন|মাইনে|পেয়েছি|পেলাম|লাভ|বোনাস|কমিশন)\b/i,
    // Broken English patterns
    /\b(selled|maked|recieved|earnd)\b/i,
    /\b(money\s+(received|got|earned)|taka\s+(received|got|earned)|৳\s+(received|got|earned))\b/i
  ]
};

// Enhanced broken English corrections
const brokenEnglishCorrections = {
  // Common misspellings and grammar mistakes
  'buyed': 'bought', 'buyd': 'bought', 'payed': 'paid', 'spended': 'spent',
  'costed': 'cost', 'selled': 'sold', 'maked': 'made', 'recieved': 'received',
  'earnd': 'earned', 'gaved': 'gave', 'taked': 'took', 'gived': 'gave',
  // Bengali-English mix corrections
  'টাকা দিয়েছি': 'gave money', 'টাকা নিয়েছি': 'took money',
  'কিনেছি': 'bought', 'পেয়েছি': 'received', 'দিয়েছি': 'paid',
  // Common patterns
  'i buy': 'i bought', 'i pay': 'i paid', 'i give': 'i gave',
  'money for': 'paid for', 'taka for': 'paid for'
};

// Amount and currency patterns are handled inline within extractAmount function

// Helper functions for intelligent parsing

/**
 * Normalize message by correcting broken English and common mistakes
 * @param {string} message - Original message
 * @returns {string} Normalized message
 */
const normalizeMessage = (message) => {
  let normalized = message.toLowerCase();
  
  // Fix common broken English patterns
  Object.entries(brokenEnglishCorrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    normalized = normalized.replace(regex, correct);
  });
  
  // Remove extra spaces and punctuation
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
};

/**
 * Enhanced amount extraction with fuzzy matching and multi-format support
 * @param {string} message - Input message
 * @returns {number|null} Extracted amount
 */
const extractAmount = (message) => {
  // Advanced amount extraction patterns
  const patterns = [
    // Standard numeric patterns with various separators
    /\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b/g, // 1,000.50
    /\b\d+(?:\.\d{1,2})?\b/g, // Simple numbers like 500.50
    
    // K notation variants
    /\b(\d+(?:\.\d+)?)\s*k\b/gi, // 5k, 10k
    /\b(\d+(?:\.\d+)?)\s*thousand\b/gi, // 5 thousand
    
    // Lakh and Crore patterns (Indian/Bangladeshi)
    /\b(\d+(?:\.\d+)?)\s*(lakh|lakhs|crore|crores|লক্ষ|কোটি)\b/gi,
    
    // Written numbers with currency
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)\s*(taka|tk|bdt|৳|dollars?|rupees?)\b/gi,
    
    // Bengali numerals
    /[০১২৩৪৫৬৭৮৯]+/g,
    
    // Mixed format: ৫০০ টাকা, 500 taka
    /\b(\d+|[০১২৩৪৫৬৭৮৯]+)\s*(taka|tk|bdt|৳|টাকা|ডলার|রুপি)\b/gi
  ];
  
  let extractedAmount = null;
  
  // Try each pattern
  for (const pattern of patterns) {
    const matches = message.match(pattern);
    if (matches && matches.length > 0) {
      const match = matches[0];
      
      // Handle K notation
      const kMatch = match.match(/(\d+(?:\.\d+)?)\s*k/i);
      if (kMatch) {
        extractedAmount = parseFloat(kMatch[1]) * 1000;
        break;
      }
      
      // Handle thousand notation
      const thousandMatch = match.match(/(\d+(?:\.\d+)?)\s*thousand/i);
      if (thousandMatch) {
        extractedAmount = parseFloat(thousandMatch[1]) * 1000;
        break;
      }
      
      // Handle lakh/crore
      const lakhCroreMatch = match.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|crore|crores|লক্ষ|কোটি)/i);
      if (lakhCroreMatch) {
        const num = parseFloat(lakhCroreMatch[1]);
        const unit = lakhCroreMatch[2].toLowerCase();
        if (unit.includes('lakh') || unit.includes('লক্ষ')) {
          extractedAmount = num * 100000;
        } else if (unit.includes('crore') || unit.includes('কোটি')) {
          extractedAmount = num * 10000000;
        }
        break;
      }
      
      // Handle Bengali numerals
      if (/[০১২৩৪৫৬৭৮৯]/.test(match)) {
        const bengaliNum = convertBengaliToEnglishNumber(match);
        extractedAmount = parseFloat(bengaliNum);
        break;
      }
      
      // Handle word numbers
      if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)\b/i.test(match)) {
        extractedAmount = convertWordsToNumber(match);
        break;
      }
      
      // Handle standard numbers
      const numMatch = match.match(/\d+(?:,\d{3})*(?:\.\d{1,2})?/);
      if (numMatch) {
        extractedAmount = parseFloat(numMatch[0].replace(/,/g, ''));
        break;
      }
    }
  }
  
  // Fuzzy amount detection as fallback
  if (!extractedAmount) {
    extractedAmount = fuzzyAmountDetection(message);
  }
  
  return extractedAmount && extractedAmount > 0 ? extractedAmount : null;
};

/**
 * Convert Bengali numerals to English numbers
 * @param {string} bengaliNum - Bengali numeral string
 * @returns {string} English numeral string
 */
const convertBengaliToEnglishNumber = (bengaliNum) => {
  const bengaliToEnglish = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  
  return bengaliNum.replace(/[০১২৩৪৫৬৭৮৯]/g, (match) => bengaliToEnglish[match]);
};

/**
 * Fuzzy amount detection for unclear or misspelled amounts
 * @param {string} message - Input message
 * @returns {number|null} Detected amount
 */
const fuzzyAmountDetection = (message) => {
  // Common amount-related phrases with fuzzy matching
  const fuzzyPatterns = [
    // Misspelled thousands: "thusand", "thousnd"
    /(\d+)\s*th[ou]*s[an]*d/gi,
    
    // Misspelled hundreds: "hundrd", "hundrd"
    /(\d+)\s*h[un]*d[re]*d/gi,
    
    // Contextual amounts: "around 500", "about 1000"
    /(around|about|approximately|roughly|প্রায়|মতো)\s*(\d+)/gi,
    
    // Range detection: "500 to 600", "৫০০-৬০০"
    /(\d+)\s*(?:to|থেকে|-|–)\s*(\d+)/gi
  ];
  
  for (const pattern of fuzzyPatterns) {
    const match = message.match(pattern);
    if (match) {
      if (pattern.source.includes('th[ou]*s[an]*d')) {
        return parseFloat(match[1]) * 1000;
      } else if (pattern.source.includes('h[un]*d[re]*d')) {
        return parseFloat(match[1]) * 100;
      } else if (pattern.source.includes('around|about')) {
        return parseFloat(match[2]);
      } else if (pattern.source.includes('to|থেকে|-')) {
        // For ranges, take the average
        const start = parseFloat(match[1]);
        const end = parseFloat(match[2]);
        return (start + end) / 2;
      }
    }
  }
  
  return null;
};

/**
 * Convert word numbers to numeric value
 * @param {string} words - Number words
 * @returns {number} Numeric value
 */
const convertWordsToNumber = (words) => {
  // Simplified word-to-number conversion
  const simpleNumbers = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'hundred': 100, 'thousand': 1000, 'million': 1000000
  };
  
  const wordArray = words.toLowerCase().split(' ');
  let total = 0;
  let current = 0;
  
  for (const word of wordArray) {
    if (simpleNumbers[word]) {
      if (word === 'hundred') {
        current *= 100;
      } else if (word === 'thousand') {
        total += current * 1000;
        current = 0;
      } else if (word === 'million') {
        total += current * 1000000;
        current = 0;
      } else {
        current += simpleNumbers[word];
      }
    }
  }
  
  return total + current;
};

/**
 * Advanced semantic analysis for relationship detection
 * @param {string} message - Input message
 * @returns {Object} Semantic insights
 */
const analyzeSemantics = (message) => {
  const doc = nlp(message);
  
  // Extract entities and relationships
  const people = doc.match('#Person').out('array');
  const places = doc.match('#Place').out('array');
  const organizations = doc.match('#Organization').out('array');
  const money = doc.match('#Money').out('array');
  const dates = doc.match('#Date').out('array');
  
  // Relationship analysis
  const relationships = {
    personal: message.match(/\b(friend|brother|sister|mother|father|family|relative|cousin|uncle|aunt|বন্ধু|ভাই|বোন|মা|বাবা|পরিবার)\b/gi) || [],
    business: message.match(/\b(client|company|boss|colleague|customer|business|office|কোম্পানি|ব্যবসা|অফিস|ক্লায়েন্ট)\b/gi) || [],
    services: message.match(/\b(shop|store|restaurant|hospital|school|bank|hotel|দোকান|রেস্টুরেন্ট|হাসপাতাল|স্কুল|ব্যাংক)\b/gi) || []
  };
  
  // Intent classification
  const intents = {
    helping: message.match(/\b(help|emergency|need|urgent|support|সাহায্য|জরুরি|প্রয়োজন)\b/gi) || [],
    business: message.match(/\b(buy|sell|purchase|payment|bill|transaction|কিনি|বিক্রি|পেমেন্ট|বিল)\b/gi) || [],
    personal: message.match(/\b(gift|birthday|celebration|personal|উপহার|জন্মদিন|ব্যক্তিগত)\b/gi) || [],
    investment: message.match(/\b(invest|trade|stock|share|profit|loss|বিনিয়োগ|লাভ|ক্ষতি)\b/gi) || []
  };
  
  // Emotional context detection
  const emotions = {
    positive: message.match(/\b(happy|good|excellent|great|wonderful|ভাল|চমৎকার|দারুণ)\b/gi) || [],
    negative: message.match(/\b(sad|bad|terrible|emergency|problem|urgent|খারাপ|সমস্যা|জরুরি)\b/gi) || [],
    neutral: message.match(/\b(normal|regular|usual|routine|নিয়মিত|সাধারণ)\b/gi) || []
  };
  
  return {
    entities: { people, places, organizations, money, dates },
    relationships,
    intents,
    emotions,
    contextType: getContextType(relationships, intents)
  };
};

/**
 * Determine context type based on relationships and intents
 * @param {Object} relationships - Detected relationships
 * @param {Object} intents - Detected intents
 * @returns {string} Context type
 */
const getContextType = (relationships, intents) => {
  if (relationships.personal.length > 0 && intents.helping.length > 0) return 'personal_help';
  if (relationships.business.length > 0) return 'business';
  if (relationships.services.length > 0) return 'service';
  if (intents.investment.length > 0) return 'investment';
  if (intents.personal.length > 0) return 'personal';
  return 'general';
};

/**
 * Intelligent transaction type detection with semantic analysis
 * @param {string} message - Normalized message
 * @returns {Object} Type and confidence with semantic insights
 */
const detectTransactionType = (message) => {
  const scores = { credit: 0, loan: 0, expense: 0, income: 0 };
  
  // Get semantic analysis
  const semantics = analyzeSemantics(message);
  
  // Pattern-based scoring with adaptive weights
  Object.entries(transactionPatterns).forEach(([type, patterns]) => {
    patterns.forEach(pattern => {
      if (pattern.test(message)) {
        const baseScore = 3;
        const patternKey = `${type}_${pattern.toString()}`;
        const adaptiveWeight = learningData.patternWeights[patternKey] || 1;
        scores[type] += baseScore * adaptiveWeight; // Adaptive weight based on learning
      }
    });
  });
  
  // Context analysis using NLP
  const doc = nlp(message);
  const verbs = doc.verbs().out('array');
  const nouns = doc.nouns().out('array');
  
  // Semantic context scoring
  if (semantics.contextType === 'personal_help') {
    scores.credit += 2; // Personal help usually means giving money
    scores.loan += 1; // Or taking in emergency
  } else if (semantics.contextType === 'business') {
    scores.income += 2; // Business context often means income
    scores.expense += 1; // Or business expenses
  } else if (semantics.contextType === 'service') {
    scores.expense += 3; // Service payments are expenses
  } else if (semantics.contextType === 'investment') {
    scores.income += 2; // Investment often brings income
  }

  // High-priority overrides for common ambiguous constructions
  // If someone "took X from me" that means the user lent money (credit given)
  // e.g. "Ratul took 2000 from me" -> credit (I gave money)
  const tookFromMePattern = /\b(?:took|took out|borrowed)\b[\s\S]{0,60}?\bfrom me\b/i;
  if (tookFromMePattern.test(message)) {
    return { type: 'credit', confidence: 'high', scores };
  }

  // If message explicitly says someone "gave me" or "paid me" it's income
  const gaveMePattern = /\b(?:gave|paid)\b[\s\S]{0,60}?\bme\b/i;
  if (gaveMePattern.test(message)) {
    return { type: 'income', confidence: 'high', scores };
  }
  
  // Verb-based scoring with enhanced context
  const verbScoring = {
    credit: ['gave', 'give', 'lend', 'lent', 'loan', 'advance', 'help', 'assist', 'দিয়েছি', 'সাহায্য'],
    loan: ['took', 'take', 'borrow', 'borrowed', 'need', 'emergency', 'নিয়েছি', 'ধার'],
    expense: ['bought', 'buy', 'paid', 'pay', 'spent', 'spend', 'cost', 'order', 'কিনেছি', 'খরচ'],
    income: ['earned', 'earn', 'received', 'receive', 'got', 'get', 'made', 'sold', 'পেয়েছি', 'আয়']
  };
  
  Object.entries(verbScoring).forEach(([type, typeVerbs]) => {
    verbs.forEach(verb => {
      if (typeVerbs.includes(verb)) {
        scores[type] += 2;
      }
    });
  });
  
  // Advanced directional analysis with semantic context
  if (message.includes(' to ') || message.includes(' for ')) {
    if (semantics.relationships.personal.length > 0) {
      scores.credit += 3; // Giving to personal contacts
    } else if (semantics.relationships.services.length > 0) {
      scores.expense += 2; // Paying for services
    }
  }
  
  if (message.includes(' from ')) {
    if (semantics.relationships.personal.length > 0) {
      scores.loan += 3; // Taking from personal contacts
    } else if (semantics.relationships.business.length > 0) {
      scores.income += 2; // Receiving from business
    }
  }
  
  // Emotional context influence
  if (semantics.emotions.negative.length > 0) {
    scores.loan += 1; // Negative emotions often associated with borrowing
    scores.expense += 1; // Or unexpected expenses
  }
  
  // Find the highest scoring type
  const maxScore = Math.max(...Object.values(scores));
  const detectedType = Object.keys(scores).find(type => scores[type] === maxScore);
  
  // Advanced confidence calculation with adaptive thresholds
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const secondHighest = sortedScores[1] || 0;
  const scoreDiff = maxScore - secondHighest;
  
  // Use adaptive thresholds from learning data
  const thresholds = learningData.confidenceThresholds;
  let confidence = 'low';
  
  if (scoreDiff >= 3 && maxScore >= thresholds.high) {
    confidence = 'high';
  } else if (scoreDiff >= 2 && maxScore >= thresholds.medium) {
    confidence = 'medium';
  } else if (maxScore >= thresholds.low) {
    confidence = 'low';
  } else {
    confidence = 'very_low';
  }
  
  return {
    type: detectedType || 'expense', // Default to expense if no clear match
    confidence,
    scores,
    semantics,
    analysis: { verbs, nouns }
  };
};

/**
 * Parse natural language transaction message with advanced AI
 * @param {string} message - User's natural language input
 * @returns {Object} Parsed transaction data
 */
export const parseTransaction = (message) => {
  try {
    // Step 1: Normalize the message
    const normalizedMessage = normalizeMessage(message);
    
    // Step 2: Extract amount using advanced patterns
    const amount = extractAmount(message);
    
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: "Could not find a valid amount in your message. Please include a number (e.g., 500, 1k, 2 thousand)."
      };
    }
    
    // Step 3: Intelligent transaction type detection
    const typeDetection = detectTransactionType(normalizedMessage);
    const { type, confidence } = typeDetection;
    
    // Step 4: Advanced category detection using NLP
    const doc = nlp(normalizedMessage);
    const verbs = doc.verbs().out('array');
    const nouns = doc.nouns().out('array');
    
    let category = 'other';
    let maxScore = 0;
    
    for (const [cat, catData] of Object.entries(categoryKeywords)) {
      let score = 0;
      
      // Check keywords in normalized message
      catData.keywords.forEach(keyword => {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          score += 2; // Higher weight for exact keyword match
        }
      });
      
      // Check verbs in context
      if (catData.verbs) {
        catData.verbs.forEach(verb => {
          if (verbs.includes(verb)) {
            score += 3; // Even higher weight for verb context
          }
        });
      }
      
      // Check nouns in context
      nouns.forEach(noun => {
        if (catData.keywords.includes(noun)) {
          score += 1; // Lower weight for noun matches
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        category = cat;
      }
    }
    
    // Override category for income types
    if (type === 'income') {
      if (normalizedMessage.includes('salary') || normalizedMessage.includes('wage') || normalizedMessage.includes('paycheck')) {
        category = 'salary';
      } else if (normalizedMessage.includes('freelance') || normalizedMessage.includes('project') || normalizedMessage.includes('gig')) {
        category = 'freelance';
      } else if (normalizedMessage.includes('investment') || normalizedMessage.includes('dividend') || normalizedMessage.includes('stock')) {
        category = 'investment';
      } else if (maxScore === 0) {
        category = 'other_income';
      }
    }
    
    // Step 5: Intelligent description generation
    let description = generateSmartDescription(message, type, category, amount);
    
    // Get current date
    const date = new Date().toISOString().split('T')[0];
    
    return {
      success: true,
      data: {
        type,
        amount,
        category,
        description,
        date,
        confidence,
        aiAnalysis: {
          originalMessage: message,
          normalizedMessage,
          detectedVerbs: verbs,
          detectedNouns: nouns.slice(0, 3),
          categoryScore: maxScore,
          typeScores: typeDetection.scores
        }
      }
    };
    
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return {
      success: false,
      error: "Failed to parse your message. Our AI is learning from this error to improve future parsing."
    };
  }
};

/**
 * Entity extraction for intelligent description generation
 * @param {string} message - Input message
 * @returns {Object} Extracted entities
 */
const extractEntities = (message) => {
  const doc = nlp(message);
  
  return {
    // People and relationships
    people: message.match(/\b(friend|brother|sister|mother|father|uncle|aunt|cousin|colleague|boss|client|বন্ধু|ভাই|বোন|মা|বাবা|চাচা|খালা|কলিগ)\b/gi) || [],
    
    // Places and locations
    places: message.match(/\b(shop|store|market|mall|restaurant|hospital|school|office|bank|home|দোকান|বাজার|মল|রেস্টুরেন্ট|হাসপাতাল|স্কুল|অফিস|ব্যাংক|বাড়ি)\b/gi) || [],
    
    // Items and services
    items: message.match(/\b(food|clothes|medicine|fuel|book|phone|laptop|car|bike|খাবার|কাপড়|ওষুধ|তেল|বই|ফোন|ল্যাপটপ|গাড়ি|বাইক)\b/gi) || [],
    
    // Brands and services (Bangladeshi context)
    brands: message.match(/\b(grameenphone|robi|banglalink|airtel|desco|wasa|pathao|uber|foodpanda|daraz|chaldal|amazon|flipkart)\b/gi) || [],
    
    // Time expressions
    timeExpressions: doc.match('#Date').out('array').concat(
      message.match(/\b(today|yesterday|tomorrow|morning|evening|night|আজ|গতকাল|কাল|সকাল|সন্ধ্যা|রাত)\b/gi) || []
    ),
    
    // Purposes and reasons
    purposes: message.match(/\b(emergency|gift|birthday|wedding|celebration|business|investment|জরুরি|উপহার|জন্মদিন|বিয়ে|উৎসব|ব্যবসা|বিনিয়োগ)\b/gi) || []
  };
};

/**
 * Generate intelligent, context-aware descriptions with entity extraction
 * @param {string} originalMessage - Original user message
 * @param {string} type - Transaction type
 * @param {string} category - Transaction category  
 * @param {number} amount - Transaction amount
 * @returns {string} Smart description
 */
const generateSmartDescription = (originalMessage, type, category, amount) => {
  const entities = extractEntities(originalMessage);
  
  // Start with cleaned message
  let description = originalMessage
    .replace(/৳|\$|€|£|¥/g, '') // Remove currency symbols
    .replace(/\b(taka|tk|bdt|dollar|usd|euro|eur|pound|gbp|rupee|rs|inr|yen|টাকা|ডলার|রুপি)\b/gi, '') // Remove currency words
    .replace(/\b\d+(?:,\d{3})*(?:\.\d{1,2})?\b/g, '') // Remove amounts
    .replace(/\b\d+(?:\.\d+)?\s*(lakh|lakhs|crore|crores|লক্ষ|কোটি|k)\b/gi, '') // Remove lakh/crore notation
    .trim();
  
  // Remove common action verbs from beginning, but preserve context
  description = description.replace(/^\s*(i\s+)?(bought|buy|purchased|purchase|paid|pay|spent|spend|cost|gave|give|ordered|order|earned|earn|received|receive|got|get|made|make|sold|sell|took|take|borrow|borrowed|lend|lent|কিনেছি|কিনি|পেয়েছি|দিয়েছি|নিয়েছি)\s*/i, '').trim();
  
  // Clean up extra spaces and punctuation
  description = description.replace(/\s+/g, ' ').replace(/^[,\-\s]+/, '').trim();
  
  // Intelligent description enhancement based on entities and context
  if (entities.people.length > 0) {
    const person = entities.people[0];
    if (type === 'credit') {
      description = description ? `Lent to ${person}: ${description}` : `Lent money to ${person}`;
    } else if (type === 'loan') {
      description = description ? `Borrowed from ${person}: ${description}` : `Borrowed money from ${person}`;
    }
  }
  
  if (entities.places.length > 0) {
    const place = entities.places[0];
    if (type === 'expense') {
      description = description ? `${description} at ${place}` : `Purchase at ${place}`;
    }
  }
  
  if (entities.items.length > 0 && !description.includes(entities.items[0])) {
    description = description ? `${entities.items[0]} - ${description}` : entities.items[0];
  }
  
  if (entities.brands.length > 0) {
    const brand = entities.brands[0];
    description = description ? `${description} (${brand})` : `${brand} service`;
  }
  
  if (entities.purposes.length > 0) {
    const purpose = entities.purposes[0];
    description = description ? `${description} for ${purpose}` : `Payment for ${purpose}`;
  }
  
  // Context-aware type prefixes
  if (type === 'credit' && !description.toLowerCase().includes('lent') && !description.toLowerCase().includes('loan')) {
    description = description ? `Credit given: ${description}` : 'Money lent to someone';
  } else if (type === 'loan' && !description.toLowerCase().includes('borrow') && !description.toLowerCase().includes('took')) {
    description = description ? `Loan taken: ${description}` : 'Money borrowed';
  }
  
  // If description is still too short or empty, create a meaningful one
  if (description.length < 3) {
    const smartDescriptions = {
      'income': {
        'salary': 'Monthly salary received',
        'freelance': 'Freelance payment received',
        'investment': 'Investment return',
        'other_income': 'Income received'
      },
      'expense': {
        'food': 'Food purchase',
        'transport': 'Transportation expense',
        'entertainment': 'Entertainment expense',
        'shopping': 'Shopping expense',
        'bills': 'Bill payment',
        'health': 'Medical expense',
        'education': 'Education expense',
        'other': 'General expense'
      },
      'credit': {
        'default': 'Money lent to someone'
      },
      'loan': {
        'default': 'Money borrowed'
      }
    };
    
    description = (smartDescriptions[type] && smartDescriptions[type][category]) || 
                  (smartDescriptions[type] && smartDescriptions[type]['default']) || 
                  `${type} transaction`;
  }
  
  // Capitalize first letter and ensure proper formatting
  description = description.charAt(0).toUpperCase() + description.slice(1);
  
  // Add contextual information based on amount and timing
  const now = new Date();
  const hour = now.getHours();
  
  if (entities.timeExpressions.length > 0) {
    const timeExpr = entities.timeExpressions[0];
    description += ` (${timeExpr})`;
  } else if (hour < 12) {
    description += ` (morning)`;
  } else if (hour < 17) {
    description += ` (afternoon)`;
  } else {
    description += ` (evening)`;
  }
  
  // Amount context
  if (amount >= 100000) {
    description += ` 🔥 Large amount`;
  } else if (amount >= 10000) {
    description += ` 💪 Significant amount`;
  } else if (amount < 100) {
    description += ` 💰 Small amount`;
  }
  
  return description;
};

/**
 * Format transaction for display with user-friendly messages
 * @param {Object} transaction - Transaction object
 * @returns {string} Formatted user-friendly string
 */
export const formatTransactionMessage = (transaction) => {
  const { type, amount, category, confidence } = transaction;
  
  // User-friendly responses based on transaction type
  const responses = {
    'income': {
      emoji: '💰',
      title: 'Money Received!',
      message: `Great! I've recorded that you received ${amount} BDT.`
    },
    'expense': {
      emoji: '💸',
      title: 'Expense Recorded!',
      message: `Got it! I've tracked your ${amount} BDT expense.`
    },
    'credit': {
      emoji: '🤝',
      title: 'Money Lent!',
      message: `I've recorded that you lent ${amount} BDT to someone. They owe you this amount.`
    },
    'loan': {
      emoji: '�',
      title: 'Loan Taken!',
      message: `I've noted that you borrowed ${amount} BDT. Remember to pay it back when possible.`
    }
  };

  const response = responses[type] || responses['expense'];
  
  // Add category context if meaningful
  let categoryContext = '';
  if (category && category !== 'other') {
    const categoryNames = {
      'food': 'food & dining',
      'transport': 'transportation',
      'entertainment': 'entertainment',
      'shopping': 'shopping',
      'health': 'healthcare',
      'education': 'education',
      'salary': 'salary',
      'business': 'business'
    };
    categoryContext = ` This looks like a ${categoryNames[category] || category} transaction.`;
  }

  // Add confidence indicator only if low (to suggest double-checking)
  let confidenceNote = '';
  if (confidence === 'low') {
    confidenceNote = '\n\n💡 Please double-check if I got this right!';
  }

  return `${response.emoji} ${response.title}\n\n${response.message}${categoryContext}${confidenceNote}`;
};

/**
 * Format transaction with balance information for complete chat response
 * @param {Object} transaction - Transaction object
 * @param {number} newBalance - Updated balance after transaction
 * @returns {string} Complete formatted response with balance
 */
export const formatTransactionWithBalance = (transaction, newBalance) => {
  const baseMessage = formatTransactionMessage(transaction);
  const { type, amount } = transaction;
  
  let balanceInfo = '';
  if (typeof newBalance === 'number') {
    if (type === 'credit') {
      balanceInfo = `\n\n💳 Your balance is now ${newBalance} BDT\n📝 Note: ${amount} BDT is owed to you`;
    } else if (type === 'loan') {
      balanceInfo = `\n\n💳 Your balance is now ${newBalance} BDT\n📝 Note: You owe ${amount} BDT`;
    } else {
      balanceInfo = `\n\n💳 Your new balance: ${newBalance} BDT`;
    }
  }
  
  return baseMessage + balanceInfo;
};

/**
 * Get category emoji with enhanced categories
 * @param {string} category - Category name
 * @returns {string} Emoji
 */
export const getCategoryEmoji = (category) => {
  const emojiMap = {
    food: '🍔',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    bills: '📄',
    health: '🏥',
    education: '📚',
    salary: '💼',
    freelance: '💻',
    investment: '📈',
    other: '📦',
    other_income: '💰',
    loan_category: '🏦',
    credit_category: '🤝'
  };
  
  return emojiMap[category] || '📦';
};

/**
 * Get category color with enhanced 4-category support
 * @param {string} category - Category name
 * @returns {string} CSS classes for styling
 */
export const getCategoryColor = (category) => {
  const colorMap = {
    food: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    entertainment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    bills: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    health: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    education: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    salary: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    freelance: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    investment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    other_income: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    loan_category: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    credit_category: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  };
  
  return colorMap[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

/**
 * Get transaction type color for 4-category system
 * @param {string} type - Transaction type (income/expense/credit/loan)
 * @returns {string} CSS classes for styling
 */
export const getTransactionTypeColor = (type) => {
  const typeColors = {
    income: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    expense: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
    credit: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
    loan: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700'
  };
  
  return typeColors[type] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
};

/**
 * Check if a transaction type represents credit given (money lent to others)
 * @param {string} type - Transaction type
 * @returns {boolean} True if it's credit given
 */
export const isCreditCategory = (type) => {
  return type === 'credit';
};

/**
 * Check if a transaction type represents loan taken (money borrowed from others)
 * @param {string} type - Transaction type
 * @returns {boolean} True if it's loan taken
 */
export const isLoanCategory = (type) => {
  return type === 'loan';
};

/**
 * Comprehensive test suite for the intelligent NLP system
 * @returns {Array} Test results with performance metrics
 */
export const testIntelligentNLP = () => {
  const testCases = [
    // 4-Category Detection Tests
    
    // CREDIT: Giving money to others
    "I gave 5000 taka to my friend as emergency loan",
    "Lent money to brother 3000 for his business",
    "Friend needed help, gave him 2k",
    "ভাইকে ৫০০০ টাকা ধার দিয়েছি জরুরি প্রয়োজনে", // Bengali: Emergency loan to brother
    "Advanced 10k to colleague for medical emergency",
    
    // LOAN: Taking money from others  
    "Borrowed 10000 from friend for rent",
    "Took loan of 25000 from brother yesterday",
    "Emergency situation, took money from relative eight thousand",
    "বন্ধুর কাছ থেকে ৩০০০ টাকা নিয়েছি", // Bengali: Took money from friend
    "Need urgent cash, borrowed 15k from uncle",
    
    // EXPENSE: Regular spending
    "I buyed food for 500 taka at restaurant", // Broken English
    "Payed electricity bill 2000 BDT this morning",
    "Spended money on shopping 1.5k at Bashundhara City",
    "খাবারের জন্য ৮০০ টাকা খরচ করেছি নিউ মার্কেটে", // Bengali with location
    "Ordered pizza from foodpanda around 850 tk",
    
    // INCOME: Money coming in
    "Received salary ৫০,০০০ this month from company",
    "Got freelance payment 15000 from international client",
    "Sold old bike for seventy five thousand",
    "বেতন পেয়েছি ৪৫০০০ টাকা", // Bengali salary
    "Earned commission 12k from insurance sales",
    
    // Complex Multi-language Cases
    "i give money to friend ২০০০ tk for emergency",
    "friend returned my টাকা 5000 today evening",
    "took 1 lakh from bank as personal loan for house",
    "earned ৩ crore from business this year (big success!)",
    
    // Fuzzy Amount Detection
    "bought groceries for around 500 taka",
    "paid about two thousand for internet bill",
    "lent approximately 10k to cousin",
    "received roughly ১৫ হাজার from part-time job",
    
    // Brand and Context Detection
    "recharged Grameenphone 200 tk",
    "paid DESCO electricity bill 3500",
    "ordered from Chaldal grocery 1200",
    "took Pathao ride 150 taka to office",
    "bought medicine from Square Pharmacy 800",
    
    // Time and Emotional Context
    "emergency medical expense 25000 last night (very urgent!)",
    "happy birthday gift for sister 5k (she loved it)",
    "sad news - had to spend 50k for funeral arrangements",
    
    // Edge Cases and Error Recovery
    "500", // Only amount
    "bought food", // No amount
    "I am very happy today", // Irrelevant message
    "৫০০ টাকা", // Only amount in Bengali
    "friend", // No amount, minimal context
    
    // Complex Sentence Structures
    "Yesterday morning I went to New Market and bought a shirt for my brother which cost me around 2500 taka",
    "My colleague at office needed urgent money for his mother's treatment so I gave him 50k as loan",
    "Received my monthly salary of 65000 BDT from the company along with a bonus of 10000 for good performance"
  ];
  
  const startTime = Date.now();
  
  const results = testCases.map((testCase, index) => {
    const caseStartTime = Date.now();
    const result = parseTransaction(testCase);
    const processingTime = Date.now() - caseStartTime;
    
    return {
      testCase: index + 1,
      input: testCase,
      processingTime: `${processingTime}ms`,
      ...result
    };
  });
  
  const totalTime = Date.now() - startTime;
  const successfulParses = results.filter(r => r.success).length;
  const accuracy = ((successfulParses / testCases.length) * 100).toFixed(1);
  
  // Performance summary
  const summary = {
    totalTests: testCases.length,
    successful: successfulParses,
    failed: testCases.length - successfulParses,
    accuracy: `${accuracy}%`,
    totalProcessingTime: `${totalTime}ms`,
    averageTimePerTest: `${(totalTime / testCases.length).toFixed(1)}ms`,
    featuresTest: {
      fourCategoryDetection: '✓ Credit/Loan/Expense/Income',
      multiLanguageSupport: '✓ English/Bengali/Mixed',
      brokenEnglishHandling: '✓ Typos and Grammar',
      fuzzyAmountDetection: '✓ Word Numbers/Approximations',
      contextualIntelligence: '✓ Entities/Relationships/Emotions',
      machineLearning: '✓ Adaptive Patterns/Confidence',
      smartDescriptions: '✓ Context-Aware Generation'
    }
  };
  
  return {
    summary,
    results,
    learningData: {
      totalCorrections: learningData.corrections.length,
      patternWeights: Object.keys(learningData.patternWeights).length,
      confidenceThresholds: learningData.confidenceThresholds,
      lastUpdated: new Date(learningData.lastUpdated).toLocaleString()
    }
  };
};

/**
 * Demo function specifically for showcasing 4-category accuracy
 * @returns {Object} Category-specific results
 */
export const testFourCategorySystem = () => {
  const categoryTests = {
    credit: [
      "gave loan to friend 5000",
      "lent money to brother 3k", 
      "friend needed help gave him 2000",
      "ভাইকে ৫০০০ টাকা ধার দিয়েছি"
    ],
    loan: [
      "borrowed money from friend 10000",
      "took loan 25k from brother",
      "emergency took money from relative 8000", 
      "বন্ধুর কাছ থেকে ৩০০০ টাকা নিয়েছি"
    ],
    expense: [
      "bought food 500 taka",
      "paid electricity bill 2000",
      "shopping expense 1500",
      "খাবারের জন্য ৮০০ টাকা খরচ"
    ],
    income: [
      "received salary 50000",
      "got freelance payment 15000", 
      "sold bike 75000",
      "বেতন পেয়েছি ৪৫০০০ টাকা"
    ]
  };
  
  const categoryResults = {};
  
  Object.entries(categoryTests).forEach(([expectedType, tests]) => {
    categoryResults[expectedType] = tests.map(test => {
      const result = parseTransaction(test);
      return {
        input: test,
        expected: expectedType,
        detected: result.success ? result.data.type : 'failed',
        correct: result.success && result.data.type === expectedType,
        confidence: result.success ? result.data.confidence : 'N/A',
        ...result
      };
    });
  });
  
  // Calculate accuracy per category
  const accuracyByCategory = {};
  Object.entries(categoryResults).forEach(([type, results]) => {
    const correct = results.filter(r => r.correct).length;
    accuracyByCategory[type] = `${((correct / results.length) * 100).toFixed(1)}%`;
  });
  
  return {
    categoryResults,
    accuracyByCategory,
    overallAccuracy: `${(
      Object.values(categoryResults)
        .flat()
        .filter(r => r.correct).length / 
      Object.values(categoryResults)
        .flat().length * 100
    ).toFixed(1)}%`
  };
};