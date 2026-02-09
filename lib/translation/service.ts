const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'google/gemini-2.5-flash-lite'


export async function translateSearchQuery(
  query: string,
  from = 'es',
  to = 'en'
): Promise<string> {
  console.log('[translateSearchQuery] Interpreting query:', query)

  if (!OPENROUTER_API_KEY) {
    console.error('[translateSearchQuery] ❌ OPENROUTER_API_KEY not configured!')
    return query
  }

  const prompt = `You are a search query translator for a prediction market platform. Translate this search query from ${from} to ${to}.

Instructions:
- Fix any typos or spelling errors
- Complete incomplete words based on context
- Keep proper names (people, places, brands) unchanged
- Keep it short and focused on key search terms
- Output ONLY the translated query, nothing else

User query: "${query}"

Translated query:`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'UseBofet Search Query Translation',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[translateSearchQuery] ❌ API error:', error)
      return query
    }

    const data = await response.json()
    const translatedQuery = data.choices?.[0]?.message?.content?.trim()

    if (!translatedQuery) {
      console.error('[translateSearchQuery] ❌ No translation in response')
      return query
    }

    // Remove quotes if AI added them
    const cleanQuery = translatedQuery.replace(/^["']|["']$/g, '')

    console.log('[translateSearchQuery] ✅ Query translated:', {
      original: query,
      translated: cleanQuery,
    })

    return cleanQuery
  } catch (error) {
    console.error('[translateSearchQuery] ❌ Exception:', error)
    return query
  }
}
async function translateWithAI(text: string, from = 'en', to = 'es'): Promise<string> {
  console.log('[translateWithAI] Starting translation:', {
    text: text.substring(0, 50) + '...',
    from,
    to
  })

  if (!OPENROUTER_API_KEY) {
    console.error('[translateWithAI] ❌ OPENROUTER_API_KEY not configured!')
    return text
  }

  const prompt = `Translate the following prediction market title from ${from} to ${to}.
Provide ONLY the translation, nothing else. Keep the context and meaning:

"${text}"`

  console.log('[translateWithAI] Request details:', {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: MODEL,
    promptLength: prompt.length,
  })

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'UseBofet Search Translation',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    console.log('[translateWithAI] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const error = await response.text()
      console.error('[translateWithAI] ❌ OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
      })
      return text
    }

    const data = await response.json()
    console.log('[translateWithAI] API response:', JSON.stringify(data, null, 2))

    const translation = data.choices?.[0]?.message?.content?.trim()

    if (!translation) {
      console.error('[translateWithAI] ❌ No translation in response:', data)
      return text
    }

    console.log('[translateWithAI] ✅ Translation successful:', {
      original: text.substring(0, 50) + '...',
      translated: translation.substring(0, 50) + '...',
    })

    return translation
  } catch (error) {
    console.error('[translateWithAI] ❌ Exception caught:', error)
    return text
  }
}

export async function translateText(
  text: string,
  from = 'en',
  to = 'es'
): Promise<{ translation: string; cached: boolean }> {
  console.log('[translateText] Called for:', text.substring(0, 50) + '...')

  const translation = await translateWithAI(text, from, to)

  return { translation, cached: false }
}

async function translateBatchWithAI(
  texts: string[],
  from = 'en',
  to = 'es'
): Promise<Map<string, string>> {
  console.log('[translateBatchWithAI] Translating', texts.length, 'texts in single request')

  if (!OPENROUTER_API_KEY) {
    console.error('[translateBatchWithAI] ❌ OPENROUTER_API_KEY not configured!')
    const fallbackMap = new Map<string, string>()
    texts.forEach(text => fallbackMap.set(text, text))
    return fallbackMap
  }

  const numberedTexts = texts.map((text, index) => `${index + 1}. "${text}"`).join('\n')

  const prompt = `Translate the following ${texts.length} prediction market titles from ${from} to ${to}.
Provide ONLY the translations in the exact same order, one per line, numbered the same way.
Keep the context and meaning for each title:

${numberedTexts}

Respond with ONLY the numbered translations, nothing else.`

  console.log('[translateBatchWithAI] Request details:', {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: MODEL,
    textCount: texts.length,
  })

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'UseBofet Search Translation',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500, // Increased for batch translations
      }),
    })

    console.log('[translateBatchWithAI] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const error = await response.text()
      console.error('[translateBatchWithAI] ❌ OpenRouter API error:', {
        status: response.status,
        error: error,
      })
      // Return original texts on error
      const fallbackMap = new Map<string, string>()
      texts.forEach(text => fallbackMap.set(text, text))
      return fallbackMap
    }

    const data = await response.json()
    console.log('[translateBatchWithAI] Full API response:', JSON.stringify(data, null, 2))

    const translationsText = data.choices?.[0]?.message?.content?.trim()

    if (!translationsText) {
      console.error('[translateBatchWithAI] ❌ No translation in response')
      console.error('[translateBatchWithAI] Response data:', JSON.stringify(data, null, 2))
      const fallbackMap = new Map<string, string>()
      texts.forEach(text => fallbackMap.set(text, text))
      return fallbackMap
    }

    console.log('[translateBatchWithAI] Raw response:', translationsText)

    // Parse the numbered translations
    const translationLines = translationsText.split('\n').filter((line: string) => line.trim())
    const translations = new Map<string, string>()

    texts.forEach((originalText, index) => {
      // Try to find the translation by number
      const line = translationLines[index]
      if (line) {
        // Remove number prefix (e.g., "1. " or "1) ")
        const translation = line.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').trim()
        translations.set(originalText, translation || originalText)
        console.log(`[translateBatchWithAI] ${index + 1}. "${originalText.substring(0, 40)}..." → "${translation.substring(0, 40)}..."`)
      } else {
        // Fallback to original if parsing fails
        translations.set(originalText, originalText)
        console.warn(`[translateBatchWithAI] ⚠ Missing translation for index ${index + 1}, using original`)
      }
    })

    console.log('[translateBatchWithAI] ✅ Successfully translated', translations.size, 'texts')
    return translations
  } catch (error) {
    console.error('[translateBatchWithAI] ❌ Exception:', error)
    const fallbackMap = new Map<string, string>()
    texts.forEach(text => fallbackMap.set(text, text))
    return fallbackMap
  }
}

export async function translateBatch(
  texts: string[],
  from = 'en',
  to = 'es'
): Promise<Map<string, string>> {
  console.log('[translateBatch] Starting batch translation of', texts.length, 'texts')

  if (texts.length === 0) {
    return new Map()
  }

  const translations = await translateBatchWithAI(texts, from, to)

  console.log('[translateBatch] ✅ Batch complete, total translations:', translations.size)

  return translations
}
