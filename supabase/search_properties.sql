-- Enable the pgvector extension if not already enabled
create extension if not exists vector;

-- Create the search_properties function
create or replace function search_properties (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  description text,
  price numeric,
  address text,
  location text,
  house_type text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    id,
    title,
    description,
    price,
    address,
    location,
    house_type,
    1 - (properties.embedding <=> query_embedding) as similarity
  from properties
  where 1 - (properties.embedding <=> query_embedding) > similarity_threshold
  order by similarity desc
  limit match_count;
end;
$$;
