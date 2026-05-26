import mongoose from 'mongoose'

const AnalysisSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  sessionId: {
    type: String,
    required: true
  },
  scrapedData: {
    title: String,
    metaDescription: String,
    colors: [String],
    fonts: [String],
    headings: [String],
    navItems: [String],
    ctaButtons: [String],
    sections: [String],
    htmlSnippet: String,
    screenshotUrl: String
  },
  aiAnalysis: {
    designStrategy: mongoose.Schema.Types.Mixed,
    targetAudience: mongoose.Schema.Types.Mixed,
    colorSystem: mongoose.Schema.Types.Mixed,
    typography: mongoose.Schema.Types.Mixed,
    conversionTechniques: [mongoose.Schema.Types.Mixed],
    uxStrengths: [String],
    uxWeaknesses: [String],
    componentBreakdown: [mongoose.Schema.Types.Mixed],
    roastMode: mongoose.Schema.Types.Mixed,
    redesignSuggestions: mongoose.Schema.Types.Mixed
  },
  generatedCode: {
    html: String,
    css: String,
    reactComponent: String
  },
  status: {
    type: String,
    enum: ['pending', 'scraping', 'analyzing', 'generating', 'complete', 'failed'],
    default: 'pending'
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  }
})

export default mongoose.model('Analysis', AnalysisSchema)