import Analysis from '../models/Analysis.js'
import { getGeminiModel } from '../config/gemini.js'

const stylePrompts = {
  futuristic: `Ultra-modern UI with dark backgrounds (#0a0a0f), electric blue and cyan accents (#00d4ff, #7c3aed), glowing borders, sharp geometric shapes, monospace fonts for labels, and a high-tech spaceship aesthetic.`,
  cyberpunk: `Cyberpunk aesthetic with near-black background (#0d0d0d), neon pink and yellow accents (#ff2d78, #ffd700), glitch effects in comments, aggressive typography, grid overlays, and a dystopian urban feel.`,
  apple: `Apple-inspired design with pure white backgrounds, SF Pro-like clean sans-serif fonts, minimal elements, generous whitespace, subtle grey borders (#e5e5e7), blue CTAs (#0071e3), and premium product photography placeholders.`,
  gaming: `Gaming UI with dark navy background (#0f0f1a), bright green and orange accents (#00ff88, #ff6b00), bold chunky typography, angular button shapes, XP bars, achievement badges, and an esports tournament feel.`,
  minimalistSaas: `Minimalist SaaS with white/off-white backgrounds (#fafafa), single accent color (#6366f1), clean Inter-like typography, lots of whitespace, subtle card shadows, simple icons, and a calm productivity tool feel.`
}

export const redesignWebsite = async (req, res) => {
  const { sessionId } = req.params
  const { style } = req.body

  if (!stylePrompts[style]) {
    return res.status(400).json({
      error: 'Invalid style. Choose from: futuristic, cyberpunk, apple, gaming, minimalistSaas'
    })
  }

  try {
    const analysis = await Analysis.findOne({ sessionId })

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    if (analysis.status !== 'complete') {
      return res.status(400).json({ error: 'Analysis not complete yet' })
    }

    const model = getGeminiModel()

    const prompt = `
You are PhantomTwin's Redesign Engine. Take this website and completely reimagine it in a new visual style.

Original Website: ${analysis.url}
Original Design Style: ${analysis.aiAnalysis?.designStrategy?.designStyle}
Headings: ${JSON.stringify(analysis.scrapedData?.headings)}
Nav Items: ${JSON.stringify(analysis.scrapedData?.navItems)}
CTA Buttons: ${JSON.stringify(analysis.scrapedData?.ctaButtons)}

NEW STYLE TO APPLY: ${style.toUpperCase()}
Style Description: ${stylePrompts[style]}

Generate a completely restyled React component that keeps the same content and structure
but applies the new visual style aggressively and completely.
Use only inline styles. Make it dramatic and visually striking.
Include Navbar, Hero, Features, and Footer sections.

Return ONLY a valid JSON object:
{
  "style": "${style}",
  "reactComponent": "full restyled React JSX component as a string",
  "styleNotes": "2-3 sentences explaining the design decisions made"
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    const cleaned = text.replace(/```json|```/g, '').trim()
    const redesigned = JSON.parse(cleaned)

    res.json({ success: true, redesign: redesigned })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}