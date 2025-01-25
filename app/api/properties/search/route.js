import { supabase, openai } from '@/supabaseClient';
import { NextResponse } from 'next/server';

// Helper function for CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200, 
    headers: corsHeaders()
  });
}

export async function POST(request) {
  const headers = corsHeaders();

  try {
    // Log the raw request details
    console.log('Request headers:', Object.fromEntries(request.headers));
    
    const rawBody = await request.text();
    console.log('Raw request body:', rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400, headers }
      );
    }

    console.log('Parsed request body:', body);

    // Try to extract query from various possible locations
    const query = body.query || 
                 body.parameters?.query || 
                 body.args?.query || 
                 body.input?.query ||
                 body.searchQuery;

    console.log('Extracted query:', query);

    if (!query) {
      return NextResponse.json(
        { 
          error: 'Query is required',
          receivedPayload: body,
          help: 'Please include a "query" field in the request body'
        }, 
        { status: 400, headers }
      );
    }

    const similarity_threshold = body.similarity_threshold || 0.5;
    const match_count = body.match_count || 5;

    console.log('Processing search with parameters:', {
      query,
      similarity_threshold,
      match_count
    });

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('Generated embedding successfully');

    // Search properties
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

    const response = {
      properties: data || [],
      count: data?.length || 0,
      query: query,
      similarity_threshold,
      match_count
    };

    console.log('Search response:', response);
    return NextResponse.json(response, { headers });

  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, 
      { status: 500, headers }
    );
  }
}
