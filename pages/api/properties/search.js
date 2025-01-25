import { supabase, openai } from '@/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received search request:', req.body);
    const { query, similarity_threshold = 0.5, match_count = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Generate embedding for the query
    console.log('Generating embedding for query:', query);
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('Generated embedding successfully');

    // Call Supabase function to search for similar properties
    console.log('Searching properties with parameters:', {
      similarity_threshold,
      match_count
    });
    
    const { data, error } = await supabase.rpc('search_properties', {
      query_embedding: queryEmbedding,
      similarity_threshold,
      match_count,
    });

    if (error) {
      console.error('Supabase search error:', error);
      throw new Error(error.message);
    }

    console.log(`Found ${data?.length || 0} matching properties`);
    res.status(200).json({ 
      properties: data || [],
      count: data?.length || 0
    });
  } catch (err) {
    console.error('Search API error:', err);
    res.status(500).json({ error: err.message });
  }
}
