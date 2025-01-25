import { supabase, openai } from '@/supabaseClient';
import { NextResponse } from 'next/server';

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    // Add CORS headers to the response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    const body = await request.json();
    console.log('Received search request:', body);
    const { query, similarity_threshold = 0.5, match_count = 5 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' }, 
        { status: 400, headers }
      );
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
      return NextResponse.json(
        { error: error.message }, 
        { status: 500, headers }
      );
    }

    console.log(`Found ${data?.length || 0} matching properties`);
    return NextResponse.json(
      { properties: data || [], count: data?.length || 0 },
      { headers }
    );
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: err.message }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}
