/**
 * Linkup Service: Web search for factual Q&A
 */

import { LinkupClient } from 'linkup-sdk'
import { config } from '../../shared/config'
import { logger } from '../../shared/logger'

let linkupClient: LinkupClient | null = null

/**
 * Get or create Linkup client
 */
function getClient(): LinkupClient {
  if (!linkupClient) {
    if (!config.linkupApiKey) {
      throw new Error('LINKUP_API_KEY not configured')
    }
    linkupClient = new LinkupClient({ apiKey: config.linkupApiKey })
  }
  return linkupClient
}

/**
 * Search the web for information
 */
export async function searchWeb(query: string): Promise<string> {
  try {
    logger.debug(`🔍 Searching web for: "${query}"`)
    
    const client = getClient()
    
    const response = await client.search({
      query,
      depth: 'standard',
      outputType: 'searchResults',
      includeImages: false,
    })
    
    // Extract relevant information from search results
    if (!response || !response.results || response.results.length === 0) {
      logger.warn('No search results found')
      return 'No relevant information found.'
    }
    
    // Combine top results into context
    const context = response.results
      .slice(0, 3) // Use top 3 results
      .map((result: any, i: number) => {
        const title = result.name || result.title || 'Result'
        const snippet = result.content || result.snippet || ''
        return `[${i + 1}] ${title}: ${snippet}`
      })
      .join('\n\n')
    
    logger.success(`Found ${response.results.length} search results`)
    
    return context
  } catch (error) {
    logger.error('Linkup search error:', error)
    throw error
  }
}

/**
 * Check if query needs web search (complex explanations, not simple facts)
 */
export function shouldUseWebSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  
  // SIMPLE questions that DON'T need web search (LLM knows these)
  const simpleFactPatterns = [
    // Simple geography
    'capital of', 'capital de',
    
    // Simple definitions
    'what is', 'qué es', 'define',
    
    // Simple "who is" when asking about concepts
    'who is' // But we'll check word count
  ]
  
  // Check if it's a simple fact (short query)
  const wordCount = query.split(' ').length
  
  // If it's a very short query (< 10 words) about simple facts, don't use web search
  if (wordCount < 10) {
    for (const pattern of simpleFactPatterns) {
      if (lowerQuery.includes(pattern)) {
        logger.debug('Simple factual query detected, using LLM only')
        return false
      }
    }
  }
  
  // COMPLEX queries that NEED web search
  const complexIndicators = [
    // Explanation requests
    'explain', 'explica', 'explain how', 'explain why',
    'how does', 'cómo funciona', 'how do',
    
    // Detailed information
    'tell me about', 'dime sobre', 'information about',
    'details about', 'detalles sobre',
    
    // Current/recent data
    'latest', 'recent', 'current', 'news', 'today',
    'revenue', 'earnings', 'profit', 'financial',
    '2024', '2025', 'this year',
    
    // Comparison or analysis
    'compare', 'compara', 'difference between', 'diferencia entre',
    'better', 'mejor', 'best', 'worst',
    
    // Complex topics
    'how to', 'cómo', 'step by step', 'guide', 'tutorial'
  ]
  
  // Use web search for complex queries
  const needsSearch = complexIndicators.some(indicator => lowerQuery.includes(indicator))
  
  if (needsSearch) {
    logger.debug('Complex query detected, using Linkup web search')
  }
  
  return needsSearch
}

