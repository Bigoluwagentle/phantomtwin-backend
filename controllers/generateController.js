import Analysis from '../models/Analysis.js'
import { getGeminiModel } from '../config/gemini.js'

export const generateCode = async (req, res) => {
  const { sessionId } = req.params

  try {
    const analysis = await Analysis.findOne({ sessionId })

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    if (analysis.status !== 'complete') {
      return res.status(400).json({ error: 'Analysis not complete yet', status: analysis.status })
    }

    if (analysis.generatedCode?.reactComponent) {
      return res.json({ success: true, code: analysis.generatedCode })
    }

    await Analysis.findOneAndUpdate({ sessionId }, { status: 'generating' })

    const model = getGeminiModel()

    const prompt = `
      You are PhantomTwin, an expert frontend engineer. Generate COMPLETE, FULLY IMPLEMENTED React components.

      CRITICAL RULES:
      - Write EVERY line of code in full
      - NO placeholder comments like /* ... */ or // implementation here
      - NO empty function bodies
      - Every component must have complete JSX and inline styles
      - Components must be visually accurate to the original site

      Website: ${analysis.url}
      Design Style: ${analysis.aiAnalysis?.designStrategy?.designStyle}
      Color Mood: ${analysis.aiAnalysis?.colorSystem?.mood}
      Target Audience: ${analysis.aiAnalysis?.targetAudience?.primary}
      Headings: ${JSON.stringify(analysis.scrapedData?.headings)}
      Nav Items: ${JSON.stringify(analysis.scrapedData?.navItems)}
      CTA Buttons: ${JSON.stringify(analysis.scrapedData?.ctaButtons)}
      UX Strengths: ${JSON.stringify(analysis.aiAnalysis?.uxStrengths)}

      Generate these 4 fully implemented components using ONLY inline styles:

      1. Navbar - with logo, nav links, and CTA button
      2. HeroSection - with headline, subtext, and CTA
      3. FeaturesSection - with feature cards grid
      4. Footer - with links and copyright

      Return ONLY a valid JSON object, no markdown, no backticks:
      {
        "reactComponent": "complete App component that imports and renders all 4 components as one string",
        "css": "",
        "componentList": [
          { "name": "Navbar", "description": "top navigation", "code": "complete full navbar jsx code as string" },
          { "name": "HeroSection", "description": "hero section", "code": "complete full hero jsx code as string" },
          { "name": "FeaturesSection", "description": "features grid", "code": "complete full features jsx code as string" },
          { "name": "Footer", "description": "footer", "code": "complete full footer jsx code as string" }
        ]
      }
    
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    const cleaned = text.replace(/```json|```/g, '').trim()
    const generatedCode = JSON.parse(cleaned)

    await Analysis.findOneAndUpdate(
      { sessionId },
      {
        status: 'complete',
        generatedCode: {
          reactComponent: generatedCode.reactComponent,
          css: generatedCode.css || '',
        }
      }
    )

    res.json({ success: true, code: generatedCode })
  } catch (error) {
    await Analysis.findOneAndUpdate({ sessionId }, { status: 'failed', errorMessage: error.message })
    res.status(500).json({ error: error.message })
  }
}