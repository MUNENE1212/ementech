/**
 * A/B Test Analyzer Service - Phase 5: A/B Testing & Optimization
 *
 * Provides statistical analysis functions for A/B testing:
 * - Calculate statistical significance (z-test, chi-square)
 * - Determine winner based on criteria
 * - Generate test reports
 * - Traffic allocation helper
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

import ABTest from '../models/ABTest.js';

// ============================================================================
// STATISTICAL SIGNIFICANCE CALCULATIONS
// ============================================================================

/**
 * Calculate statistical significance for an A/B test
 *
 * Performs statistical tests to determine if observed differences
 * between variants are statistically significant or due to chance.
 *
 * @param {ABTest} test - The A/B test to analyze
 * @returns {Promise<Object>} Statistical significance results
 *
 * @example
 * const significance = await calculateStatisticalSignificance(abTest);
 * // Returns: { isSignificant: true, pValue: 0.02, confidenceLevel: 95, ... }
 */
export async function calculateStatisticalSignificance(test) {
  if (!test.variants || test.variants.length < 2) {
    return {
      isSignificant: false,
      pValue: null,
      confidenceLevel: test.significance?.confidenceLevel || 95,
      reason: 'Need at least 2 variants to calculate significance',
    };
  }

  const control = test.controlVariant;
  if (!control) {
    return {
      isSignificant: false,
      pValue: null,
      confidenceLevel: test.significance?.confidenceLevel || 95,
      reason: 'No control variant defined',
    };
  }

  const testType = test.significance?.testType || 'z-test';
  const confidenceLevel = test.significance?.confidenceLevel || 95;
  const minSampleSize = test.significance?.minSampleSize || 100;

  // Check minimum sample size
  const totalSent = test.variants.reduce((sum, v) => sum + (v.metrics?.sent || 0), 0);
  if (totalSent < minSampleSize * test.variants.length) {
    return {
      isSignificant: false,
      pValue: null,
      confidenceLevel,
      sampleSize: totalSent,
      requiredSampleSize: minSampleSize * test.variants.length,
      reason: 'Minimum sample size not reached',
    };
  }

  let result;

  switch (testType) {
    case 'chi-square':
      result = calculateChiSquare(test);
      break;
    case 't-test':
      result = calculateTTest(test);
      break;
    case 'bayesian':
      result = calculateBayesian(test);
      break;
    case 'z-test':
    default:
      result = calculateZTest(test);
      break;
  }

  // Update test with significance results
  test.significance = {
    ...test.significance,
    ...result,
    lastCalculatedAt: new Date(),
  };

  return result;
}

/**
 * Perform Z-test for statistical significance
 * Best for comparing proportions (conversion rates, open rates, etc.)
 *
 * @param {ABTest} test - The A/B test
 * @returns {Object} Z-test results
 * @private
 */
function calculateZTest(test) {
  const control = test.controlVariant;
  const treatment = getBestTreatmentVariant(test);

  if (!control || !treatment) {
    return {
      isSignificant: false,
      pValue: 1,
      confidenceLevel: test.significance?.confidenceLevel || 95,
    };
  }

  // Get conversion counts based on winner criteria
  const controlMetrics = control.metrics || {};
  const treatmentMetrics = treatment.metrics || {};

  const getMetricValue = (metrics, criteria) => {
    switch (criteria) {
      case 'open_rate':
        return { conversions: metrics.uniqueOpens || 0, trials: metrics.sent || 0 };
      case 'click_rate':
        return { conversions: metrics.uniqueClicks || 0, trials: metrics.sent || 0 };
      case 'conversion_rate':
        return { conversions: metrics.conversions || 0, trials: metrics.sent || 0 };
      default:
        return { conversions: metrics.conversions || 0, trials: metrics.sent || 0 };
    }
  };

  const controlData = getMetricValue(controlMetrics, test.winnerCriteria);
  const treatmentData = getMetricValue(treatmentMetrics, test.winnerCriteria);

  // Calculate rates
  const p1 = controlData.trials > 0 ? controlData.conversions / controlData.trials : 0;
  const p2 = treatmentData.trials > 0 ? treatmentData.conversions / treatmentData.trials : 0;

  // Pooled proportion
  const pooledP = (controlData.conversions + treatmentData.conversions) / 
                  (controlData.trials + treatmentData.trials);

  // Standard error
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / controlData.trials + 1 / treatmentData.trials));

  // Z-score
  const z = se > 0 ? (p2 - p1) / se : 0;

  // P-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  // Confidence interval for the difference
  const alpha = 1 - ((test.significance?.confidenceLevel || 95) / 100);
  const zCritical = normalCDFInverse(1 - alpha / 2);
  const difference = p2 - p1;
  const marginOfError = zCritical * Math.sqrt(p1 * (1 - p1) / controlData.trials + p2 * (1 - p2) / treatmentData.trials);

  const confidenceIntervalLower = difference - marginOfError;
  const confidenceIntervalUpper = difference + marginOfError;

  // Effect size (Cohen's h for proportions)
  const effectSize = 2 * (Math.asin(Math.sqrt(Math.max(0, Math.min(1, p2)))) - 
                           Math.asin(Math.sqrt(Math.max(0, Math.min(1, p1)))));

  // Determine if significant
  const isSignificant = pValue < alpha;

  return {
    isSignificant,
    pValue: Math.round(pValue * 10000) / 10000,
    confidenceLevel: test.significance?.confidenceLevel || 95,
    zScore: Math.round(z * 1000) / 1000,
    controlRate: Math.round(p1 * 10000) / 100,
    treatmentRate: Math.round(p2 * 10000) / 100,
    difference: Math.round(difference * 10000) / 100,
    confidenceIntervalLower: Math.round(confidenceIntervalLower * 10000) / 100,
    confidenceIntervalUpper: Math.round(confidenceIntervalUpper * 10000) / 100,
    effectSize: Math.round(effectSize * 1000) / 1000,
    testType: 'z-test',
  };
}

/**
 * Perform Chi-square test for statistical significance
 * Best for categorical data and multiple variants
 *
 * @param {ABTest} test - The A/B test
 * @returns {Object} Chi-square test results
 * @private
 */
function calculateChiSquare(test) {
  const variants = test.variants || [];
  
  // Build contingency table
  const getMetricValue = (metrics, criteria) => {
    switch (criteria) {
      case 'open_rate':
        return { conversions: metrics.uniqueOpens || 0, trials: metrics.sent || 0 };
      case 'click_rate':
        return { conversions: metrics.uniqueClicks || 0, trials: metrics.sent || 0 };
      case 'conversion_rate':
        return { conversions: metrics.conversions || 0, trials: metrics.sent || 0 };
      default:
        return { conversions: metrics.conversions || 0, trials: metrics.sent || 0 };
    }
  };

  // Calculate chi-square statistic
  let totalConversions = 0;
  let totalTrials = 0;
  
  const variantData = variants.map(v => {
    const data = getMetricValue(v.metrics || {}, test.winnerCriteria);
    totalConversions += data.conversions;
    totalTrials += data.trials;
    return { ...data, variantId: v.variantId };
  });

  const expectedRate = totalTrials > 0 ? totalConversions / totalTrials : 0;

  let chiSquare = 0;
  variantData.forEach(data => {
    const expectedConversions = data.trials * expectedRate;
    const expectedNonConversions = data.trials - expectedConversions;
    
    if (expectedConversions > 0 && expectedNonConversions > 0) {
      const observedConversions = data.conversions;
      const observedNonConversions = data.trials - data.conversions;
      
      chiSquare += Math.pow(observedConversions - expectedConversions, 2) / expectedConversions;
      chiSquare += Math.pow(observedNonConversions - expectedNonConversions, 2) / expectedNonConversions;
    }
  });

  const degreesOfFreedom = variants.length - 1;
  
  // Approximate p-value from chi-square distribution
  const pValue = chiSquareCDF(chiSquare, degreesOfFreedom);
  
  const alpha = 1 - ((test.significance?.confidenceLevel || 95) / 100);
  const isSignificant = pValue < alpha;

  return {
    isSignificant,
    pValue: Math.round(pValue * 10000) / 10000,
    confidenceLevel: test.significance?.confidenceLevel || 95,
    chiSquare: Math.round(chiSquare * 1000) / 1000,
    degreesOfFreedom,
    testType: 'chi-square',
  };
}

/**
 * Perform T-test for statistical significance
 * Best for continuous data (revenue, etc.)
 *
 * @param {ABTest} test - The A/B test
 * @returns {Object} T-test results
 * @private
 */
function calculateTTest(test) {
  const control = test.controlVariant;
  const treatment = getBestTreatmentVariant(test);

  if (!control || !treatment) {
    return {
      isSignificant: false,
      pValue: 1,
      confidenceLevel: test.significance?.confidenceLevel || 95,
    };
  }

  // For revenue data
  const controlRevenue = control.metrics?.revenue || 0;
  const treatmentRevenue = treatment.metrics?.revenue || 0;
  const controlSent = control.metrics?.sent || 1;
  const treatmentSent = treatment.metrics?.sent || 1;

  const controlMean = controlRevenue / controlSent;
  const treatmentMean = treatmentRevenue / treatmentSent;

  // Pooled standard deviation (simplified)
  const pooledVariance = (controlRevenue + treatmentRevenue) / (controlSent + treatmentSent);
  const se = Math.sqrt(pooledVariance / controlSent + pooledVariance / treatmentSent);

  // T-statistic
  const t = se > 0 ? (treatmentMean - controlMean) / se : 0;

  // Approximate p-value (simplified for large samples)
  const pValue = 2 * (1 - normalCDF(Math.abs(t)));

  const alpha = 1 - ((test.significance?.confidenceLevel || 95) / 100);
  const isSignificant = pValue < alpha;

  return {
    isSignificant,
    pValue: Math.round(pValue * 10000) / 10000,
    confidenceLevel: test.significance?.confidenceLevel || 95,
    tScore: Math.round(t * 1000) / 1000,
    controlMean: Math.round(controlMean * 100) / 100,
    treatmentMean: Math.round(treatmentMean * 100) / 100,
    difference: Math.round((treatmentMean - controlMean) * 100) / 100,
    testType: 't-test',
  };
}

/**
 * Perform Bayesian analysis
 * Uses beta distributions for conversion rate estimation
 *
 * @param {ABTest} test - The A/B test
 * @returns {Object} Bayesian analysis results
 * @private
 */
function calculateBayesian(test) {
  const control = test.controlVariant;
  const treatment = getBestTreatmentVariant(test);

  if (!control || !treatment) {
    return {
      isSignificant: false,
      pValue: null,
      confidenceLevel: test.significance?.confidenceLevel || 95,
    };
  }

  const getMetricValue = (metrics, criteria) => {
    switch (criteria) {
      case 'open_rate':
        return { conversions: metrics.uniqueOpens || 0, trials: metrics.sent || 0 };
      case 'click_rate':
        return { conversions: metrics.uniqueClicks || 0, trials: metrics.sent || 0 };
      case 'conversion_rate':
        return { conversions: metrics.conversions || 0, trials: metrics.sent || 0 };
      default:
        return { conversions: metrics.conversions || 0, trials: metrics.sent || 0 };
    }
  };

  const controlData = getMetricValue(control.metrics || {}, test.winnerCriteria);
  const treatmentData = getMetricValue(treatment.metrics || {}, test.winnerCriteria);

  // Beta distribution parameters (using uniform prior: alpha=1, beta=1)
  const controlAlpha = controlData.conversions + 1;
  const controlBeta = controlData.trials - controlData.conversions + 1;
  const treatmentAlpha = treatmentData.conversions + 1;
  const treatmentBeta = treatmentData.trials - treatmentData.conversions + 1;

  // Mean of beta distributions
  const controlMean = controlAlpha / (controlAlpha + controlBeta);
  const treatmentMean = treatmentAlpha / (treatmentAlpha + treatmentBeta);

  // Probability that treatment is better (via Monte Carlo approximation)
  const samples = 10000;
  let treatmentWins = 0;

  for (let i = 0; i < samples; i++) {
    const controlSample = betaSample(controlAlpha, controlBeta);
    const treatmentSample = betaSample(treatmentAlpha, treatmentBeta);
    if (treatmentSample > controlSample) {
      treatmentWins++;
    }
  }

  const probabilityTreatmentBetter = treatmentWins / samples;
  const isSignificant = probabilityTreatmentBetter > 0.95 || probabilityTreatmentBetter < 0.05;

  return {
    isSignificant,
    probabilityTreatmentBetter: Math.round(probabilityTreatmentBetter * 10000) / 10000,
    controlMean: Math.round(controlMean * 10000) / 100,
    treatmentMean: Math.round(treatmentMean * 10000) / 100,
    controlAlpha,
    controlBeta,
    treatmentAlpha,
    treatmentBeta,
    testType: 'bayesian',
  };
}

// ============================================================================
// WINNER DETERMINATION
// ============================================================================

/**
 * Determine the winning variant based on configured criteria
 *
 * @param {ABTest} test - The A/B test to analyze
 * @returns {Object|null} Winning variant info or null if no winner
 *
 * @example
 * const winner = determineWinner(abTest);
 * // Returns: { variantId: 'B', confidence: 0.95, improvement: 12.5, ... }
 */
export function determineWinner(test) {
  if (!test.variants || test.variants.length < 2) {
    return null;
  }

  const criteria = test.winnerCriteria || 'open_rate';
  const direction = test.winnerDirection || 'higher';

  // Get metric value for each variant
  const getVariantValue = (variant) => {
    const metrics = variant.metrics || {};
    const base = metrics.delivered || metrics.sent || metrics.recipients || 1;

    switch (criteria) {
      case 'open_rate':
        return (metrics.uniqueOpens || 0) / base;
      case 'click_rate':
        return (metrics.uniqueClicks || 0) / base;
      case 'click_to_open_rate':
        return (metrics.uniqueOpens || 0) > 0 
          ? (metrics.uniqueClicks || 0) / metrics.uniqueOpens 
          : 0;
      case 'conversion_rate':
        return (metrics.conversions || 0) / base;
      case 'revenue':
        return metrics.revenue || 0;
      case 'unsubscribes':
        return (metrics.unsubscribes || 0) / base;
      case 'bounces':
        return (metrics.bounces || 0) / base;
      case 'custom_goal':
        return (metrics.customGoalCompletions || 0) / base;
      default:
        return (metrics.uniqueOpens || 0) / base;
    }
  };

  // Calculate values and find best
  let bestVariant = null;
  let bestValue = direction === 'higher' ? -Infinity : Infinity;

  test.variants.forEach(variant => {
    const value = getVariantValue(variant);
    if (direction === 'higher' ? value > bestValue : value < bestValue) {
      bestValue = value;
      bestVariant = variant;
    }
  });

  if (!bestVariant) {
    return null;
  }

  // Calculate improvement over control
  const control = test.controlVariant;
  let improvement = 0;
  
  if (control) {
    const controlValue = getVariantValue(control);
    if (controlValue > 0) {
      improvement = ((bestValue - controlValue) / controlValue) * 100;
    }
  }

  return {
    variantId: bestVariant.variantId,
    variant: bestVariant,
    value: bestValue,
    criteria,
    direction,
    improvement: Math.round(improvement * 100) / 100,
    meetsThreshold: Math.abs(improvement) >= (test.minImprovementThreshold || 5),
  };
}

// ============================================================================
// TEST REPORT GENERATION
// ============================================================================

/**
 * Generate a comprehensive test report
 *
 * @param {ABTest} test - The A/B test to report on
 * @returns {Promise<Object>} Test report with analysis and recommendations
 *
 * @example
 * const report = await generateTestReport(abTest);
 */
export async function generateTestReport(test) {
  // Get statistical significance
  const significance = await calculateStatisticalSignificance(test);

  // Get winner
  const winner = determineWinner(test);

  // Build variant comparison
  const variantComparison = buildVariantComparison(test);

  // Generate recommendations
  const recommendations = generateRecommendations(test, significance, winner);

  // Calculate confidence intervals for each variant
  const confidenceIntervals = test.variants.map(variant => {
    const metrics = variant.metrics || {};
    const sent = metrics.sent || 0;
    const conversions = metrics.uniqueOpens || 0; // Default to opens
    
    const rate = sent > 0 ? conversions / sent : 0;
    const margin = sent > 0 ? 1.96 * Math.sqrt(rate * (1 - rate) / sent) : 0;
    
    return {
      variantId: variant.variantId,
      name: variant.name,
      rate: Math.round(rate * 10000) / 100,
      lowerBound: Math.round(Math.max(0, rate - margin) * 10000) / 100,
      upperBound: Math.round(Math.min(1, rate + margin) * 10000) / 100,
      sampleSize: sent,
    };
  });

  return {
    testId: test._id,
    testName: test.name,
    testType: test.testType,
    status: test.status,
    generatedAt: new Date(),

    // Significance
    significance,

    // Winner
    winner,

    // Variant comparison
    variantComparison,

    // Confidence intervals
    confidenceIntervals,

    // Recommendations
    recommendations,

    // Summary
    summary: {
      totalRecipients: test.results?.totalRecipients || 0,
      totalSent: test.results?.totalSent || 0,
      totalConversions: test.results?.totalConversions || 0,
      overallConversionRate: test.results?.overallConversionRate || 0,
      hasReachedMinDuration: test.hasReachedMinDuration,
      isReadyToConclude: significance.isSignificant && test.hasReachedMinDuration,
    },
  };
}

/**
 * Build variant comparison table
 *
 * @param {ABTest} test - The A/B test
 * @returns {Array} Variant comparison data
 * @private
 */
function buildVariantComparison(test) {
  if (!test.variants || test.variants.length === 0) {
    return [];
  }

  const criteria = test.winnerCriteria || 'open_rate';

  const getMetricData = (metrics) => {
    const base = metrics.delivered || metrics.sent || metrics.recipients || 1;
    
    return {
      sent: metrics.sent || 0,
      delivered: metrics.delivered || 0,
      opens: metrics.uniqueOpens || 0,
      clicks: metrics.uniqueClicks || 0,
      conversions: metrics.conversions || 0,
      revenue: metrics.revenue || 0,
      openRate: base > 0 ? ((metrics.uniqueOpens || 0) / base) * 100 : 0,
      clickRate: base > 0 ? ((metrics.uniqueClicks || 0) / base) * 100 : 0,
      conversionRate: base > 0 ? ((metrics.conversions || 0) / base) * 100 : 0,
      bounceRate: base > 0 ? ((metrics.bounces || 0) / base) * 100 : 0,
      unsubscribeRate: base > 0 ? ((metrics.unsubscribes || 0) / base) * 100 : 0,
    };
  };

  const controlMetrics = test.controlVariant?.metrics || {};
  const controlData = getMetricData(controlMetrics);

  return test.variants.map(variant => {
    const metrics = variant.metrics || {};
    const data = getMetricData(metrics);

    // Calculate difference from control
    const difference = {};
    const differencePercent = {};

    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'number' && key !== 'sent') {
        difference[key] = data[key] - controlData[key];
        if (controlData[key] !== 0) {
          differencePercent[key] = ((data[key] - controlData[key]) / controlData[key]) * 100;
        }
      }
    });

    return {
      variantId: variant.variantId,
      name: variant.name,
      isWinner: variant.isWinner,
      isControl: variant.variantId === test.controlVariantId,
      weight: variant.weight,
      metrics: data,
      difference,
      differencePercent,
    };
  });
}

/**
 * Generate recommendations based on test results
 *
 * @param {ABTest} test - The A/B test
 * @param {Object} significance - Statistical significance results
 * @param {Object} winner - Winner determination
 * @returns {Array<string>} Recommendations
 * @private
 */
function generateRecommendations(test, significance, winner) {
  const recommendations = [];

  if (test.status === 'running') {
    if (!test.hasReachedMinDuration) {
      recommendations.push('Continue the test to reach minimum duration for statistical validity.');
    }

    const minSampleSize = test.significance?.minSampleSize || 100;
    const totalSent = test.variants.reduce((sum, v) => sum + (v.metrics?.sent || 0), 0);
    if (totalSent < minSampleSize * test.variants.length) {
      recommendations.push(`Increase sample size. Currently at ${totalSent}, need at least ${minSampleSize * test.variants.length}.`);
    }

    if (!significance.isSignificant) {
      recommendations.push('Results are not yet statistically significant. Continue collecting data.');
    }
  }

  if (test.status === 'completed' || test.status === 'paused') {
    if (significance.isSignificant && winner) {
      recommendations.push(`Variant ${winner.variantId} shows statistically significant improvement of ${winner.improvement}%. Consider implementing as the new default.`);
      
      if (test.winningVariantId && test.winningVariantId !== winner.variantId) {
        recommendations.push(`Current declared winner (${test.winningVariantId}) differs from best performing variant (${winner.variantId}). Review winner declaration.`);
      }
    } else if (!significance.isSignificant) {
      recommendations.push('No statistically significant winner detected. Consider running the test longer or testing different variants.');
    }

    const control = test.controlVariant;
    if (control && winner && winner.variantId === test.controlVariantId) {
      recommendations.push('Control variant is performing best. No change needed to current approach.');
    }
  }

  if (test.testType === 'subject_line') {
    recommendations.push('For subject line tests, consider that the impact may vary based on audience and timing.');
  }

  if (test.testType === 'send_time') {
    recommendations.push('Send time optimization should consider audience timezone and engagement patterns.');
  }

  return recommendations;
}

// ============================================================================
// TRAFFIC ALLOCATION HELPERS
// ============================================================================

/**
 * Allocate traffic variants based on strategy
 *
 * @param {Array} variants - Array of variant objects
 * @param {string} strategy - Allocation strategy
 * @param {Object} options - Additional options
 * @returns {string} Selected variant ID
 */
export function allocateVariant(variants, strategy = 'equal', options = {}) {
  switch (strategy) {
    case 'weighted':
      return weightedAllocation(variants);
    case 'thompson_sampling':
      return thompsonSamplingAllocation(variants);
    case 'epsilon_greedy':
      return epsilonGreedyAllocation(variants, options.epsilon || 0.1);
    case 'equal':
    default:
      return equalAllocation(variants, options.recipientId);
  }
}

/**
 * Equal allocation using hash for consistency
 */
function equalAllocation(variants, recipientId) {
  if (!recipientId) {
    return variants[Math.floor(Math.random() * variants.length)]?.variantId;
  }
  const hash = recipientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % variants.length;
  return variants[index]?.variantId;
}

/**
 * Weighted random allocation
 */
function weightedAllocation(variants) {
  const total = variants.reduce((sum, v) => sum + (v.weight || 0), 0);
  let random = Math.random() * total;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant.variantId;
    }
  }

  return variants[0]?.variantId;
}

/**
 * Thompson sampling allocation (beta distribution)
 */
function thompsonSamplingAllocation(variants) {
  let bestSample = -Infinity;
  let bestVariant = variants[0];

  for (const variant of variants) {
    const metrics = variant.metrics || {};
    const alpha = (metrics.conversions || 0) + 1;
    const beta = (metrics.sent || 0) - (metrics.conversions || 0) + 1;
    const sample = betaSample(alpha, beta);

    if (sample > bestSample) {
      bestSample = sample;
      bestVariant = variant;
    }
  }

  return bestVariant?.variantId;
}

/**
 * Epsilon-greedy allocation
 */
function epsilonGreedyAllocation(variants, epsilon = 0.1) {
  if (Math.random() < epsilon) {
    const index = Math.floor(Math.random() * variants.length);
    return variants[index]?.variantId;
  }

  let bestVariant = variants[0];
  let bestRate = -1;

  for (const variant of variants) {
    const metrics = variant.metrics || {};
    const sent = metrics.sent || 0;
    const conversions = metrics.conversions || 0;
    const rate = sent > 0 ? conversions / sent : 0;

    if (rate > bestRate) {
      bestRate = rate;
      bestVariant = variant;
    }
  }

  return bestVariant?.variantId;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the best performing treatment variant (non-control)
 *
 * @param {ABTest} test - The A/B test
 * @returns {Object|null} Best treatment variant or null
 * @private
 */
function getBestTreatmentVariant(test) {
  if (!test.variants || test.variants.length < 2) {
    return null;
  }

  const criteria = test.winnerCriteria || 'open_rate';
  const direction = test.winnerDirection || 'higher';

  const getVariantValue = (variant) => {
    const metrics = variant.metrics || {};
    const base = metrics.delivered || metrics.sent || metrics.recipients || 1;

    switch (criteria) {
      case 'open_rate':
        return (metrics.uniqueOpens || 0) / base;
      case 'click_rate':
        return (metrics.uniqueClicks || 0) / base;
      case 'conversion_rate':
        return (metrics.conversions || 0) / base;
      case 'revenue':
        return metrics.revenue || 0;
      default:
        return (metrics.uniqueOpens || 0) / base;
    }
  };

  const treatmentVariants = test.variants.filter(v => v.variantId !== test.controlVariantId);
  let bestVariant = null;
  let bestValue = direction === 'higher' ? -Infinity : Infinity;

  treatmentVariants.forEach(variant => {
    const value = getVariantValue(variant);
    if (direction === 'higher' ? value > bestValue : value < bestValue) {
      bestValue = value;
      bestVariant = variant;
    }
  });

  return bestVariant;
}

/**
 * Standard normal cumulative distribution function
 * @param {number} x - Value
 * @returns {number} CDF value
 */
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Inverse standard normal CDF (approximation)
 * @param {number} p - Probability
 * @returns {number} Z-score
 */
function normalCDFInverse(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [-3.969683028665376e+01, 2.209460984245205e+02,
              -2.759285104469687e+02, 1.383577518672690e+02,
              -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02,
              -1.556989798598866e+02, 6.680131188771972e+01,
              -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01,
              -2.400758277161838e+00, -2.549732539343734e+00,
               4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01,
              2.445134137142996e+00, 3.754408661907416e+00];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

/**
 * Chi-square CDF (approximation)
 * @param {number} x - Chi-square statistic
 * @param {number} df - Degrees of freedom
 * @returns {number} P-value
 */
function chiSquareCDF(x, df) {
  if (x < 0) return 1;
  if (df < 1) return 1;

  // Wilson-Hilferty approximation
  const z = Math.pow(x / df, 1/3) - (1 - 2 / (9 * df));
  const p = normalCDF(z * Math.sqrt(df / 2));
  return 1 - p;
}

/**
 * Beta distribution sample (approximation)
 * @param {number} alpha - Alpha parameter
 * @param {number} beta - Beta parameter
 * @returns {number} Random sample
 */
function betaSample(alpha, beta) {
  const u1 = Math.pow(Math.random(), 1 / alpha);
  const u2 = Math.pow(Math.random(), 1 / beta);
  return u1 / (u1 + u2);
}

export default {
  calculateStatisticalSignificance,
  determineWinner,
  generateTestReport,
  allocateVariant,
};
