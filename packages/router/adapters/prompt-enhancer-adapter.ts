/**
 * Prompt Enhancer Adapter: Enhances basic prompts into detailed, comprehensive ones
 * Focused on AI/ML, development, DevOps, and systems engineering best practices
 */

import { AdapterInput, AdapterOutput } from '../types'
import { logger } from '../../shared/logger'
import { createLLMProvider } from '../../codegen/providers'

interface PromptEnhancementRequest {
  action: 'enhance' | 'analyze' | 'examples'
  domain?: 'ai_ml' | 'development' | 'devops' | 'systems' | 'general'
  complexity?: 'basic' | 'intermediate' | 'advanced'
  context?: string
}

interface EnhancedPrompt {
  original: string
  enhanced: string
  improvements: string[]
  bestPractices: string[]
  examples: string[]
  domain: string
  complexity: string
}

export class PromptEnhancerAdapter {
  private readonly domainTemplates = {
    ai_ml: {
      context: "You are working with AI/ML systems, models, and algorithms. Consider data quality, model performance, bias, interpretability, and scalability.",
      bestPractices: [
        "Specify data requirements and constraints",
        "Define success metrics and evaluation criteria",
        "Consider model interpretability and bias",
        "Include error handling and edge cases",
        "Specify computational requirements and constraints"
      ]
    },
    development: {
      context: "You are working on software development, code architecture, and implementation. Focus on clean code, maintainability, and best practices.",
      bestPractices: [
        "Define clear requirements and acceptance criteria",
        "Specify coding standards and conventions",
        "Include error handling and logging",
        "Consider performance and scalability",
        "Include testing and documentation requirements"
      ]
    },
    devops: {
      context: "You are working with DevOps, infrastructure, deployment, and automation. Focus on reliability, security, and operational excellence.",
      bestPractices: [
        "Define infrastructure requirements and constraints",
        "Specify deployment strategies and rollback plans",
        "Include monitoring and alerting requirements",
        "Consider security and compliance needs",
        "Define backup and disaster recovery procedures"
      ]
    },
    systems: {
      context: "You are working with system architecture, distributed systems, and complex technical systems. Focus on scalability, reliability, and performance.",
      bestPractices: [
        "Define system boundaries and interfaces",
        "Specify performance and scalability requirements",
        "Include fault tolerance and resilience patterns",
        "Consider data consistency and synchronization",
        "Define monitoring and observability requirements"
      ]
    },
    general: {
      context: "You are working on a general technical task. Apply best practices for clarity, completeness, and actionable outcomes.",
      bestPractices: [
        "Define clear objectives and success criteria",
        "Specify constraints and limitations",
        "Include context and background information",
        "Provide examples and use cases",
        "Define expected outputs and deliverables"
      ]
    }
  }

  async run(input: AdapterInput): Promise<AdapterOutput> {
    try {
      logger.info(`🔧 Prompt Enhancer: ${input.text}`)
      
      const request = await this.parseRequest(input.text)
      
      switch (request.action) {
        case 'enhance':
          return await this.enhancePrompt(input.text, request)
        case 'analyze':
          return await this.analyzePrompt(input.text)
        case 'examples':
          return await this.provideExamples(request.domain || 'general')
        default:
          return {
            summaryText: "❌ I couldn't understand what you want to do with prompt enhancement. Try:\n\n• \"Enhance this prompt: [your prompt]\" - Improve a basic prompt\n• \"Analyze this prompt: [your prompt]\" - Analyze prompt quality\n• \"Show prompt examples for AI/ML\" - Get domain-specific examples\n• \"Help me improve my prompts\" - Get general guidance",
            metadata: {
              category: 'prompt_enhancer',
              status: 'error'
            }
          }
      }
    } catch (error) {
      logger.error('Prompt Enhancer error:', error)
      return {
        summaryText: "❌ Sorry, I encountered an error while enhancing your prompt. Please try again.",
        metadata: {
          category: 'prompt_enhancer',
          status: 'error'
        }
      }
    }
  }

  private async parseRequest(text: string): Promise<PromptEnhancementRequest> {
    // Use LLM-based parsing instead of primitive keyword matching
    // For now, use simple heuristics but this should be enhanced with LLM classification
    
    // Most prompt enhancement requests are about enhancing prompts
    // The intent router already classified this as 'prompt_enhancer', so we trust that
    const domain = this.detectDomain(text)
    const complexity = this.detectComplexity(text)
    
    return {
      action: 'enhance', // Default to enhance - most common use case
      domain,
      complexity
    }
  }

  private detectDomain(text: string): 'ai_ml' | 'development' | 'devops' | 'systems' | 'general' {
    // Use LLM-based domain detection instead of primitive keyword matching
    // For now, return general - can be enhanced with LLM classification later
    return 'general'
  }

  private detectComplexity(text: string): 'basic' | 'intermediate' | 'advanced' {
    // Use LLM-based complexity detection instead of primitive keyword matching  
    // For now, return intermediate - can be enhanced with LLM classification later
    return 'intermediate'
  }

  private async enhancePrompt(originalText: string, request: PromptEnhancementRequest): Promise<AdapterOutput> {
    try {
      // Extract the actual prompt from the request
      const promptText = this.extractPromptText(originalText)
      
      if (!promptText) {
        return {
          summaryText: "❌ I couldn't find a prompt to enhance. Please provide a prompt like:\n\n\"Enhance this prompt: Create a calculator app\"\n\"Improve: Write a function to sort data\"\n\"Make this better: Build a chatbot\"",
          metadata: {
            category: 'prompt_enhancer',
            status: 'error'
          }
        }
      }

      const llm = createLLMProvider()
      const domain = request.domain || 'general'
      const template = this.domainTemplates[domain as keyof typeof this.domainTemplates] || this.domainTemplates.general

      const enhancementPrompt = [
        {
          role: 'system',
          content: `You are a prompt engineering expert specializing in ${domain} domains. Your task is to enhance basic prompts into comprehensive, detailed ones that provide clear context, specific requirements, and actionable guidance.

Domain Context: ${template.context}

Enhancement Guidelines:
1. Add specific context and background information
2. Define clear objectives and success criteria
3. Specify constraints, limitations, and requirements
4. Include examples and use cases where relevant
5. Add technical specifications and best practices
6. Consider edge cases and error handling
7. Define expected outputs and deliverables
8. Include relevant domain-specific considerations

Return ONLY a JSON object with this exact structure:
{
  "enhanced_prompt": "The enhanced, detailed prompt",
  "improvements": ["List of specific improvements made"],
  "best_practices": ["Domain-specific best practices applied"],
  "examples": ["Relevant examples or use cases"],
  "complexity": "${request.complexity || 'intermediate'}",
  "domain": "${domain}"
}`
        },
        {
          role: 'user',
          content: `Please enhance this prompt: "${promptText}"`
        }
      ]

      const response = await llm.complete({
        messages: enhancementPrompt as any,
        temperature: 0.3,
        maxTokens: 1500
      })

      const enhancement = await this.parseEnhancementResponse(response.content || '', promptText, domain)
      
      const result = `**Prompt Enhancement Complete!**\n\n**Original Prompt:**\n"${promptText}"\n\n**Enhanced Prompt:**\n${enhancement.enhanced}\n\n**Key Improvements:**\n${enhancement.improvements.map(imp => `• ${imp}`).join('\n')}\n\n**Best Practices Applied:**\n${enhancement.bestPractices.map(bp => `• ${bp}`).join('\n')}\n\n**Examples & Use Cases:**\n${enhancement.examples.map(ex => `• ${ex}`).join('\n')}\n\n**Domain:** ${enhancement.domain} | **Complexity:** ${enhancement.complexity}`

      return {
        summaryText: result,
        metadata: {
          category: 'prompt_enhancer',
          domain: enhancement.domain,
          complexity: enhancement.complexity,
          status: 'success'
        }
      }

    } catch (error) {
      logger.error('Prompt enhancement error:', error)
      return {
        summaryText: "❌ Sorry, I encountered an error while enhancing your prompt. Please try again with a clearer request.",
        metadata: {
          category: 'prompt_enhancer',
          status: 'error'
        }
      }
    }
  }

  private extractPromptText(text: string): string | null {
    // Try different patterns to extract the actual prompt
    const patterns = [
      /enhance\s+(?:this\s+)?prompt[:\s]+(.+)/i,
      /improve\s+(?:this\s+)?prompt[:\s]+(.+)/i,
      /make\s+(?:this\s+)?better[:\s]+(.+)/i,
      /enhance[:\s]+(.+)/i,
      /improve[:\s]+(.+)/i,
      /better[:\s]+(.+)/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // If no pattern matches, return the whole text if it's not too long
    if (text.length > 20 && text.length < 500) {
      return text
    }

    return null
  }

  private async parseEnhancementResponse(response: string, originalPrompt: string, domain: string): Promise<EnhancedPrompt> {
    try {
      // Clean the response
      let cleanResponse = response.trim()
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Extract JSON
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          original: originalPrompt,
          enhanced: parsed.enhanced_prompt || originalPrompt,
          improvements: parsed.improvements || [],
          bestPractices: parsed.best_practices || [],
          examples: parsed.examples || [],
          domain: parsed.domain || domain,
          complexity: parsed.complexity || 'intermediate'
        }
      }
    } catch (error) {
      logger.error('Failed to parse enhancement response:', error)
    }

    // Fallback: return basic enhancement
    return {
      original: originalPrompt,
      enhanced: this.createFallbackEnhancement(originalPrompt, domain),
      improvements: ['Added context and specificity', 'Included technical requirements', 'Added examples and use cases'],
      bestPractices: this.domainTemplates[domain as keyof typeof this.domainTemplates]?.bestPractices || [],
      examples: ['Consider edge cases', 'Define success criteria', 'Include error handling'],
      domain,
      complexity: 'intermediate'
    }
  }

  private createFallbackEnhancement(original: string, domain: string): string {
    const template = this.domainTemplates[domain as keyof typeof this.domainTemplates] || this.domainTemplates.general
    
    return `${original}

Context: ${template.context}

Requirements:
- Define clear objectives and success criteria
- Specify constraints and limitations
- Include relevant examples and use cases
- Consider edge cases and error handling
- Define expected outputs and deliverables

Best Practices:
${template.bestPractices.map(bp => `- ${bp}`).join('\n')}`
  }

  private async analyzePrompt(promptText: string): Promise<AdapterOutput> {
    try {
      const analysis = await this.analyzePromptQuality(promptText)
      
      const result = `🔍 **Prompt Analysis**\n\n**Prompt:** "${promptText}"\n\n**Quality Score:** ${analysis.score}/10\n\n**Strengths:**\n${analysis.strengths.map((s: string) => `• ${s}`).join('\n')}\n\n**Areas for Improvement:**\n${analysis.improvements.map((i: string) => `• ${i}`).join('\n')}\n\n**Recommendations:**\n${analysis.recommendations.map((r: string) => `• ${r}`).join('\n')}\n\n**Domain:** ${analysis.domain} | **Complexity:** ${analysis.complexity}`

      return {
        summaryText: result,
        metadata: {
          category: 'prompt_enhancer',
          analysis_type: 'quality_analysis',
          score: analysis.score,
          domain: analysis.domain,
          complexity: analysis.complexity,
          status: 'success'
        }
      }
    } catch (error) {
      logger.error('Prompt analysis error:', error)
      return {
        summaryText: "❌ Sorry, I encountered an error while analyzing your prompt. Please try again.",
        metadata: {
          category: 'prompt_enhancer',
          status: 'error'
        }
      }
    }
  }

  private async analyzePromptQuality(prompt: string): Promise<any> {
    // Use LLM-based analysis instead of primitive keyword matching
    try {
      const llm = createLLMProvider()
      
      const analysisPrompt = [
        {
          role: 'system',
          content: `You are a prompt engineering expert. Analyze the quality of this prompt and provide detailed feedback.

Return ONLY a JSON object with this exact structure:
{
  "score": 8,
  "domain": "ai_ml|development|devops|systems|general",
  "complexity": "basic|intermediate|advanced",
  "strengths": ["List of what the prompt does well"],
  "improvements": ["List of areas that need improvement"],
  "recommendations": ["List of specific recommendations"]
}

Score from 1-10 based on:
- Clarity and specificity (2 points)
- Context and background (2 points)  
- Examples and use cases (2 points)
- Technical details (2 points)
- Completeness (2 points)`
        },
        {
          role: 'user',
          content: `Analyze this prompt: "${prompt}"`
        }
      ]

      const response = await llm.complete({
        messages: analysisPrompt as any,
        temperature: 0.2,
        maxTokens: 800
      })

      // Parse LLM response
      let cleanResponse = response.content?.trim() || ''
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Extract JSON
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      logger.error('LLM prompt analysis failed:', error)
    }

    // Fallback analysis if LLM fails
    return {
      score: 5,
      domain: 'general',
      complexity: 'intermediate',
      strengths: ['Basic prompt structure'],
      improvements: ['Add more context and specificity', 'Include examples', 'Define success criteria'],
      recommendations: ['Use the enhance command to improve this prompt']
    }
  }

  private async provideExamples(domain: string): Promise<AdapterOutput> {
    const examples = {
      ai_ml: [
        "Create a machine learning model to predict customer churn using historical data",
        "Build a recommendation system for an e-commerce platform",
        "Implement a computer vision model for object detection in images",
        "Develop a natural language processing pipeline for sentiment analysis"
      ],
      development: [
        "Create a REST API for a task management system",
        "Build a React component for a data visualization dashboard",
        "Implement a caching system for a web application",
        "Develop a microservice for user authentication and authorization"
      ],
      devops: [
        "Set up a CI/CD pipeline for a containerized application",
        "Configure monitoring and alerting for a production system",
        "Implement infrastructure as code for cloud deployment",
        "Design a disaster recovery plan for a distributed system"
      ],
      systems: [
        "Design a distributed caching system for high-traffic applications",
        "Implement a message queue system for microservices communication",
        "Create a load balancing strategy for a scalable web application",
        "Design a data synchronization system for multi-region deployment"
      ],
      general: [
        "Create a web application for managing personal finances",
        "Build a chatbot for customer support",
        "Develop a mobile app for fitness tracking",
        "Implement a search engine for a document repository"
      ]
    }

    const domainExamples = examples[domain as keyof typeof examples] || examples.general
    const template = this.domainTemplates[domain as keyof typeof this.domainTemplates] || this.domainTemplates.general

    const result = `📚 **Prompt Examples for ${domain.toUpperCase()}**\n\n**Basic Examples:**\n${domainExamples.map(ex => `• ${ex}`).join('\n')}\n\n**Domain Context:**\n${template.context}\n\n**Best Practices to Apply:**\n${template.bestPractices.map(bp => `• ${bp}`).join('\n')}\n\n💡 **Try enhancing any of these examples:**\n"Enhance this prompt: ${domainExamples[0]}"`

    return {
      summaryText: result,
      metadata: {
        category: 'prompt_enhancer',
        examples_domain: domain,
        status: 'success'
      }
    }
  }
}

export const promptEnhancerAdapter = new PromptEnhancerAdapter()
