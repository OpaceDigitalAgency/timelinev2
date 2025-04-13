/*
  # Religion Timeline Database Schema

  1. New Tables
    - `eras` - Historical time periods
      - `id` (uuid, primary key)
      - `name` (text)
      - `start_year` (integer)
      - `end_year` (integer)
      - `description` (text)
    - `religions` - Religious traditions
      - `id` (uuid, primary key)
      - `slug` (text, unique)
      - `name` (text)
      - `summary` (text)
      - `description` (text)
      - `founder_name` (text, nullable)
      - `founding_year` (integer)
      - `end_year` (integer, nullable)
      - `continent` (text)
      - `origin_country` (text)
      - `status` (text)
      - `approx_followers` (bigint, nullable)
      - `image_url` (text, nullable)
      - `era_id` (uuid, foreign key)
      - `created_at` (timestamptz)
    - `religion_beliefs` - Join table for religions and belief systems
      - `id` (uuid, primary key)
      - `religion_id` (uuid, foreign key)
      - `belief` (text)
    - `religion_practices` - Religious practices
      - `id` (uuid, primary key)
      - `religion_id` (uuid, foreign key)
      - `practice` (text)
    - `religion_texts` - Holy texts
      - `id` (uuid, primary key)
      - `religion_id` (uuid, foreign key)
      - `text_name` (text)
    - `religion_figures` - Key figures
      - `id` (uuid, primary key)
      - `religion_id` (uuid, foreign key)
      - `figure_name` (text)
    - `religion_branches` - Branches or denominations
      - `id` (uuid, primary key)
      - `religion_id` (uuid, foreign key)
      - `branch_name` (text)
    - `religion_relationships` - Relationships between religions
      - `id` (uuid, primary key)
      - `parent_id` (uuid, foreign key)
      - `child_id` (uuid, foreign key)
      - `relationship_type` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read all data
    - Add policies for administrators to insert, update, and delete data
*/

-- Create eras table
CREATE TABLE IF NOT EXISTS eras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_year integer NOT NULL,
  end_year integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create religions table
CREATE TABLE IF NOT EXISTS religions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  summary text,
  description text,
  founder_name text,
  founding_year integer NOT NULL,
  end_year integer,
  continent text,
  origin_country text,
  status text DEFAULT 'active',
  approx_followers bigint,
  image_url text,
  era_id uuid REFERENCES eras(id),
  created_at timestamptz DEFAULT now()
);

-- Create religion_beliefs join table
CREATE TABLE IF NOT EXISTS religion_beliefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  religion_id uuid REFERENCES religions(id) ON DELETE CASCADE,
  belief text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create religion_practices table
CREATE TABLE IF NOT EXISTS religion_practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  religion_id uuid REFERENCES religions(id) ON DELETE CASCADE,
  practice text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create religion_texts table
CREATE TABLE IF NOT EXISTS religion_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  religion_id uuid REFERENCES religions(id) ON DELETE CASCADE,
  text_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create religion_figures table
CREATE TABLE IF NOT EXISTS religion_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  religion_id uuid REFERENCES religions(id) ON DELETE CASCADE,
  figure_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create religion_branches table
CREATE TABLE IF NOT EXISTS religion_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  religion_id uuid REFERENCES religions(id) ON DELETE CASCADE,
  branch_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create religion_relationships table
CREATE TABLE IF NOT EXISTS religion_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES religions(id) ON DELETE CASCADE,
  child_id uuid REFERENCES religions(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'parent-child',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_relationship UNIQUE(parent_id, child_id)
);

-- Enable Row Level Security
ALTER TABLE eras ENABLE ROW LEVEL SECURITY;
ALTER TABLE religions ENABLE ROW LEVEL SECURITY;
ALTER TABLE religion_beliefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE religion_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE religion_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE religion_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE religion_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE religion_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to eras" ON eras FOR SELECT USING (true);
CREATE POLICY "Allow public read access to religions" ON religions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to religion_beliefs" ON religion_beliefs FOR SELECT USING (true);
CREATE POLICY "Allow public read access to religion_practices" ON religion_practices FOR SELECT USING (true);
CREATE POLICY "Allow public read access to religion_texts" ON religion_texts FOR SELECT USING (true);
CREATE POLICY "Allow public read access to religion_figures" ON religion_figures FOR SELECT USING (true);
CREATE POLICY "Allow public read access to religion_branches" ON religion_branches FOR SELECT USING (true);
CREATE POLICY "Allow public read access to religion_relationships" ON religion_relationships FOR SELECT USING (true);

-- Create policies for admin write access (to be implemented with auth later)
CREATE POLICY "Allow authenticated users to insert eras" ON eras FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update eras" ON eras FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete eras" ON eras FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert religions" ON religions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update religions" ON religions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete religions" ON religions FOR DELETE USING (auth.role() = 'authenticated');

-- Create functions for searching religions
CREATE OR REPLACE FUNCTION search_religions(search_term text)
RETURNS SETOF religions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM religions
  WHERE 
    name ILIKE '%' || search_term || '%' OR
    summary ILIKE '%' || search_term || '%' OR
    description ILIKE '%' || search_term || '%' OR
    founder_name ILIKE '%' || search_term || '%' OR
    origin_country ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;