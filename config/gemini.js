import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

export const analyzeWebsiteWithAI = async (websiteData) => {
  const model = getGeminiModel()

  const prompt = `
You are PhantomTwin, an expert AI system that reverse-engineers websites and digital products.

Analyze the following website data and return a detailed JSON response.

Website URL: ${websiteData.url}
Page Title: ${websiteData.title}
Meta Description: ${websiteData.metaDescription}
Detected Colors: ${JSON.stringify(websiteData.colors)}
Detected Fonts: ${JSON.stringify(websiteData.fonts)}
Headings: ${JSON.stringify(websiteData.headings)}
Navigation Items: ${JSON.stringify(websiteData.navItems)}
CTA Buttons: ${JSON.stringify(websiteData.ctaButtons)}
Page Sections: ${JSON.stringify(websiteData.sections)}
HTML Snippet: ${websiteData.htmlSnippet}

Return ONLY a valid JSON object with this exact structure:
{
  "designStrategy": {
    "summary": "2-3 sentence overview of the site's design philosophy",
    "designStyle": "e.g. Minimalist SaaS / Bold Consumer / Enterprise / etc.",
    "primaryGoal": "What the site is trying to achieve"
  },
  "targetAudience": {
    "primary": "Main target user",
    "secondary": "Secondary user if any",
    "insights": "Why this design appeals to that audience"
  },
  "colorSystem": {
    "mood": "e.g. trustworthy, energetic, premium",
    "strategy": "How colors are used strategically",
    "palette": []
  },
  "typography": {
    "style": "e.g. Clean and modern / Authoritative serif",
    "strategy": "How typography reinforces the brand"
  },
  "conversionTechniques": [
    { "technique": "name", "description": "how it works on this site" }
  ],
  "uxStrengths": [
    "strength 1", "strength 2", "strength 3"
  ],
  "uxWeaknesses": [
    "weakness 1", "weakness 2"
  ],
  "componentBreakdown": [
    { "name": "component name", "purpose": "what it does", "notableDetail": "interesting implementation note" }
  ],
  "roastMode": {
    "overallRating": 7,
    "verdict": "Honest one-liner verdict",
    "biggestMistake": "The most critical UX mistake",
    "hiddenGem": "Something they did surprisingly well"
  },
  "redesignSuggestions": {
    "futuristic": "How to make it futuristic",
    "minimalistSaaS": "How to make it minimalist SaaS",
    "cyberpunk": "How to make it cyberpunk"
  }
}
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}