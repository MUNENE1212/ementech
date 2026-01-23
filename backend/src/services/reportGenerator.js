import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import AnalyticsDashboard from '../models/AnalyticsDashboard.js';
import Lead from '../models/Lead.js';
import Campaign from '../models/Campaign.js';
import Sequence from '../models/Sequence.js';
import SocialPost from '../models/SocialPost.js';
import ABTest from '../models/ABTest.js';

/**
 * Report Generator Service - Phase 7: Analytics Dashboard
 *
 * This service handles:
 * - PDF report generation with analytics data
 * - CSV export functionality
 * - Scheduled report generation
 * - Email reports to users
 * - Report template management
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_TYPES = {
  overview: 'Marketing Overview',
  leads: 'Lead Generation Report',
  email: 'Email Campaign Report',
  sequences: 'Sequence Performance Report',
  social: 'Social Media Report',
  abtests: 'A/B Testing Report',
  revenue: 'Revenue & ROI Report',
  funnel: 'Conversion Funnel Report',
  custom: 'Custom Report',
};

const REPORT_FORMATS = ['pdf', 'csv', 'json', 'html'];

const REPORT_TEMPLATES = {
  overview: {
    sections: [
      { title: 'Executive Summary', metrics: ['leads.total', 'leads.converted', 'revenue.totalRevenue', 'email.openRate'] },
      { title: 'Lead Generation', metrics: ['leads.total', 'leads.bySource', 'leads.pipelineSnapshot'] },
      { title: 'Email Performance', metrics: ['email.emailsSent', 'email.openRate', 'email.clickRate'] },
      { title: 'Revenue & ROI', metrics: ['revenue.totalRevenue', 'revenue.roi', 'revenue.costPerLead'] },
    ],
  },
  leads: {
    sections: [
      { title: 'Lead Overview', metrics: ['leads.total', 'leads.new', 'leads.qualified', 'leads.converted'] },
      { title: 'Lead Sources', metrics: ['leads.bySource'] },
      { title: 'Pipeline Analysis', metrics: ['leads.pipelineSnapshot', 'leads.avgTimeToQualify', 'leads.avgTimeToConvert'] },
      { title: 'Lead Quality', metrics: ['leads.avgLeadScore', 'leads.highValueLeads'] },
    ],
  },
  email: {
    sections: [
      { title: 'Campaign Overview', metrics: ['email.totalCampaigns', 'email.activeCampaigns', 'email.sentCampaigns'] },
      { title: 'Deliverability', metrics: ['email.emailsSent', 'email.emailsDelivered', 'email.deliveryRate', 'email.emailsBounced'] },
      { title: 'Engagement', metrics: ['email.openRate', 'email.clickRate', 'email.clickToOpenRate'] },
      { title: 'Top Campaigns', metrics: ['email.topCampaigns'] },
    ],
  },
  sequences: {
    sections: [
      { title: 'Sequence Overview', metrics: ['sequences.totalSequences', 'sequences.activeSequences', 'sequences.pausedSequences'] },
      { title: 'Enrollment', metrics: ['sequences.totalEnrolled', 'sequences.currentlyActive', 'sequences.completedToday'] },
      { title: 'Performance', metrics: ['sequences.completionRate', 'sequences.openRate', 'sequences.clickRate'] },
      { title: 'Top Sequences', metrics: ['sequences.topSequences'] },
    ],
  },
  social: {
    sections: [
      { title: 'Platform Overview', metrics: ['social.linkedin', 'social.twitter'] },
      { title: 'Engagement Summary', metrics: ['social.totalLikes', 'social.totalComments', 'social.totalShares', 'social.avgEngagementRate'] },
      { title: 'Follower Growth', metrics: ['social.linkedinFollowers', 'social.twitterFollowers', 'social.totalFollowers'] },
      { title: 'Top Posts', metrics: ['social.topPosts'] },
    ],
  },
  abtests: {
    sections: [
      { title: 'Test Overview', metrics: ['abTests.totalTests', 'abTests.activeTests', 'abTests.completedTests'] },
      { title: 'Test Results', metrics: ['abTests.testsSignificant', 'abTests.avgConfidenceLevel', 'abTests.avgImprovement'] },
      { title: 'Active Tests', metrics: ['abTests.activeTestsList'] },
      { title: 'Recent Winners', metrics: ['abTests.recentWinners'] },
    ],
  },
  revenue: {
    sections: [
      { title: 'Revenue Summary', metrics: ['revenue.totalRevenue', 'revenue.oneTimeRevenue', 'revenue.recurringRevenue'] },
      { title: 'Cost Analysis', metrics: ['revenue.totalCost', 'revenue.emailCost', 'revenue.laborCost'] },
      { title: 'ROI Metrics', metrics: ['revenue.roi', 'revenue.marketingROI', 'revenue.costPerLead', 'revenue.costPerConversion'] },
      { title: 'Revenue by Source', metrics: ['revenue.revenueBySource'] },
      { title: 'Revenue by Campaign', metrics: ['revenue.revenueByCampaign'] },
    ],
  },
  funnel: {
    sections: [
      { title: 'Funnel Overview', metrics: ['funnel.visitors', 'funnel.leads', 'funnel.conversions', 'funnel.overallConversionRate'] },
      { title: 'Stage Analysis', metrics: ['funnel.visitorToLeadRate', 'funnel.leadToMqlRate', 'funnel.mqlToSqlRate', 'funnel.sqlToOpportunityRate', 'funnel.opportunityToCloseRate'] },
      { title: 'Velocity', metrics: ['funnel.avgCycleTime', 'funnel.avgTimeInStage'] },
      { title: 'Drop-off Analysis', metrics: ['funnel.dropOffPoints'] },
    ],
  },
};

// ============================================================================
// CSV EXPORT FUNCTIONS
// ============================================================================

/**
 * Generate CSV from data array
 *
 * @param {Array} data - Data array
 * @param {Array} columns - Column definitions
 * @returns {string} CSV string
 */
export function generateCSV(data, columns) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = columns.map(c => c.header).join(',');

  const rows = data.map(row => {
    return columns.map(col => {
      let value = row;

      // Handle nested paths like 'metrics.sent'
      const path = col.field.split('.');
      for (const key of path) {
        value = value?.[key];
      }

      if (value === null || value === undefined) {
        return '';
      }

      const strValue = String(value);

      // Escape and wrap values containing special characters
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }

      return strValue;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Export leads to CSV
 *
 * @param {Object} options - Export options
 * @returns {Promise<string>} CSV string
 */
export async function exportLeadsToCSV(options = {}) {
  const {
    startDate,
    endDate,
    status,
    limit = 10000,
  } = options;

  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (status) {
    query.status = status;
  }

  const leads = await Lead.find(query)
    .limit(parseInt(limit))
    .select('name email company phone jobTitle source status pipelineStage leadScore estimatedValue probability createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const columns = [
    { header: 'Name', field: 'name' },
    { header: 'Email', field: 'email' },
    { header: 'Company', field: 'company' },
    { header: 'Phone', field: 'phone' },
    { header: 'Job Title', field: 'jobTitle' },
    { header: 'Source', field: 'source' },
    { header: 'Status', field: 'status' },
    { header: 'Pipeline Stage', field: 'pipelineStage' },
    { header: 'Lead Score', field: 'leadScore' },
    { header: 'Estimated Value', field: 'estimatedValue' },
    { header: 'Probability (%)', field: 'probability' },
    { header: 'Created Date', field: 'createdAt' },
  ];

  return generateCSV(leads, columns);
}

/**
 * Export campaigns to CSV
 *
 * @param {Object} options - Export options
 * @returns {Promise<string>} CSV string
 */
export async function exportCampaignsToCSV(options = {}) {
  const {
    startDate,
    endDate,
    status,
    limit = 1000,
  } = options;

  const query = { archivedAt: null };
  if (startDate && endDate) {
    query.$or = [
      { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { 'metrics.completedAt': { $gte: new Date(startDate), $lte: new Date(endDate) } },
    ];
  }
  if (status) {
    query.status = status;
  }

  const campaigns = await Campaign.find(query)
    .limit(parseInt(limit))
    .select('name slug type category status template schedule metrics budget')
    .sort({ createdAt: -1 })
    .lean();

  const columns = [
    { header: 'Name', field: 'name' },
    { header: 'Slug', field: 'slug' },
    { header: 'Type', field: 'type' },
    { header: 'Category', field: 'category' },
    { header: 'Status', field: 'status' },
    { header: 'Template', field: 'template' },
    { header: 'Scheduled', field: 'schedule.sendAt' },
    { header: 'Sent', field: 'metrics.sent' },
    { header: 'Delivered', field: 'metrics.delivered' },
    { header: 'Opens', field: 'metrics.uniqueOpens' },
    { header: 'Clicks', field: 'metrics.uniqueClicks' },
    { header: 'Conversions', field: 'metrics.conversions' },
    { header: 'Revenue', field: 'metrics.revenue' },
    { header: 'Budget Spent', field: 'budget.totalSpent' },
  ];

  return generateCSV(campaigns, columns);
}

/**
 * Export sequences to CSV
 *
 * @param {Object} options - Export options
 * @returns {Promise<string>} CSV string
 */
export async function exportSequencesToCSV(options = {}) {
  const {
    startDate,
    endDate,
    status,
    limit = 500,
  } = options;

  const query = { archivedAt: null };
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (status) {
    query.status = status;
  }

  const sequences = await Sequence.find(query)
    .limit(parseInt(limit))
    .select('name slug type category status goal goalTarget metrics createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const columns = [
    { header: 'Name', field: 'name' },
    { header: 'Slug', field: 'slug' },
    { header: 'Type', field: 'type' },
    { header: 'Category', field: 'category' },
    { header: 'Status', field: 'status' },
    { header: 'Goal', field: 'goal' },
    { header: 'Target', field: 'goalTarget' },
    { header: 'Enrolled', field: 'metrics.enrolled' },
    { header: 'Active', field: 'metrics.active' },
    { header: 'Completed', field: 'metrics.completed' },
    { header: 'Emails Sent', field: 'metrics.emailsSent' },
    { header: 'Conversions', field: 'metrics.converted' },
    { header: 'Created', field: 'createdAt' },
  ];

  return generateCSV(sequences, columns);
}

/**
 * Export social posts to CSV
 *
 * @param {Object} options - Export options
 * @returns {Promise<string>} CSV string
 */
export async function exportSocialPostsToCSV(options = {}) {
  const {
    startDate,
    endDate,
    platform,
    status,
    limit = 1000,
  } = options;

  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (platform) {
    query.platform = platform;
  }
  if (status) {
    query.status = status;
  }

  const posts = await SocialPost.find(query)
    .limit(parseInt(limit))
    .select('content platform postType status scheduledAt publishedAt analytics')
    .sort({ createdAt: -1 })
    .lean();

  const columns = [
    { header: 'Platform', field: 'platform' },
    { header: 'Post Type', field: 'postType' },
    { header: 'Status', field: 'status' },
    { header: 'Content', field: 'content' },
    { header: 'Scheduled', field: 'scheduledAt' },
    { header: 'Published', field: 'publishedAt' },
    { header: 'Likes', field: 'analytics.likes' },
    { header: 'Comments', field: 'analytics.comments' },
    { header: 'Shares', field: 'analytics.shares' },
    { header: 'Clicks', field: 'analytics.clicks' },
    { header: 'Impressions', field: 'analytics.impressions' },
  ];

  return generateCSV(posts, columns);
}

/**
 * Export A/B tests to CSV
 *
 * @param {Object} options - Export options
 * @returns {Promise<string>} CSV string
 */
export async function exportABTestsToCSV(options = {}) {
  const {
    startDate,
    endDate,
    status,
    limit = 200,
  } = options;

  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (status) {
    query.status = status;
  }

  const tests = await ABTest.find(query)
    .limit(parseInt(limit))
    .select('name slug testType status winnerCriteria variants significance results createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const columns = [
    { header: 'Name', field: 'name' },
    { header: 'Test Type', field: 'testType' },
    { header: 'Status', field: 'status' },
    { header: 'Winner Criteria', field: 'winnerCriteria' },
    { header: 'Variants', field: 'variants' },
    { header: 'Significance', field: 'significance.isSignificant' },
    { header: 'Confidence', field: 'significance.confidenceLevel' },
    { header: 'Improvement', field: 'results.improvementPercentage' },
    { header: 'Created', field: 'createdAt' },
  ];

  return generateCSV(tests, columns);
}

// ============================================================================
// HTML REPORT GENERATION
// ============================================================================

/**
 * Generate HTML report
 *
 * @param {string} reportType - Type of report
 * @param {Object} data - Report data
 * @param {Object} options - Report options
 * @returns {string} HTML string
 */
export function generateHTMLReport(reportType, data, options = {}) {
  const {
    title = `${REPORT_TYPES[reportType] || 'Analytics Report'}`,
    startDate,
    endDate,
    logoUrl = 'https://ementech.co.ke/logo.png',
  } = options;

  const template = REPORT_TEMPLATES[reportType] || REPORT_TEMPLATES.overview;

  // Build HTML sections
  let sectionsHTML = '';

  template.sections.forEach(section => {
    sectionsHTML += `
      <div class="section">
        <h2>${section.title}</h2>
        ${renderSectionMetrics(section.metrics, data)}
      </div>
    `;
  });

  // Generate complete HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a56db 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .date-range {
      font-size: 14px;
      opacity: 0.9;
    }
    .section {
      padding: 30px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section h2 {
      font-size: 20px;
      color: #1a56db;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #1a56db;
      margin: 10px 0;
    }
    .metric-label {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-trend {
      font-size: 14px;
      margin-top: 5px;
    }
    .trend-up { color: #10b981; }
    .trend-down { color: #ef4444; }
    .trend-stable { color: #6b7280; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .funnel-bar {
      height: 30px;
      background: linear-gradient(to right, #1a56db, #3b82f6);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      margin: 5px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .chart-placeholder {
      background: #f3f4f6;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      color: #6b7280;
      margin: 20px 0;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <div class="date-range">
        ${startDate ? `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` : ''}
      </div>
      <div style="margin-top: 10px; font-size: 12px;">Generated: ${new Date().toLocaleString()}</div>
    </div>
    ${sectionsHTML}
    <div class="footer">
      <p>EmenTech Marketing Analytics Dashboard</p>
      <p>Report generated automatically by EmenTech Analytics System</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Render section metrics as HTML
 *
 * @param {Array} metricPath - Array of metric paths
 * @param {Object} data - Data object
 * @returns {string} HTML string
 */
function renderSectionMetrics(metricPaths, data) {
  let html = '';

  metricPaths.forEach(path => {
    if (typeof path === 'string') {
      const value = getNestedValue(data, path);
      html += renderMetricCard(path, value);
    } else if (typeof path === 'object' && path.metrics) {
      // Nested section
      html += `<h3>${path.title || 'Details'}</h3>`;
      html += renderSectionMetrics(path.metrics, data);
    }
  });

  return html;
}

/**
 * Get nested value from object
 *
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot notation path
 * @returns {*} Value at path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Render a single metric card
 *
 * @param {string} label - Metric label
 * @param {*} value - Metric value
 * @returns {string} HTML string
 */
function renderMetricCard(label, value) {
  if (value === null || value === undefined) {
    return '';
  }

  let displayValue = value;
  let trend = '';

  if (typeof value === 'number') {
    if (label.toLowerCase().includes('rate') || label.toLowerCase().includes('roi') || label.toLowerCase().includes('percentage')) {
      displayValue = `${value.toFixed(1)}%`;
      trend = value > 0 ? 'trend-up' : value < 0 ? 'trend-down' : 'trend-stable';
    } else if (label.toLowerCase().includes('revenue') || label.toLowerCase().includes('value')) {
      displayValue = formatCurrency(value);
    } else {
      displayValue = value.toLocaleString();
    }
  } else if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object') {
      // Array of objects - render as table
      return renderTable(label, value);
    } else {
      displayValue = value.join(', ');
    }
  } else if (typeof value === 'object') {
    // Object - render as key-value pairs
    const entries = Object.entries(value).filter(([k, v]) => v !== null && v !== undefined);
    if (entries.length === 0) return '';

    let subHtml = `<div class="metric-grid">`;
    entries.forEach(([key, val]) => {
      subHtml += renderMetricCard(key, val);
    });
    subHtml += '</div>';
    return subHtml;
  }

  const formattedLabel = label.replace(/([A-Z])/g, ' $1').trim();
  const labelSentence = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);

  return `
    <div class="metric-card">
      <div class="metric-value">${displayValue}</div>
      <div class="metric-label">${labelSentence}</div>
      ${trend ? `<div class="metric-trend ${trend}">${trend === 'trend-up' ? '↑' : trend === 'trend-down' ? '↓' : '→'}</div>` : ''}
    </div>
  `;
}

/**
 * Render a data table
 *
 * @param {string} title - Table title
 * @param {Array} data - Array of objects
 * @returns {string} HTML string
 */
function renderTable(title, data) {
  if (!data || data.length === 0) return '';

  const keys = Object.keys(data[0]);
  const nonSystemKeys = keys.filter(k => !k.startsWith('_'));

  let tableHTML = `<h3>${title}</h3><table><thead><tr>`;
  nonSystemKeys.forEach(key => {
    tableHTML += `<th>${key}</th>`;
  });
  tableHTML += `</tr></thead><tbody>`;

  data.forEach(row => {
    tableHTML += '<tr>';
    nonSystemKeys.forEach(key => {
      let cellValue = row[key];
      if (typeof cellValue === 'number') {
        if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percentage')) {
          cellValue = `${cellValue.toFixed(1)}%`;
        } else if (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('value')) {
          cellValue = formatCurrency(cellValue);
        } else {
          cellValue = cellValue.toLocaleString();
        }
      }
      tableHTML += `<td>${cellValue}</td>`;
    });
    tableHTML += '</tr>';
  });

  tableHTML += '</tbody></table>';
  return tableHTML;
}

/**
 * Format currency value
 *
 * @param {number} value - Value to format
 * @returns {string} Formatted currency
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(value);
}

// ============================================================================
// PDF REPORT GENERATION (SIMPLIFIED - HTML BASED)
// ============================================================================

/**
 * Generate PDF report
 *
 * @param {string} reportType - Type of report
 * @param {Object} data - Report data
 * @param {Object} options - Report options
 * @returns {Promise<Buffer>} PDF buffer (or HTML for now)
 */
export async function generatePDFReport(reportType, data, options = {}) {
  // For now, we'll generate HTML that can be converted to PDF
  // In production, you would use a library like puppeteer or pdfkit
  const html = generateHTMLReport(reportType, data, options);

  // Return HTML as a buffer (in production, convert to PDF)
  return Buffer.from(html);
}

/**
 * Generate comprehensive report data
 *
 * @param {string} reportType - Type of report
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Report data
 */
export async function generateReportData(reportType, startDate, endDate) {
  const data = {
    reportType,
    startDate,
    endDate,
    generatedAt: new Date(),
  };

  // Add date range
  data.dateRange = {
    start: startDate,
    end: endDate,
    days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
  };

  // Get analytics snapshots for the period
  const snapshots = await AnalyticsDashboard.getForRange(startDate, endDate, 'daily');
  const aggregated = AnalyticsDashboard.aggregateSnapshots(snapshots);

  // Get previous period for comparison
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - data.dateRange.days);

  const prevSnapshots = await AnalyticsDashboard.getForRange(prevStartDate, prevEndDate, 'daily');
  const previousAggregated = AnalyticsDashboard.aggregateSnapshots(prevSnapshots);

  // Add comparison
  data.comparison = {
    current: aggregated,
    previous: previousAggregated,
  };

  // Calculate growth rates
  data.growth = {
    leads: calculateGrowth(aggregated.leads?.total || 0, previousAggregated.leads?.total || 0),
    conversions: calculateGrowth(aggregated.leads?.converted || 0, previousAggregated.leads?.converted || 0),
    revenue: calculateGrowth(aggregated.revenue?.totalRevenue || 0, previousAggregated.revenue?.totalRevenue || 0),
    emailRate: calculateGrowth(aggregated.email?.openRate || 0, previousAggregated.email?.openRate || 0),
  };

  // Add detailed metrics based on report type
  switch (reportType) {
    case 'overview':
      data.leads = aggregated.leads;
      data.email = aggregated.email;
      data.sequences = aggregated.sequences;
      data.social = aggregated.social;
      data.abTests = aggregated.abTests;
      data.revenue = aggregated.revenue;
      data.funnel = aggregated.funnel;
      break;

    case 'leads':
      data.leads = aggregated.leads;
      // Get detailed lead breakdown
      data.leadDetails = await Lead.find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .select('name email company source status pipelineStage leadScore estimatedValue createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      break;

    case 'email':
    case 'campaigns':
      data.email = aggregated.email;
      // Get campaign details
      data.campaigns = await Campaign.find({
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { 'metrics.completedAt': { $gte: startDate, $lte: endDate } },
        ],
        archivedAt: null,
      })
        .select('name type category status metrics')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      break;

    case 'sequences':
      data.sequences = aggregated.sequences;
      // Get sequence details
      data.sequenceDetails = await Sequence.find({
        createdAt: { $gte: startDate, $lte: endDate },
        archivedAt: null,
      })
        .select('name type category status metrics steps')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      break;

    case 'social':
      data.social = aggregated.social;
      // Get post details
      data.postDetails = await SocialPost.find({
        publishedAt: { $gte: startDate, $lte: endDate },
        status: 'published',
      })
        .select('content platform postType analytics')
        .sort({ publishedAt: -1 })
        .limit(50)
        .lean();
      break;

    case 'abtests':
      data.abTests = aggregated.abTests;
      // Get test details
      data.testDetails = await ABTest.find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .select('name testType status variants significance results')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      break;

    case 'revenue':
      data.revenue = aggregated.revenue;
      break;

    case 'funnel':
      data.funnel = aggregated.funnel;
      break;
  }

  return data;
}

/**
 * Calculate growth percentage
 *
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Growth percentage
 */
function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

// ============================================================================
// SCHEDULED REPORT GENERATION
// ============================================================================

/**
 * Scheduled report configurations
 */
const scheduledReports = [];

/**
 * Schedule a report
 *
 * @param {Object} config - Report configuration
 * @returns {Object} Scheduled report info
 */
export function scheduleReport(config) {
  const {
    id = `report_${Date.now()}`,
    type,
    format = 'pdf',
    recipients = [],
    schedule = 'weekly', // 'daily', 'weekly', 'monthly'
    dayOfWeek = 1, // 0-6 (Sunday-Saturday)
    hour = 9, // 0-23
    enabled = true,
  } = config;

  const report = {
    id,
    type,
    format,
    recipients,
    schedule,
    dayOfWeek,
    hour,
    enabled,
    lastRun: null,
    nextRun: getNextRunDate(schedule, dayOfWeek, hour),
    createdAt: new Date(),
  };

  scheduledReports.push(report);

  return report;
}

/**
 * Get next run date based on schedule
 *
 * @param {string} schedule - Schedule type
 * @param {number} dayOfWeek - Day of week (for weekly)
 * @param {number} hour - Hour (0-23)
 * @returns {Date} Next run date
 */
function getNextRunDate(schedule, dayOfWeek, hour) {
  const now = new Date();
  const next = new Date(now);

  switch (schedule) {
    case 'daily':
      next.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      const currentDay = now.getDay();
      const daysUntil = (dayOfWeek - currentDay + 7) % 7;
      next.setDate(now.getDate() + daysUntil);
      break;
    case 'monthly':
      next.setMonth(now.getMonth() + 1);
      next.setDate(1);
      break;
  }

  next.setHours(hour, 0, 0, 0);
  return next;
}

/**
 * Get all scheduled reports
 *
 * @returns {Array} Scheduled reports
 */
export function getScheduledReports() {
  return scheduledReports.filter(r => r.enabled);
}

/**
 * Get scheduled report by ID
 *
 * @param {string} id - Report ID
 * @returns {Object|null} Report or null
 */
export function getScheduledReport(id) {
  return scheduledReports.find(r => r.id === id);
}

/**
 * Update scheduled report
 *
 * @param {string} id - Report ID
 * @param {Object} updates - Updates to apply
 * @returns {Object|null} Updated report or null
 */
export function updateScheduledReport(id, updates) {
  const report = scheduledReports.find(r => r.id === id);
  if (report) {
    Object.assign(report, updates);
    if (updates.schedule || updates.dayOfWeek !== undefined || updates.hour !== undefined) {
      report.nextRun = getNextRunDate(
        updates.schedule || report.schedule,
        updates.dayOfWeek !== undefined ? updates.dayOfWeek : report.dayOfWeek,
        updates.hour !== undefined ? updates.hour : report.hour
      );
    }
  }
  return report;
}

/**
 * Delete scheduled report
 *
 * @param {string} id - Report ID
 * @returns {boolean} Success status
 */
export function deleteScheduledReport(id) {
  const index = scheduledReports.findIndex(r => r.id === id);
  if (index !== -1) {
    scheduledReports.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Run scheduled reports that are due
 *
 * @returns {Promise<Array>} Results of run reports
 */
export async function runScheduledReports() {
  const now = new Date();
  const dueReports = scheduledReports.filter(r => r.enabled && r.nextRun <= now);

  const results = [];

  for (const report of dueReports) {
    try {
      // Generate report
      const endDate = new Date();
      let startDate = new Date();

      switch (report.schedule) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const reportData = await generateReportData(report.type, startDate, endDate);

      // Generate report in requested format
      let reportContent;
      switch (report.format) {
        case 'html':
          reportContent = generateHTMLReport(report.type, reportData, {
            startDate,
            endDate,
          });
          break;
        case 'csv':
          // For CSV, export based on type
          switch (report.type) {
            case 'leads':
              reportContent = await exportLeadsToCSV({ startDate, endDate });
              break;
            case 'campaigns':
              reportContent = await exportCampaignsToCSV({ startDate, endDate });
              break;
            default:
              reportContent = generateHTMLReport(report.type, reportData, {
                startDate,
                endDate,
              });
          }
          break;
        case 'json':
          reportContent = JSON.stringify({
            success: true,
            report: reportData,
            generatedAt: new Date().toISOString(),
          }, null, 2);
          break;
        default:
          reportContent = await generatePDFReport(report.type, reportData, {
            startDate,
            endDate,
          });
      }

      // Update next run time
      report.lastRun = now;
      report.nextRun = getNextRunDate(report.schedule, report.dayOfWeek, report.hour);

      results.push({
        reportId: report.id,
        type: report.type,
        format: report.format,
        success: true,
        generatedAt: now,
        nextRun: report.nextRun,
      });

      // Here you would send the report via email to recipients
      // await sendReportByEmail(report, reportContent);

    } catch (error) {
      console.error(`Error running report ${report.id}:`, error);
      results.push({
        reportId: report.id,
        type: report.type,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

// ============================================================================
// REPORT TEMPLATE MANAGEMENT
// ============================================================================

/**
 * Get report template
 *
 * @param {string} reportType - Type of report
 * @returns {Object} Report template
 */
export function getReportTemplate(reportType) {
  return REPORT_TEMPLATES[reportType] || REPORT_TEMPLATES.overview;
}

/**
 * Get all report templates
 *
 * @returns {Object} All report templates
 */
export function getAllReportTemplates() {
  return REPORT_TEMPLATES;
}

/**
 * Create custom report template
 *
 * @param {string} name - Template name
 * @param {Array} sections - Report sections
 * @returns {Object} Created template
 */
export function createCustomTemplate(name, sections) {
  const template = {
    name,
    sections,
    createdAt: new Date(),
  };

  REPORT_TEMPLATES.custom = template;

  return template;
}

// ============================================================================
// SAVE REPORT TO FILE
// ============================================================================

/**
 * Save report to file
 *
 * @param {string} filename - Filename
 * @param {string|Buffer} content - Report content
 * @param {string} format - File format ('pdf', 'csv', 'html', 'json')
 * @returns {Promise<string>} File path
 */
export async function saveReportToFile(filename, content, format = 'html') {
  const reportsDir = path.join(process.cwd(), 'reports');

  // Create reports directory if it doesn't exist
  try {
    await fs.mkdir(reportsDir, { recursive: true });
  } catch (error) {
    // Directory may already exist
  }

  const filepath = path.join(reportsDir, filename);
  await fs.writeFile(filepath, content, 'utf8');

  return filepath;
}

/**
 * Generate report filename
 *
 * @param {string} type - Report type
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} format - File format
 * @returns {string} Filename
 */
export function generateReportFilename(type, startDate, endDate, format = 'html') {
  const dateStr = startDate.toISOString().split('T')[0];
  const extension = format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'html';
  return `${type}_report_${dateStr}.${extension}`;
}

export default {
  // CSV Exports
  generateCSV,
  exportLeadsToCSV,
  exportCampaignsToCSV,
  exportSequencesToCSV,
  exportSocialPostsToCSV,
  exportABTestsToCSV,

  // Report Generation
  generateHTMLReport,
  generatePDFReport,
  generateReportData,

  // Scheduled Reports
  scheduleReport,
  getScheduledReports,
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  runScheduledReports,

  // Templates
  getReportTemplate,
  getAllReportTemplates,
  createCustomTemplate,

  // File Operations
  saveReportToFile,
  generateReportFilename,
};
