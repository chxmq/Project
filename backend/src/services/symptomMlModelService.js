import XLSX from 'xlsx';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try the legacy filename first, then fall back to the canonical dataset
// shipped in the repo. Using a list keeps things working for older clones.
const DATASET_CANDIDATES = [
  path.join(__dirname, '../../../New Dataset-8 symptoms-2025  (1).xlsx'),
  path.join(__dirname, '../../../datasets/symptoms_2025.xlsx')
];
const resolveDatasetPath = () => DATASET_CANDIDATES.find((candidate) => existsSync(candidate));
const SYMPTOM_COLUMNS = ['Fever', 'Common Cold', 'Cough', 'Body Pain', 'Headache', 'Menstrual Cramps', 'Sprain', 'Indigestion', 'Toothache'];
const FOLLOW_UP_COLUMNS = ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'];

let modelState = null;
const CLASS_LABELS = ['otc', 'consult_doctor', 'consult_immediately'];

const seededShuffle = (items, seed = 2026) => {
  const arr = [...items];
  let state = seed;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const j = Math.floor((state / 4294967296) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const normalizeYesNo = (value) => {
  const text = String(value ?? '').trim().toLowerCase();
  return text === 'yes' || text === 'true' || text === '1' ? 'Yes' : 'No';
};

const normalizeGender = (value) => {
  const text = String(value ?? '').trim().toLowerCase();
  if (text === 'male' || text === 'female') return text;
  return 'other';
};

const toCareClass = (rawDecision) => {
  const text = String(rawDecision ?? '').trim().toLowerCase();
  if (!text) return null;
  if (text.includes('immediately')) return 'consult_immediately';
  if (text.includes('consult doctor') || text.includes('consult the doctor')) return 'consult_doctor';
  return 'otc';
};

const parseBucketRange = (bucketText) => {
  const text = String(bucketText ?? '').trim();
  const range = text.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return { type: 'range', min: Number(range[1]), max: Number(range[2]), label: text };
  const plus = text.match(/^(\d+)\s*\+$/);
  if (plus) return { type: 'plus', min: Number(plus[1]), label: text };
  return null;
};

const buildNumericBucketResolver = (values, fallbackLabel) => {
  const buckets = Array.from(new Set(values.map((v) => String(v ?? '').trim()).filter(Boolean)))
    .map(parseBucketRange)
    .filter(Boolean);

  if (!buckets.length) {
    return () => fallbackLabel;
  }

  return (input) => {
    const text = String(input ?? '').trim();
    if (buckets.some((b) => b.label === text)) return text;
    const num = Number(text);
    if (!Number.isFinite(num)) return fallbackLabel;

    for (const bucket of buckets) {
      if (bucket.type === 'range' && num >= bucket.min && num <= bucket.max) return bucket.label;
      if (bucket.type === 'plus' && num >= bucket.min) return bucket.label;
    }
    return fallbackLabel;
  };
};

const rowToFeatureVector = (row, resolveAgeBucket, resolveWeightBucket) => {
  return [
    normalizeGender(row.Gender),
    resolveAgeBucket(row.Age),
    resolveWeightBucket(row.Weight),
    ...SYMPTOM_COLUMNS.map((name) => normalizeYesNo(row[name])),
    ...FOLLOW_UP_COLUMNS.map((name) => normalizeYesNo(row[name]))
  ];
};

const trainNaiveBayes = (samples) => {
  const classCounts = new Map();
  const featureValueSets = [];
  const featureCountsByClass = new Map();

  for (const sample of samples) {
    classCounts.set(sample.label, (classCounts.get(sample.label) || 0) + 1);
    if (!featureCountsByClass.has(sample.label)) {
      featureCountsByClass.set(sample.label, sample.features.map(() => new Map()));
    }
    const perClass = featureCountsByClass.get(sample.label);
    sample.features.forEach((value, index) => {
      if (!featureValueSets[index]) featureValueSets[index] = new Set();
      featureValueSets[index].add(value);
      perClass[index].set(value, (perClass[index].get(value) || 0) + 1);
    });
  }

  return {
    kind: 'naive_bayes',
    total: samples.length,
    classCounts,
    featureCountsByClass,
    cardinality: featureValueSets.map((s) => Math.max(s.size, 1))
  };
};

const predictNaiveBayes = (model, features) => {
  const labels = Array.from(model.classCounts.keys());
  const scoreEntries = labels.map((label) => {
    const classCount = model.classCounts.get(label);
    const perClass = model.featureCountsByClass.get(label);
    let logScore = Math.log(classCount / model.total);
    features.forEach((value, index) => {
      const count = perClass[index].get(value) || 0;
      const denom = classCount + model.cardinality[index];
      logScore += Math.log((count + 1) / denom);
    });
    return { label, score: logScore };
  });

  const sorted = scoreEntries.sort((a, b) => b.score - a.score);
  const maxScore = sorted[0].score;
  const expScores = sorted.map((entry) => Math.exp(entry.score - maxScore));
  const expSum = expScores.reduce((sum, val) => sum + val, 0);
  const probabilities = sorted.map((entry, idx) => ({
    label: entry.label,
    probability: expScores[idx] / expSum
  }));

  return {
    label: sorted[0].label,
    confidence: probabilities[0].probability,
    probabilities
  };
};

const hammingDistance = (a, b) => {
  let distance = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) distance += 1;
  }
  return distance;
};

const trainKnn = (samples, k) => ({ kind: 'knn', samples, k });

const predictKnn = (model, features) => {
  const neighbors = model.samples
    .map((sample) => ({ label: sample.label, distance: hammingDistance(features, sample.features) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, model.k);

  const votes = new Map(CLASS_LABELS.map((label) => [label, 0]));
  neighbors.forEach((n) => votes.set(n.label, (votes.get(n.label) || 0) + 1));
  const sortedVotes = Array.from(votes.entries()).sort((a, b) => b[1] - a[1]);

  return {
    label: sortedVotes[0][0],
    confidence: sortedVotes[0][1] / model.k,
    probabilities: sortedVotes.map(([label, count]) => ({
      label,
      probability: count / model.k
    }))
  };
};

const buildConfusionMatrix = (labels, predictions) => {
  const indexByLabel = new Map(labels.map((label, idx) => [label, idx]));
  const matrix = labels.map(() => labels.map(() => 0));
  predictions.forEach(({ actual, predicted }) => {
    matrix[indexByLabel.get(actual)][indexByLabel.get(predicted)] += 1;
  });
  return matrix;
};

const safeDivide = (num, denom) => (denom === 0 ? 0 : num / denom);

const computeClassificationMetrics = (labels, confusionMatrix) => {
  const total = confusionMatrix.flat().reduce((a, b) => a + b, 0);
  const rowSums = confusionMatrix.map((row) => row.reduce((a, b) => a + b, 0));
  const colSums = labels.map((_, colIdx) =>
    confusionMatrix.reduce((sum, row) => sum + row[colIdx], 0));
  const tpTotal = labels.reduce((sum, _, idx) => sum + confusionMatrix[idx][idx], 0);

  const byClass = {};
  const recalls = [];
  const specificities = [];
  let precisionSum = 0;
  let recallSum = 0;
  let f1Sum = 0;

  labels.forEach((label, idx) => {
    const tp = confusionMatrix[idx][idx];
    const fn = rowSums[idx] - tp;
    const fp = colSums[idx] - tp;
    const tn = total - tp - fn - fp;
    const precision = safeDivide(tp, tp + fp);
    const recall = safeDivide(tp, tp + fn);
    const f1 = safeDivide(2 * precision * recall, precision + recall);
    const specificity = safeDivide(tn, tn + fp);
    byClass[label] = { precision, recall, f1Score: f1, specificity, support: rowSums[idx] };
    precisionSum += precision;
    recallSum += recall;
    f1Sum += f1;
    recalls.push(recall);
    specificities.push(specificity);
  });

  const observedAgreement = safeDivide(tpTotal, total);
  const expectedAgreement = safeDivide(
    rowSums.reduce((sum, rowSum, idx) => sum + rowSum * colSums[idx], 0),
    total * total
  );
  const kappa = safeDivide(observedAgreement - expectedAgreement, 1 - expectedAgreement);

  const mccNumerator = tpTotal * total - rowSums.reduce((sum, r, idx) => sum + r * colSums[idx], 0);
  const mccDenominatorLeft = total * total - colSums.reduce((sum, c) => sum + c * c, 0);
  const mccDenominatorRight = total * total - rowSums.reduce((sum, r) => sum + r * r, 0);
  const mcc = safeDivide(mccNumerator, Math.sqrt(mccDenominatorLeft * mccDenominatorRight));

  return {
    accuracy: safeDivide(tpTotal, total),
    precision: precisionSum / labels.length,
    recall: recallSum / labels.length,
    f1Score: f1Sum / labels.length,
    specificity: specificities.reduce((a, b) => a + b, 0) / labels.length,
    balancedAccuracy: recalls.reduce((a, b) => a + b, 0) / labels.length,
    matthewsCorrelationCoefficient: mcc,
    cohensKappa: kappa,
    byClass
  };
};

const rocAucFromPredictions = (labels, predictions) => {
  const result = {};
  labels.forEach((positiveClass) => {
    const points = [];
    for (let thresholdStep = 0; thresholdStep <= 100; thresholdStep += 2) {
      const threshold = thresholdStep / 100;
      let tp = 0; let fp = 0; let tn = 0; let fn = 0;
      predictions.forEach((p) => {
        const prob = p.probabilities.find((x) => x.label === positiveClass)?.probability || 0;
        const positive = prob >= threshold;
        const isPositiveClass = p.actual === positiveClass;
        if (positive && isPositiveClass) tp += 1;
        else if (positive && !isPositiveClass) fp += 1;
        else if (!positive && isPositiveClass) fn += 1;
        else tn += 1;
      });
      const tpr = safeDivide(tp, tp + fn);
      const fpr = safeDivide(fp, fp + tn);
      points.push({ threshold, tpr, fpr });
    }
    const sorted = points.sort((a, b) => a.fpr - b.fpr);
    let auc = 0;
    for (let i = 1; i < sorted.length; i += 1) {
      const x1 = sorted[i - 1].fpr;
      const x2 = sorted[i].fpr;
      const y1 = sorted[i - 1].tpr;
      const y2 = sorted[i].tpr;
      auc += (x2 - x1) * (y1 + y2) / 2;
    }
    result[positiveClass] = { auc, curve: sorted };
  });
  return {
    perClass: result,
    macroAuc: labels.reduce((sum, label) => sum + result[label].auc, 0) / labels.length
  };
};

const evaluateModelDetailed = (name, trainFn, predictFn, trainSamples, testSamples, labels) => {
  const trainStart = performance.now();
  const model = trainFn(trainSamples);
  const trainTimeMs = performance.now() - trainStart;

  const predictions = testSamples.map((sample) => {
    const inferenceStart = performance.now();
    const pred = predictFn(model, sample.features);
    const inferenceMs = performance.now() - inferenceStart;
    return {
      actual: sample.label,
      predicted: pred.label,
      probabilities: pred.probabilities,
      inferenceMs
    };
  });

  const confusionMatrix = buildConfusionMatrix(labels, predictions);
  const metrics = computeClassificationMetrics(labels, confusionMatrix);
  const rocAuc = rocAucFromPredictions(labels, predictions);

  return {
    name,
    model,
    predictFn,
    predictions,
    confusionMatrix,
    metrics: {
      ...metrics,
      rocAuc
    },
    performance: {
      trainTimeMs,
      meanInferenceMs: predictions.reduce((sum, p) => sum + p.inferenceMs, 0) / Math.max(predictions.length, 1)
    }
  };
};

const runKFoldAccuracies = (samples, labels, foldCount = 5) => {
  const shuffled = seededShuffle(samples, 909);
  const foldSize = Math.floor(shuffled.length / foldCount);
  const modelDefs = [
    { name: 'naive_bayes', train: trainNaiveBayes, predict: predictNaiveBayes },
    { name: 'knn_3', train: (s) => trainKnn(s, 3), predict: predictKnn },
    { name: 'knn_5', train: (s) => trainKnn(s, 5), predict: predictKnn },
    { name: 'knn_7', train: (s) => trainKnn(s, 7), predict: predictKnn }
  ];

  const foldResults = {};
  modelDefs.forEach((m) => { foldResults[m.name] = []; });

  for (let fold = 0; fold < foldCount; fold += 1) {
    const start = fold * foldSize;
    const end = fold === foldCount - 1 ? shuffled.length : (fold + 1) * foldSize;
    const test = shuffled.slice(start, end);
    const train = [...shuffled.slice(0, start), ...shuffled.slice(end)];
    modelDefs.forEach((m) => {
      const evalResult = evaluateModelDetailed(m.name, m.train, m.predict, train, test, labels);
      foldResults[m.name].push(evalResult.metrics.accuracy);
    });
  }

  return foldResults;
};

const oneWayAnovaPermutation = (groups, permutations = 1000) => {
  const names = Object.keys(groups);
  const arrays = names.map((name) => groups[name]);
  const allValues = arrays.flat();
  const grandMean = allValues.reduce((a, b) => a + b, 0) / Math.max(allValues.length, 1);

  const computeF = (groupArrays) => {
    const k = groupArrays.length;
    const n = groupArrays.reduce((sum, g) => sum + g.length, 0);
    const ssBetween = groupArrays.reduce((sum, g) => {
      const mean = g.reduce((a, b) => a + b, 0) / Math.max(g.length, 1);
      return sum + g.length * ((mean - grandMean) ** 2);
    }, 0);
    const ssWithin = groupArrays.reduce((sum, g) => {
      const mean = g.reduce((a, b) => a + b, 0) / Math.max(g.length, 1);
      return sum + g.reduce((acc, v) => acc + ((v - mean) ** 2), 0);
    }, 0);
    const msBetween = ssBetween / Math.max(k - 1, 1);
    const msWithin = ssWithin / Math.max(n - k, 1);
    return msWithin === 0 ? 0 : msBetween / msWithin;
  };

  const observedF = computeF(arrays);
  let extremeCount = 0;

  for (let i = 0; i < permutations; i += 1) {
    const shuffled = seededShuffle(allValues, 4000 + i);
    let offset = 0;
    const permutedGroups = arrays.map((g) => {
      const chunk = shuffled.slice(offset, offset + g.length);
      offset += g.length;
      return chunk;
    });
    const f = computeF(permutedGroups);
    if (f >= observedF) extremeCount += 1;
  }

  const pValue = (extremeCount + 1) / (permutations + 1);
  return { fStatistic: observedF, pValue, permutations };
};

/**
 * Pearson correlation matrix over the BINARY (Yes/No) features only.
 * The original implementation tried to encode categorical Gender/Age/Weight
 * as `value.length % 10`, which produced essentially random values.
 * By restricting to binary features we get a real, interpretable matrix.
 */
const buildFeatureCorrelationMatrix = (samples) => {
  // Only the symptom + follow-up columns are binary Yes/No.
  // Indices in the feature vector: [Gender, Age, Weight, ...SYMPTOMS, ...FOLLOW_UPS]
  const binaryStartIdx = 3;
  const binaryFeatureLabels = [...SYMPTOM_COLUMNS, ...FOLLOW_UP_COLUMNS];

  const encoded = samples.map((sample) =>
    sample.features.slice(binaryStartIdx).map((value) => (value === 'Yes' ? 1 : 0))
  );
  const featureCount = binaryFeatureLabels.length;
  const correlation = Array.from({ length: featureCount }, () => Array(featureCount).fill(0));

  const column = (idx) => encoded.map((row) => row[idx]);
  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
  const covariance = (a, b) => {
    const ma = mean(a);
    const mb = mean(b);
    return a.reduce((sum, val, i) => sum + (val - ma) * (b[i] - mb), 0) / Math.max(a.length, 1);
  };
  const std = (arr) => Math.sqrt(covariance(arr, arr));

  for (let i = 0; i < featureCount; i += 1) {
    for (let j = 0; j < featureCount; j += 1) {
      const a = column(i);
      const b = column(j);
      const denom = std(a) * std(b);
      correlation[i][j] = denom === 0 ? 0 : covariance(a, b) / denom;
    }
  }

  return { labels: binaryFeatureLabels, matrix: correlation };
};

const buildKnowledgeGraphTriples = (rows) => {
  const triplesCounter = new Map();
  const addTriple = (subject, predicate, object) => {
    const key = `${subject}|${predicate}|${object}`;
    triplesCounter.set(key, (triplesCounter.get(key) || 0) + 1);
  };

  rows.forEach((row) => {
    const careClass = toCareClass(row['OTC/Doc']);
    if (!careClass) return;
    SYMPTOM_COLUMNS.forEach((symptom) => {
      if (normalizeYesNo(row[symptom]) === 'Yes') {
        addTriple(`symptom:${symptom.toLowerCase().replace(/\s+/g, '_')}`, 'associated_with', `care:${careClass}`);
      }
    });
    addTriple(`demographic:gender:${normalizeGender(row.Gender)}`, 'observed_in', `care:${careClass}`);
  });

  return Array.from(triplesCounter.entries())
    .map(([key, weight]) => {
      const [subject, predicate, object] = key.split('|');
      return { subject, predicate, object, weight };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 200);
};

const parseRecommendationText = (text) => {
  const clean = String(text ?? '').trim();
  if (!clean) return [];
  const parts = clean
    .replace(/^OTC\s*:?\s*/i, '')
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.slice(0, 3).map((part) => {
    const doseMatch = part.match(/(\d+\s*mg|\d+\s*ml)/i);
    return {
      name: part.replace(/\(.*?\)/g, '').trim(),
      dosage: doseMatch ? doseMatch[1] : 'As advised',
      duration: 'As per symptom progression',
      timing: ['Morning', 'Night']
    };
  });
};

const classToSeverity = (careClass) => {
  if (careClass === 'consult_immediately') return 'High';
  if (careClass === 'consult_doctor') return 'Moderate';
  return 'Mild';
};

const buildRecommendations = (careClass, classTextMap) => {
  const topText = classTextMap.get(careClass)?.[0]?.text || '';
  const medicines = parseRecommendationText(topText);
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + (careClass === 'consult_immediately' ? 1 : 3));

  return {
    medicines,
    followUpDate,
    teleconsultationRecommended: careClass !== 'otc'
  };
};

const getRecommendationTextByNearestRows = (careClass, inputFeatures, trainSamples, k = 15) => {
  const candidates = trainSamples
    .filter((sample) => sample.label === careClass)
    .map((sample) => ({
      recommendationText: String(sample.recommendationText || '').trim(),
      distance: hammingDistance(sample.features, inputFeatures)
    }))
    .filter((row) => row.recommendationText);

  if (!candidates.length) return '';

  const nearest = candidates
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(k, candidates.length));

  const weightedScores = new Map();
  nearest.forEach((row) => {
    const weight = 1 / (1 + row.distance);
    weightedScores.set(
      row.recommendationText,
      (weightedScores.get(row.recommendationText) || 0) + weight
    );
  });

  return Array.from(weightedScores.entries()).sort((a, b) => b[1] - a[1])[0][0] || '';
};

const loadAndTrain = () => {
  const datasetPath = resolveDatasetPath();
  if (!datasetPath) {
    throw new Error(
      `Dataset not found. Looked in:\n${DATASET_CANDIDATES.map((p) => ` - ${p}`).join('\n')}`
    );
  }

  const workbook = XLSX.read(readFileSync(datasetPath), { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const resolveAgeBucket = buildNumericBucketResolver(rows.map((r) => r.Age), '26-35');
  const resolveWeightBucket = buildNumericBucketResolver(rows.map((r) => r.Weight), '60-80');

  const samples = rows
    .map((row) => {
      const label = toCareClass(row['OTC/Doc']);
      if (!label) return null;
      const activeSymptoms = SYMPTOM_COLUMNS.filter((symptom) => normalizeYesNo(row[symptom]) === 'Yes');
      return {
        features: rowToFeatureVector(row, resolveAgeBucket, resolveWeightBucket),
        label,
        recommendationText: String(row['OTC/Doc'] ?? '').trim(),
        activeSymptoms
      };
    })
    .filter(Boolean);

  if (!samples.length) throw new Error('No trainable rows found in dataset');

  const shuffled = seededShuffle(samples, 2026);
  const split = Math.floor(shuffled.length * 0.8);
  const trainSamples = shuffled.slice(0, split);
  const testSamples = shuffled.slice(split);

  const modelEvaluations = [
    evaluateModelDetailed('naive_bayes', trainNaiveBayes, predictNaiveBayes, trainSamples, testSamples, CLASS_LABELS),
    evaluateModelDetailed('knn_3', (s) => trainKnn(s, 3), predictKnn, trainSamples, testSamples, CLASS_LABELS),
    evaluateModelDetailed('knn_5', (s) => trainKnn(s, 5), predictKnn, trainSamples, testSamples, CLASS_LABELS),
    evaluateModelDetailed('knn_7', (s) => trainKnn(s, 7), predictKnn, trainSamples, testSamples, CLASS_LABELS)
  ];

  // Pick the model with the best balanced accuracy, NOT raw accuracy.
  // The dataset is heavily skewed toward "consult_doctor" — selecting on
  // raw accuracy would silently prefer models that collapse to majority class.
  const selectedEval = [...modelEvaluations].sort(
    (a, b) => b.metrics.balancedAccuracy - a.metrics.balancedAccuracy
  )[0];

  const classTextCounter = new Map();
  trainSamples.forEach((sample) => {
    if (!classTextCounter.has(sample.label)) classTextCounter.set(sample.label, new Map());
    const counter = classTextCounter.get(sample.label);
    counter.set(sample.recommendationText, (counter.get(sample.recommendationText) || 0) + 1);
  });

  const classTextMap = new Map();
  for (const [careClass, counts] of classTextCounter.entries()) {
    classTextMap.set(
      careClass,
      Array.from(counts.entries())
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count)
    );
  }

  modelState = {
    datasetPath,
    sampleCount: samples.length,
    trainCount: trainSamples.length,
    testCount: testSamples.length,
    selectedModelName: selectedEval.name,
    validationAccuracy: selectedEval.metrics.accuracy,
    model: selectedEval.model,
    predictFn: selectedEval.predictFn,
    trainSamples,
    resolveAgeBucket,
    resolveWeightBucket,
    classTextMap,
    modelEvaluations,
    selectedEvaluation: selectedEval,
    foldAccuracies: runKFoldAccuracies(samples, CLASS_LABELS, 5),
    featureCorrelation: buildFeatureCorrelationMatrix(samples),
    knowledgeGraphTriples: buildKnowledgeGraphTriples(rows)
  };
};

const ensureModel = () => {
  if (!modelState) loadAndTrain();
  return modelState;
};

// Train models eagerly so the first user request doesn't pay the
// k-fold + ANOVA + ROC + correlation matrix cost.
export const warmUpSymptomModel = () => ensureModel();

const requestFeatures = (symptoms, personalData, followUpAnswers, resolveAgeBucket, resolveWeightBucket) => {
  const symptomSet = new Set((symptoms || []).map((s) => String(s).trim()));
  return [
    normalizeGender(personalData?.sex),
    resolveAgeBucket(personalData?.age),
    resolveWeightBucket(personalData?.weight),
    ...SYMPTOM_COLUMNS.map((name) => (symptomSet.has(name) ? 'Yes' : 'No')),
    normalizeYesNo(followUpAnswers?.feverAbove104),
    normalizeYesNo(followUpAnswers?.fatigueWeakness),
    normalizeYesNo(followUpAnswers?.durationMoreThan3Days),
    normalizeYesNo(followUpAnswers?.takenOtherMedicine)
  ];
};

/**
 * Rule-based severity classification — matches the project's flowchart exactly.
 * The dataset is heavily skewed toward "Consult Doctor" labels, so a learned
 * classifier alone is unreliable for severity. The flowchart specifies the
 * red-flag rules clearly, so we encode them deterministically here.
 *
 *   HIGH:
 *     • Fever above 104°F (any single symptom)
 *     • Symptoms persisting > 3 days
 *     • Fatigue + weakness combined with any other red flag
 *
 *   MODERATE:
 *     • Has Fever (no 104 flag)
 *     • Fatigue / weakness alone
 *     • 2 or more symptoms
 *
 *   MILD: everything else (single, non-fever symptom, no flags)
 */
export const classifySeverityByRules = (symptoms, followUpAnswers) => {
  const symptomList = Array.isArray(symptoms) ? symptoms : [];
  const fu = followUpAnswers || {};
  const hasFever = symptomList.includes('Fever');

  if (fu.feverAbove104) return 'High';
  if (fu.durationMoreThan3Days) return 'High';
  if (fu.fatigueWeakness && hasFever) return 'High';

  if (hasFever) return 'Moderate';
  if (fu.fatigueWeakness) return 'Moderate';
  if (symptomList.length >= 2) return 'Moderate';

  return 'Mild';
};

export const predictSymptomAssessment = (symptoms, personalData, followUpAnswers) => {
  const state = ensureModel();
  const features = requestFeatures(
    symptoms,
    personalData,
    followUpAnswers,
    state.resolveAgeBucket,
    state.resolveWeightBucket
  );
  const prediction = state.predictFn(state.model, features);

  // ── Severity is RULE-BASED (per teacher's flowchart). ──
  // The ML model's care-class prediction is kept for the analytics dashboard
  // and as a "second opinion" signal, but the deterministic rules are the
  // source of truth for routing the user (Mild / Moderate / High).
  const severity = classifySeverityByRules(symptoms, followUpAnswers);

  // For medicines, prefer the nearest dataset row whose label aligns with the
  // rule-based severity, then fall back to most-common-text-for-class.
  const targetCareClass = severity === 'High'
    ? 'consult_immediately'
    : severity === 'Moderate'
      ? 'consult_doctor'
      : 'otc';

  const recommendations = buildRecommendations(targetCareClass, state.classTextMap);
  const nearestRecommendationText = getRecommendationTextByNearestRows(
    targetCareClass,
    features,
    state.trainSamples
  );
  if (nearestRecommendationText) {
    recommendations.medicines = parseRecommendationText(nearestRecommendationText);
  }

  // For High severity we deliberately don't recommend OTC drugs — see a doctor.
  if (severity === 'High') {
    recommendations.medicines = [];
    recommendations.teleconsultationRecommended = true;
  }

  return {
    severity,
    recommendations,
    mlPrediction: {
      // Note: ML's own carePath may differ from the rule-based severity.
      // We still surface it so the analytics dashboard can compare.
      carePath: prediction.label,
      mlSeverityHint: classToSeverity(prediction.label),
      confidence: Number(prediction.confidence.toFixed(4)),
      model: state.selectedModelName,
      severityFromRules: severity
    }
  };
};

export const getSymptomModelMetrics = () => {
  const state = ensureModel();
  const anova = oneWayAnovaPermutation(state.foldAccuracies, 1000);

  const comparativeStats = state.modelEvaluations.map((evalResult) => ({
    model: evalResult.name,
    accuracy: evalResult.metrics.accuracy,
    precision: evalResult.metrics.precision,
    recall: evalResult.metrics.recall,
    f1Score: evalResult.metrics.f1Score,
    specificity: evalResult.metrics.specificity,
    balancedAccuracy: evalResult.metrics.balancedAccuracy,
    mcc: evalResult.metrics.matthewsCorrelationCoefficient,
    cohensKappa: evalResult.metrics.cohensKappa,
    macroAuc: evalResult.metrics.rocAuc.macroAuc,
    trainTimeMs: evalResult.performance.trainTimeMs,
    meanInferenceMs: evalResult.performance.meanInferenceMs
  }));

  const comparisonHeatmap = {
    xLabels: ['Accuracy', 'Precision', 'Recall', 'F1', 'Specificity', 'BalancedAcc', 'MCC', 'Kappa', 'AUC'],
    yLabels: comparativeStats.map((m) => m.model),
    values: comparativeStats.map((m) => [
      m.accuracy, m.precision, m.recall, m.f1Score, m.specificity,
      m.balancedAccuracy, m.mcc, m.cohensKappa, m.macroAuc
    ])
  };

  const histogramData = {
    careClassCounts: CLASS_LABELS.map((label) => ({
      label,
      count: state.selectedEvaluation.predictions.filter((p) => p.actual === label).length
    }))
  };

  const tradeOff = comparativeStats.map((m) => ({
    model: m.model,
    accuracy: m.accuracy,
    complexityScore: m.model.startsWith('knn') ? 3 : 1,
    trainTimeMs: m.trainTimeMs,
    inferenceTimeMs: m.meanInferenceMs
  }));

  return {
    datasetPath: state.datasetPath,
    sampleCount: state.sampleCount,
    trainCount: state.trainCount,
    testCount: state.testCount,
    selectedModelName: state.selectedModelName,
    validationAccuracy: state.validationAccuracy,
    datasetClassificationPerformance: {
      accuracy: state.selectedEvaluation.metrics.accuracy,
      precision: state.selectedEvaluation.metrics.precision,
      recall: state.selectedEvaluation.metrics.recall,
      f1Score: state.selectedEvaluation.metrics.f1Score,
      specificity: state.selectedEvaluation.metrics.specificity,
      confusionMatrix: {
        labels: CLASS_LABELS,
        matrix: state.selectedEvaluation.confusionMatrix
      },
      byClass: state.selectedEvaluation.metrics.byClass
    },
    rocAucAnalysis: state.selectedEvaluation.metrics.rocAuc,
    hypothesisTesting: {
      anova
    },
    advancedMetrics: {
      matthewsCorrelationCoefficient: state.selectedEvaluation.metrics.matthewsCorrelationCoefficient,
      balancedAccuracy: state.selectedEvaluation.metrics.balancedAccuracy,
      cohensKappa: state.selectedEvaluation.metrics.cohensKappa
    },
    comparativeModelAnalysis: {
      models: comparativeStats,
      heatmap: comparisonHeatmap,
      histogram: histogramData,
      correlationMatrix: state.featureCorrelation
    },
    tradeOffAnalysis: tradeOff,
    healthcareKnowledgeGraph: {
      triples: state.knowledgeGraphTriples
    }
  };
};

