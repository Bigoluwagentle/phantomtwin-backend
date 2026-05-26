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
You are PhantomTwin, an expert frontend engineer. Based on this website analysis, generate clean React component code.

Website: ${analysis.url}
Design Style: ${analysis.aiAnalysis?.designStrategy?.designStyle}
Color Mood: ${analysis.aiAnalysis?.colorSystem?.mood}
Target Audience: ${analysis.aiAnalysis?.targetAudience?.primary}
Headings found: ${JSON.stringify(analysis.scrapedData?.headings)}
Nav Items: ${JSON.stringify(analysis.scrapedData?.navItems)}
CTA Buttons: ${JSON.stringify(analysis.scrapedData?.ctaButtons)}
UX Strengths: ${JSON.stringify(analysis.aiAnalysis?.uxStrengths)}
Component Breakdown: ${JSON.stringify(analysis.aiAnalysis?.componentBreakdown)}

Generate a complete React component that recreates the essence of this website.
Use inline styles only — no external CSS files or Tailwind.
Make it visually accurate to the original design style.
Include a Navbar, Hero section, Features section, and Footer.
Use real content from the headings and nav items above.

Return ONLY a valid JSON object with this structure:
{
  "reactComponent": "full React JSX component code as a string",
  "css": "additional CSS string if needed",
  "componentList": [
    { "name": "ComponentName", "description": "what it does", "code": "jsx code string" }
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