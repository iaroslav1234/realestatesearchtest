import { supabase, openai } from '@/supabaseClient';

export default async function handler(req, res) {
  console.log('API route /api/properties/add triggered'); // Log when the route is hit

  if (req.method !== 'POST') {
    console.log('Invalid HTTP method'); // Log invalid method
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const property = req.body;
    console.log('Received property:', property); // Log the input data

    // Generate embedding for the property description
    const input = `${property.title} ${property.address} ${property.description} ${property.location} ${property.house_type} ${property.price}`;
    console.log('Generating embedding for:', input);
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: input,
    });

    console.log('Embedding response:', embeddingResponse); // Log OpenAI's response
    const embedding = embeddingResponse.data[0].embedding;

    // Insert the property and its embedding into Supabase
    console.log('Inserting into Supabase:', { ...property, embedding });
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...property,
        embedding,
      })
      .select();

    if (error) {
      console.error('Supabase insertion error:', error); // Log Supabase errors
      throw new Error(error.message);
    }

    console.log('Property added successfully:', data); // Log success
    res.status(200).json({ message: 'Property added successfully', data });
  } catch (err) {
    console.error('Error:', err.message); // Log any errors
    res.status(500).json({ error: err.message });
  }
}
