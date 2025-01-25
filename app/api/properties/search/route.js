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

    // Extract query from Retell AI's nested structure or direct query
    const query = body.query || // Direct query
                 body.args?.parameters?.query || // Retell AI structure
                 body.parameters?.query || // Alternative structure
                 null;

    console.log('Extracted query:', query);

    if (!query) {
      return NextResponse.json(
        { 
          error: 'Query is required',
          receivedPayload: body,
          help: 'Please include a query field in the request body or in args.parameters.query'
        }, 
        { status: 400, headers }
      );
    }

    const similarity_threshold = 
      body.similarity_threshold || 
      body.args?.parameters?.similarity_threshold || 
      0.5;
    
    const match_count = 
      body.match_count || 
      body.args?.parameters?.match_count || 
      5;

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

    // Format response for Retell AI
    const properties = data || [];
    const response = {
      properties,
      count: properties.length,
      query,
      similarity_threshold,
      match_count,
      // Add a formatted message for Retell AI
      message: properties.length > 0 
        ? `Found ${properties.length} properties matching "${query}". The most relevant property is ${properties[0].title} at ${properties[0].address}.`
        : `No properties found matching "${query}".`
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
