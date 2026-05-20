/**
 * Utility containing string similarity algorithms for financial reconciliation.
 * Implements: Levenshtein, Jaro-Winkler, N-Gram Cosine, and Normalized Fusion.
 */

/**
 * Calculates the Levenshtein Distance between two strings.
 * Represents the minimum number of single-character edits needed to change one word into another.
 */
const levenshteinDistance = (str1, str2) => {
  const s1 = (str1 || '').toLowerCase().trim();
  const s2 = (str2 || '').toLowerCase().trim();
  
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j - 1][i] + 1, // deletion
        track[j][i - 1] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[s2.length][s1.length];
};

/**
 * Calculates Jaro-Winkler string similarity (value between 0 and 1).
 */
const jaroWinklerDistance = (s1, s2) => {
  let m = 0;
  s1 = (s1 || '').toLowerCase().trim();
  s2 = (s2 || '').toLowerCase().trim();

  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1 === s2) return 1;

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - range);
    const end = Math.min(i + range + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }

  if (m === 0) return 0;

  // Transpositions count
  let k = 0;
  let t = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }
  t = t / 2;

  const jaro = (m / s1.length + m / s2.length + (m - t) / m) / 3;

  // Winkler enhancement (common prefix adjustment)
  let l = 0; // Prefix length up to max 4 common characters
  const p = 0.1; // Scaling factor
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) {
      l++;
    } else {
      break;
    }
  }

  return jaro + l * p * (1 - jaro);
};

/**
 * Computes the N-Gram set of a string (Defaults to Bi-grams).
 */
const getNGrams = (str, n = 2) => {
  const grams = [];
  const text = `_${(str || '').toLowerCase().trim()}_`; // Pad with boundary symbols
  for (let i = 0; i < text.length - n + 1; i++) {
    grams.push(text.substring(i, i + n));
  }
  return grams;
};

/**
 * Computes Cosine Similarity between N-Grams of two strings.
 * Ideal for partial, multi-word matching (e.g. "Amazon Pay India" <-> "Amazon Pay").
 */
const cosineSimilarityNGrams = (str1, str2, n = 2) => {
  const g1 = getNGrams(str1, n);
  const g2 = getNGrams(str2, n);
  
  const allGrams = Array.from(new Set([...g1, ...g2]));
  
  const vec1 = allGrams.map(gram => g1.filter(g => g === gram).length);
  const vec2 = allGrams.map(gram => g2.filter(g => g === gram).length);
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < allGrams.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Combines Jaro-Winkler, Levenshtein Ratio, and Bi-Gram Cosine Similarity
 * into a single normalized confidence score (0 to 100).
 */
const calculateIntelligentScore = (description1, description2) => {
  const s1 = (description1 || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const s2 = (description2 || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  // 1. Jaro-Winkler Score (excellent for typos / prefixes)
  const jw = jaroWinklerDistance(s1, s2);
  
  // 2. Cosine Bi-gram Score (excellent for partial/scrambled multi-words like "INDIA GPAY" vs "GPAY")
  const cos = cosineSimilarityNGrams(s1, s2, 2);
  
  // 3. Levenshtein ratio
  const maxLen = Math.max(s1.length, s2.length);
  const levDist = levenshteinDistance(s1, s2);
  const levRatio = maxLen > 0 ? (maxLen - levDist) / maxLen : 0;

  // Fusion scoring using weighted average
  // Weights: JaroWinkler=40%, CosineNgram=40%, LevenshteinRatio=20%
  const fusedScore = (jw * 0.40) + (cos * 0.40) + (levRatio * 0.20);
  const finalPercent = Math.round(fusedScore * 100);

  return Math.min(100, Math.max(0, finalPercent));
};

module.exports = {
  levenshteinDistance,
  jaroWinklerDistance,
  cosineSimilarityNGrams,
  calculateIntelligentScore
};
