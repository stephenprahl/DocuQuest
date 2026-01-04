import { CheerioAPI, load } from 'cheerio'
import { URL } from 'url'

export interface ScrapedPage {
  url: string
  title: string
  content: string
  metadata: {
    description?: string
    headings: string[]
    links: string[]
    images: string[]
  }
}

export interface ScrapingOptions {
  maxDepth?: number
  maxPages?: number
  followExternalLinks?: boolean
  selectors?: {
    content?: string
    title?: string
    description?: string
    navigation?: string
  }
}

export class WebScraper {
  private visitedUrls = new Set<string>()
  private baseUrl: URL
  private options: Required<ScrapingOptions>

  constructor(baseUrl: string, options: ScrapingOptions = {}) {
    this.baseUrl = new URL(baseUrl)
    this.options = {
      maxDepth: options.maxDepth || 2,
      maxPages: options.maxPages || 50,
      followExternalLinks: options.followExternalLinks || false,
      selectors: {
        content: options.selectors?.content || 'main, article, .content, .documentation, #content',
        title: options.selectors?.title || 'title, h1',
        description: options.selectors?.description || 'meta[name="description"], meta[property="og:description"]',
        navigation: options.selectors?.navigation || 'nav, .navigation, .menu, .sidebar'
      }
    }
  }

  async scrape(): Promise<ScrapedPage[]> {
    const results: ScrapedPage[] = []
    
    await this.scrapePage(this.baseUrl.toString(), 0, results)
    
    return results
  }

  private async scrapePage(url: string, depth: number, results: ScrapedPage[]): Promise<void> {
    if (depth > this.options.maxDepth || 
        results.length >= this.options.maxPages || 
        this.visitedUrls.has(url)) {
      return
    }

    this.visitedUrls.add(url)

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DocuQuest Web Scraper 1.0 (Educational Purpose)'
        }
      })

      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: ${response.status}`)
        return
      }

      const html = await response.text()
      const $ = load(html)
      
      const scrapedPage = this.extractContent($, url)
      results.push(scrapedPage)

      // Find and scrape linked pages
      if (depth < this.options.maxDepth) {
        const links = this.findLinks($)
        for (const link of links) {
          await this.scrapePage(link, depth + 1, results)
        }
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
    }
  }

  private extractContent($: CheerioAPI, url: string): ScrapedPage {
    // Extract title
    const title = $(this.options.selectors.title).first().text().trim() || 
                  $('title').text().trim() || 
                  'Untitled'

    // Extract description
    const description = $(this.options.selectors.description).first().attr('content') ||
                        $(this.options.selectors.description).first().text().trim() ||
                        ''

    // Extract main content
    const contentElement = $(this.options.selectors.content).first()
    const content = contentElement.length ? contentElement.text().trim() : $('body').text().trim()

    // Extract headings
    const headings: string[] = []
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const heading = $(el).text().trim()
      if (heading) headings.push(heading)
    })

    // Extract links
    const links: string[] = []
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) links.push(href)
    })

    // Extract images
    const images: string[] = []
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src')
      if (src) images.push(src)
    })

    return {
      url,
      title,
      content: this.cleanContent(content),
      metadata: {
        description,
        headings,
        links: links.slice(0, 50), // Limit links
        images: images.slice(0, 20) // Limit images
      }
    }
  }

  private findLinks($: CheerioAPI): string[] {
    const links: string[] = []
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      try {
        const absoluteUrl = new URL(href, this.baseUrl).toString()
        
        // Only follow links from the same domain unless external links are allowed
        if (this.options.followExternalLinks || this.isSameDomain(absoluteUrl)) {
          // Skip common non-content links
          if (!this.isNonContentLink(absoluteUrl)) {
            links.push(absoluteUrl)
          }
        }
      } catch (error) {
        // Invalid URL, skip
      }
    })

    return links
  }

  private isSameDomain(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === this.baseUrl.hostname
    } catch {
      return false
    }
  }

  private isNonContentLink(url: string): boolean {
    const nonContentPatterns = [
      /#/, // Anchor links
      /\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico)$/i, // Files
      /\/login/i,
      /\/register/i,
      /\/logout/i,
      /\/admin/i,
      /\/api\//i,
      /mailto:/i,
      /tel:/i
    ]

    return nonContentPatterns.some(pattern => pattern.test(url))
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Multiple whitespace to single space
      .replace(/\n\s*\n/g, '\n') // Multiple newlines to single
      .trim()
  }
}

export async function scrapeWebsite(url: string, options?: ScrapingOptions): Promise<ScrapedPage[]> {
  const scraper = new WebScraper(url, options)
  return await scraper.scrape()
}
