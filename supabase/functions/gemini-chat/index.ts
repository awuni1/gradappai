import { serve } from 'std/http/server.ts'
import { createClient } from 'supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeminiRequest {
  prompt: string;
  context?: {
    userProfile?: any;
    cvData?: any;
    preferences?: any;
    conversationHistory?: any[];
  };
  type: 'university_search' | 'cv_analysis' | 'general_chat' | 'greeting';
}

interface GeminiContent {
  parts: {
    text: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🤖 Gemini Chat Function called')

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured in environment')
    }

    // Parse request body
    const { prompt, context, type }: GeminiRequest = await req.json()
    console.log('📝 Request type:', type)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Build enhanced prompt based on type and context
    const enhancedPrompt = buildEnhancedPrompt(prompt, context, type)
    console.log('🔧 Enhanced prompt length:', enhancedPrompt.length)

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(enhancedPrompt, geminiApiKey)
    console.log('✅ Gemini API response received')

    // Process and format response
    const processedResponse = processGeminiResponse(geminiResponse, type)

    return new Response(
      JSON.stringify(processedResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in Gemini chat function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process AI request',
        details: error.message,
        fallback_response: getFallbackResponse(error.message)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function callGeminiAPI(prompt: string, apiKey: string): Promise<any> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }] as GeminiContent[],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  }

  console.log('📡 Calling Gemini API...')
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('❌ Gemini API error:', errorData)
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`)
  }

  return await response.json()
}

function buildEnhancedPrompt(userPrompt: string, context: any, type: string): string {
  let systemPrompt = ""
  
  // Add conversation context if available
  let conversationContext = ""
  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    conversationContext = "\n\nConversation History:\n" + 
      context.conversationHistory.map((msg: any) => 
        `${msg.role}: ${msg.content}`
      ).join('\n')
  }

  switch (type) {
    case 'greeting':
      systemPrompt = `You are GradMatch AI, a friendly and knowledgeable graduate school advisor. 
Respond to user greetings warmly and invite them to upload their CV or ask questions about universities.
Keep responses concise and helpful.`
      break

    case 'cv_analysis':
      systemPrompt = `You are GradMatch AI, an expert graduate school advisor. Analyze the uploaded CV and provide insights in JSON format.

Please provide analysis in this exact JSON format:
{
  "user_profile": {
    "academic_background": "extracted background summary",
    "gpa": "extracted or estimated GPA",
    "test_scores": {"gre": "score if mentioned", "toefl": "score if mentioned"},
    "research_experience": ["experience 1", "experience 2"],
    "work_experience": ["job 1", "job 2"],
    "skills": ["skill 1", "skill 2"],
    "research_interests": ["interest 1", "interest 2"]
  },
  "analysis": {
    "strengths": ["strength 1", "strength 2"],
    "areas_for_improvement": ["area 1", "area 2"],
    "profile_tier": "tier based on academic strength",
    "recommended_university_range": "ranking range like 50-150"
  },
  "next_steps": {
    "message": "Encouraging message about their profile",
    "country_options": ["USA", "UK", "Canada", "Germany", "Australia"]
  }
}`
      break

    case 'university_search': {
      const userProfile = context?.userProfile || {}
      systemPrompt = `You are GradMatch AI. Based on the user's CV analysis and country preference, provide university recommendations in JSON format.

User Profile Summary:
- Academic Background: ${userProfile.academic_background || 'Not specified'}
- GPA: ${userProfile.gpa || 'Not specified'}
- Research Interests: ${userProfile.research_interests?.join(', ') || 'Not specified'}
- Profile Tier: ${userProfile.profile_tier || 'Mid-tier'}

Provide recommendations in this exact JSON format:
{
  "universities": [
    {
      "name": "University Name",
      "program": "Program Name",
      "location": "City, Country",
      "match_score": 85,
      "category": "reach|target|safety",
      "ranking": "#10 in Field",
      "why_recommended": ["reason 1", "reason 2"],
      "concerns": ["concern 1"],
      "website_url": "https://university.edu",
      "application_deadline": "December 15, 2024",
      "tuition_fee": "$45,000/year",
      "admission_requirements": {
        "gpa_requirement": "3.5+",
        "gre_requirement": "315+"
      }
    }
  ],
  "analysis": {
    "total_matches": 15,
    "reach_schools": 5,
    "target_schools": 7,
    "safety_schools": 3,
    "primary_field": "Computer Science",
    "confidence_score": 85
  }
}

Provide 15-20 universities with a good mix of reach, target, and safety schools.`
      break
    }

    default:
      systemPrompt = `You are GradMatch AI, a helpful graduate school advisor. 
Provide helpful, concise responses about university applications, academic programs, and career guidance.
If the user asks about specific universities, provide detailed information.
If they want comparisons, give balanced pros and cons.`
  }

  return `${systemPrompt}

${conversationContext}

User Message: ${userPrompt}

Please provide a helpful and accurate response.`
}

function processGeminiResponse(apiResponse: any, type: string): any {
  try {
    // Extract the text from Gemini's response format
    const responseText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    if (!responseText) {
      throw new Error('Empty response from Gemini')
    }

    // Try to extract JSON for structured responses
    if (type === 'cv_analysis' || type === 'university_search') {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1] || jsonMatch[0]
          const parsedData = JSON.parse(jsonStr)
          
          return {
            content: responseText,
            type: type === 'university_search' ? 'universities_list' : 'cv_analysis',
            parsed_data: parsedData,
            confidence: 85,
            metadata: {
              generated_at: new Date().toISOString(),
              gemini_model: 'gemini-2.5-flash',
              function_name: 'gemini-chat',
              request_type: type,
              processing_time: Date.now()
            }
          }
        } catch (parseError) {
          console.error('❌ JSON parsing failed:', parseError)
        }
      }
    }

    // Return as text response if JSON parsing fails or not needed
    return {
      content: responseText,
      type: 'text',
      confidence: 90,
      metadata: {
        generated_at: new Date().toISOString(),
        gemini_model: 'gemini-2.5-flash',
        function_name: 'gemini-chat',
        processing_time: Date.now()
      }
    }

  } catch (error) {
    console.error('❌ Error processing Gemini response:', error)
    throw error
  }
}

function getFallbackResponse(errorMessage: string): any {
  if (errorMessage.includes('GEMINI_API_KEY')) {
    return {
      content: "I'm currently experiencing configuration issues. Please contact support to enable AI features.",
      type: 'text',
      confidence: 0
    }
  }

  return {
    content: "I'm having trouble processing your request right now. Please try again in a moment, or contact support if the issue persists.",
    type: 'text',
    confidence: 0
  }
}