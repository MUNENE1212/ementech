import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  // ========== Time Period ==========
  period: {
    type: String,
    required: true,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly']
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  dateRange: {
    start: Date,
    end: Date
  },

  // ========== Traffic Metrics ==========
  traffic: {
    visits: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    pageViews: {
      type: Number,
      default: 0
    },
    returningVisitors: {
      type: Number,
      default: 0
    },
    newVisitors: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avgSessionDuration: {
      type: Number,
      default: 0
    }, // in seconds
    avgPagesPerSession: {
      type: Number,
      default: 0
    }
  },

  // ========== Traffic Sources ==========
  sources: {
    organic: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    direct: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    referral: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    social: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    email: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    paid: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    other: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }
  },

  // ========== Lead Generation Metrics ==========
  leads: {
    total: {
      type: Number,
      default: 0
    },
    new: {
      type: Number,
      default: 0
    },
    qualified: {
      type: Number,
      default: 0
    },
    converted: {
      type: Number,
      default: 0
    },
    bySource: {
      newsletter: { type: Number, default: 0 },
      event: { type: Number, default: 0 },
      download: { type: Number, default: 0 },
      chatbot: { type: Number, default: 0 },
      contact: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },

  // ========== Conversion Funnel ==========
  funnel: {
    visitors: {
      type: Number,
      default: 0
    },
    engaged: {
      type: Number,
      default: 0
    }, // Engaged with content
    leads: {
      type: Number,
      default: 0
    }, // Submitted email/form
    qualified: {
      type: Number,
      default: 0
    }, // Met qualification criteria
    opportunities: {
      type: Number,
      default: 0
    }, // Sales qualified
    converted: {
      type: Number,
      default: 0
    } // Became customer
  },

  // ========== Content Performance ==========
  content: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueDownloads: {
      type: Number,
      default: 0
    },
    topContent: [{
      contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
      },
      title: String,
      views: Number,
      downloads: Number,
      leadsGenerated: Number
    }],
    avgTimeOnPage: {
      type: Number,
      default: 0
    }
  },

  // ========== Event Performance ==========
  events: {
    total: {
      type: Number,
      default: 0
    },
    upcoming: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    totalRegistrations: {
      type: Number,
      default: 0
    },
    totalAttendees: {
      type: Number,
      default: 0
    },
    attendanceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    leadsGenerated: {
      type: Number,
      default: 0
    }
  },

  // ========== Chatbot/AI Metrics ==========
  chatbot: {
    totalConversations: {
      type: Number,
      default: 0
    },
    activeConversations: {
      type: Number,
      default: 0
    },
    qualifiedLeads: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    avgMessagesPerConversation: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    avgResolutionTime: {
      type: Number,
      default: 0
    },
    satisfactionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // ========== Newsletter Performance ==========
  newsletter: {
    totalSubscribers: {
      type: Number,
      default: 0
    },
    newSubscribers: {
      type: Number,
      default: 0
    },
    unsubscribes: {
      type: Number,
      default: 0
    },
    emailsSent: {
      type: Number,
      default: 0
    },
    openRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    clickRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    bounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // ========== Lead Scoring Distribution ==========
  leadScoreDistribution: [{
    range: String, // '0-20', '21-40', etc.
    count: Number
  }],

  // ========== Geographic Data ==========
  geography: [{
    country: String,
    city: String,
    visits: Number,
    leads: Number,
    conversions: Number
  }],

  // ========== Device/Browser Data ==========
  devices: {
    desktop: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    mobile: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    tablet: {
      visits: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }
  },

  // ========== Top Performing Channels ==========
  topChannels: [{
    channel: String,
    visits: Number,
    leads: Number,
    conversions: Number,
    revenue: Number,
    cost: Number,
    roi: Number
  }],

  // ========== Goals/Target Performance ==========
  goals: {
    leadTarget: Number,
    leadsAchieved: Number,
    conversionTarget: Number, // percentage
    conversionAchieved: Number,
    revenueTarget: Number,
    revenueAchieved: Number
  },

  // ========== Custom Metrics ==========
  customMetrics: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// ========== Indexes ==========
analyticsSchema.index({ period: 1, date: -1 });
// Note: date field already has index from schema definition (line 13)

// ========== Virtuals ==========
analyticsSchema.virtual('conversionRate').get(function() {
  const totalVisitors = this.funnel.visitors || 0;
  const totalLeads = this.funnel.leads || 0;
  return totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100).toFixed(2) : 0;
});

analyticsSchema.virtual('leadToQualifiedRate').get(function() {
  const totalLeads = this.funnel.leads || 0;
  const totalQualified = this.funnel.qualified || 0;
  return totalLeads > 0 ? ((totalQualified / totalLeads) * 100).toFixed(2) : 0;
});

analyticsSchema.virtual('qualifiedToConvertedRate').get(function() {
  const totalQualified = this.funnel.qualified || 0;
  const totalConverted = this.funnel.converted || 0;
  return totalQualified > 0 ? ((totalConverted / totalQualified) * 100).toFixed(2) : 0;
});

analyticsSchema.virtual('totalTraffic').get(function() {
  return Object.values(this.sources).reduce((sum, source) => sum + source.visits, 0);
});

analyticsSchema.virtual('goalProgress').get(function() {
  if (!this.goals.leadTarget) return null;
  return {
    leads: this.goals.leadTarget > 0 ? ((this.goals.leadsAchieved / this.goals.leadTarget) * 100).toFixed(2) : 0,
    conversion: this.goals.conversionTarget > 0 ? ((this.goals.conversionAchieved / this.goals.conversionTarget) * 100).toFixed(2) : 0,
    revenue: this.goals.revenueTarget > 0 ? ((this.goals.revenueAchieved / this.goals.revenueTarget) * 100).toFixed(2) : 0
  };
});

// ========== Static Methods ==========

// Aggregate daily statistics
analyticsSchema.statics.aggregateDaily = async function(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const Interaction = mongoose.model('Interaction');
  const Lead = mongoose.model('Lead');
  const Content = mongoose.model('Content');
  const AIConversation = mongoose.model('AIConversation');

  // Get interactions for the day
  const interactions = await Interaction.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  // Get leads created
  const leadsCreated = await Lead.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  // Get leads qualified
  const leadsQualified = await Lead.countDocuments({
    qualifiedAt: { $gte: startOfDay, $lte: endOfDay }
  });

  // Get unique visitors
  const uniqueVisitors = await Interaction.distinct('sessionId', {
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  // Get page views
  const pageViews = await Interaction.countDocuments({
    eventType: 'page_view',
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  // Calculate traffic sources
  const sources = {
    organic: { visits: 0, conversions: 0 },
    direct: { visits: 0, conversions: 0 },
    referral: { visits: 0, conversions: 0 },
    social: { visits: 0, conversions: 0 },
    email: { visits: 0, conversions: 0 },
    paid: { visits: 0, conversions: 0 },
    other: { visits: 0, conversions: 0 }
  };

  interactions.forEach(interaction => {
    const source = interaction.utmSource || 'other';
    if (sources[source]) {
      sources[source].visits++;
      if (interaction.impactScore > 20) {
        sources[source].conversions++;
      }
    }
  });

  // Get lead sources
  const leadsBySource = await Lead.aggregate([
    { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    }
  ]);

  const leadSourceMap = {
    newsletter: 0,
    event: 0,
    download: 0,
    chatbot: 0,
    contact: 0,
    other: 0
  };

  leadsBySource.forEach(item => {
    if (leadSourceMap.hasOwnProperty(item._id)) {
      leadSourceMap[item._id] = item.count;
    } else {
      leadSourceMap.other += item.count;
    }
  });

  // Create or update analytics record
  const analytics = await this.findOneAndUpdate(
    { period: 'daily', date: startOfDay },
    {
      $set: {
        traffic: {
          visits: uniqueVisitors.length,
          uniqueVisitors: uniqueVisitors.length,
          pageViews,
          newVisitors: uniqueVisitors.length, // Simplified
          bounceRate: 0, // Calculate based on single-page sessions
          avgSessionDuration: 0, // Calculate from interactions
          avgPagesPerSession: pageViews / uniqueVisitors.length || 0
        },
        sources,
        leads: {
          total: leadsCreated,
          new: leadsCreated,
          qualified: leadsQualified,
          converted: 0, // Would need to track conversions separately
          bySource: leadSourceMap
        },
        dateRange: {
          start: startOfDay,
          end: endOfDay
        }
      }
    },
    { upsert: true, new: true }
  );

  return analytics;
};

// Get analytics for date range
analyticsSchema.statics.getForRange = async function(startDate, endDate, period = 'daily') {
  return await this.find({
    period,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  })
    .sort({ date: 1 })
    .lean();
};

// Get dashboard summary
analyticsSchema.statics.getDashboardSummary = async function(days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const analytics = await this.find({
    date: { $gte: startDate, $lte: endDate }
  })
    .sort({ date: -1 })
    .lean();

  if (analytics.length === 0) {
    return {
      totalVisits: 0,
      totalLeads: 0,
      totalQualified: 0,
      avgConversionRate: 0,
      topSource: null
    };
  }

  const totalVisits = analytics.reduce((sum, a) => sum + (a.traffic?.visits || 0), 0);
  const totalLeads = analytics.reduce((sum, a) => sum + (a.leads?.total || 0), 0);
  const totalQualified = analytics.reduce((sum, a) => sum + (a.leads?.qualified || 0), 0);

  return {
    totalVisits,
    totalLeads,
    totalQualified,
    avgConversionRate: totalVisits > 0 ? ((totalLeads / totalVisits) * 100).toFixed(2) : 0,
    topSource: this.getTopSource(analytics),
    trend: this.getTrend(analytics)
  };
};

// Get top performing source
analyticsSchema.statics.getTopSource = function(analytics) {
  const sourceTotals = {};

  analytics.forEach(a => {
    Object.entries(a.sources || {}).forEach(([source, data]) => {
      if (!sourceTotals[source]) {
        sourceTotals[source] = { visits: 0, conversions: 0 };
      }
      sourceTotals[source].visits += data.visits;
      sourceTotals[source].conversions += data.conversions;
    });
  });

  const topSource = Object.entries(sourceTotals)
    .sort(([, a], [, b]) => b.visits - a.visits)[0];

  return topSource ? { source: topSource[0], ...topSource[1] } : null;
};

// Get trend (comparing recent to previous)
analyticsSchema.statics.getTrend = function(analytics) {
  if (analytics.length < 2) return { direction: 'stable', change: 0 };

  const recent = analytics.slice(0, Math.ceil(analytics.length / 2));
  const previous = analytics.slice(Math.ceil(analytics.length / 2));

  const recentLeads = recent.reduce((sum, a) => sum + (a.leads?.total || 0), 0);
  const previousLeads = previous.reduce((sum, a) => sum + (a.leads?.total || 0), 0);

  if (previousLeads === 0) {
    return { direction: 'up', change: 100 };
  }

  const change = ((recentLeads - previousLeads) / previousLeads) * 100;

  return {
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    change: change.toFixed(2)
  };
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
