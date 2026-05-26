import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import axios from 'axios'
import Analysis from '../models/Analysis.js'
import { analyzeWebsiteWithAI } from '../config/gemini.js'

const scrapeWebsite = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    const $ = cheerio.load(response.data)

    const title = $('title').text().trim()
    const metaDescription = $('meta[name="description"]').attr('content') || ''

    const colors = []
    $('[style]').each((_, el) => {
      const style = $(el).attr('style')
      const colorMatches = style.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)/g)
      if (colorMatches) colors.push(...colorMatches)
    })

    const fonts = []
    $('link[href*="fonts.googleapis.com"]').each((_, el) => {
      fonts.push($(el).attr('href'))
    })

    const headings = []
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length < 200) headings.push(text)
    })

    const navItems = []
    $('nav a, header a').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length < 50) navItems.push(text)
    })

    const ctaButtons = []
    $('button, a.btn, a.cta, .button, [class*="btn"], [class*="cta"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length < 80) ctaButtons.push(text)
    })

    const sections = []
    $('section, [class*="section"], [id*="section"]').each((_, el) => {
      const id = $(el).attr('id') || $(el).attr('class') || ''
      if (id) sections.push(id.slice(0, 100))
    })

    const htmlSnippet = response.data.slice(0, 3000)

    return {
      title,
      metaDescription,
      colors: [...new Set(colors)].slice(0, 20),
      fonts,
      headings: headings.slice(0, 15),
      navItems: [...new Set(navItems)].slice(0, 15),
      ctaButtons: [...new Set(ctaButtons)].slice(0, 10),
      sections: sections.slice(0, 10),
      htmlSnippet
    }
  } catch (error) {
    throw new Error(`Failed to scrape website: ${error.message}`)
  }
}

export const startAnalysis = async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  let formattedUrl = url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    formattedUrl = `https://${url}`
  }

  try {
    new URL(formattedUrl)
  } catch {
    return res.status(400).json({ error: 'Invalid URL provided' })
  }

  const sessionId = uuidv4()

  const analysis = new Analysis({
    url: formattedUrl,
    sessionId,
    status: 'pending'
  })

  await analysis.save()

  res.json({
    success: true,
    sessionId,
    analysisId: analysis._id,
    message: 'Analysis started'
  })

  runAnalysisPipeline(analysis._id, formattedUrl)
}

const runAnalysisPipeline = async (analysisId, url) => {
  try {
    await Analysis.findByIdAndUpdate(analysisId, { status: 'scraping' })
    const scrapedData = await scrapeWebsite(url)

    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'analyzing',
      scrapedData
    })

    const aiAnalysis = await analyzeWebsiteWithAI({ url, ...scrapedData })

    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'complete',
      aiAnalysis
    })
  } catch (error) {
    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'failed',
      errorMessage: error.message
    })
  }
}

export const getAnalysisStatus = async (req, res) => {
  try {
    const { sessionId } = req.params
    const analysis = await Analysis.findOne({ sessionId })

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    res.json({
      status: analysis.status,
      sessionId: analysis.sessionId,
      url: analysis.url,
      scrapedData: analysis.scrapedData,
      aiAnalysis: analysis.aiAnalysis,
      errorMessage: analysis.errorMessage,
      createdAt: analysis.createdAt
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}