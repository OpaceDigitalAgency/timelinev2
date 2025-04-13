-- Fix religion_beliefs table to ensure all beliefs match the valid BeliefSystem types
-- This script standardizes belief values to match the BeliefSystem type in the frontend

-- 1. First, let's create a table to map non-standard belief values to standard ones
-- Drop the table if it already exists
DROP TABLE IF EXISTS belief_mapping;

CREATE TABLE belief_mapping (
  original_belief TEXT,
  standard_belief TEXT
);

-- 2. Insert mappings for non-standard belief values
INSERT INTO belief_mapping (original_belief, standard_belief) VALUES
  ('Rationalism, belief in a non-interventionist creator God', 'Deism'),
  ('Syncretic religious tradition', 'Polytheism'),
  ('Dualistic religious tradition', 'Dualism'),
  ('Christian denomination', 'Monotheism'),
  ('Mystical Hellenistic school of thought', 'Philosophical'),
  ('Non-theistic', 'Nontheism'),
  ('Belief in Spirits', 'Animism'),
  ('Belief in spirits of ancestors', 'Animism'),
  ('Animistic belief system', 'Animism'),
  ('Animistic or polytheistic', 'Animism'),
  ('Totemism, animism', 'Animism'),
  ('Fertility and agricultural deities', 'Polytheism'),
  ('Restorationist Christian denomination', 'Monotheism'),
  ('Christian religious movement', 'Monotheism'),
  ('Belief in communication with spirits', 'Animism'),
  ('Central tenet; emphasis on spiritual evolution through multiple lifetimes.', 'Philosophical'),
  ('Varied; emphasis may be on personal conscience and moral character rather than specific doctrines about the afterlife.', 'Philosophical'),
  ('Varied; focus is more on mental and spiritual well-being in the present life rather than specific doctrines about the afterlife.', 'Philosophical'),
  ('Central tenet; emphasis on salvation through faith in Christ and eternal life.', 'Monotheism'),
  ('Central tenet; emphasis on salvation and eternal life through faith in Christ.', 'Monotheism'),
  ('Central tenet; emphasis on eternal life and spiritual existence.', 'Monotheism'),
  ('Central tenet; emphasis on preparation for the Second Coming and judgment.', 'Monotheism'),
  ('Unclear', 'Animism'),
  ('Henotheism', 'Polytheism');

-- 3. Update the religion_beliefs table with standardized belief values
UPDATE religion_beliefs
SET belief = m.standard_belief
FROM belief_mapping m
WHERE religion_beliefs.belief = m.original_belief;

-- 4. Fix continent values in the religions table
-- Create a table to map non-standard continent values to standard ones
DROP TABLE IF EXISTS continent_mapping;

CREATE TABLE continent_mapping (
  original_continent TEXT,
  standard_continent TEXT
);

-- Insert mappings for non-standard continent values
INSERT INTO continent_mapping (original_continent, standard_continent) VALUES
  ('Middle East (West Asia)', 'Middle East (West Asia)'),
  ('East Asia', 'East Asia'),
  ('South Asia', 'South Asia'),
  ('Southern Europe', 'Europe'),
  ('Northern Europe', 'Europe'),
  ('Central Asia', 'Asia'),
  ('Worldwide', 'Global'),
  ('Initially in Egypt, Mesopotamia, Greece, etc.', 'Global'),
  ('Europe and America', 'Global'),
  ('Middle East, Egypt, Greece', 'Middle East (West Asia)'),
  ('Asia, Middle East', 'Asia'),
  ('Africa, Europe', 'Global'),
  ('Celtic peoples in regions such as Ireland, Scotland, Wales, and Brittany (France)', 'Europe'),
  ('Celtic regions', 'Europe'),
  ('Scandinavia (Norway, Sweden, Denmark)', 'Europe'),
  ('Scandinavia', 'Europe'),
  ('Eurasian Steppe', 'Asia'),
  ('Ganges basin of India', 'South Asia'),
  ('Indian Subcontinent', 'South Asia'),
  ('Indian subcontinent', 'South Asia'),
  ('Indus Valley', 'South Asia'),
  ('Persia / Modern day Iran', 'Middle East (West Asia)'),
  ('Persia (modern-day Iran)', 'Middle East (West Asia)'),
  ('Canaan (modern-day Israel and Palestine)', 'Middle East (West Asia)'),
  ('Canaan (modern-day Israel and Palestine), Levant', 'Middle East (West Asia)'),
  ('Israel/Palestine', 'Middle East (West Asia)'),
  ('Jerusalem', 'Middle East (West Asia)'),
  ('Mecca, Arabian Peninsula', 'Middle East (West Asia)'),
  ('Saudi Arabia', 'Middle East (West Asia)'),
  ('Mesopotamia', 'Middle East (West Asia)'),
  ('Anatolia (modern-day Turkey)', 'Middle East (West Asia)'),
  ('Punjab', 'South Asia'),
  ('Andes region', 'South America'),
  ('Central Mexico', 'North America'),
  ('West Africa, Nigeria', 'Africa'),
  ('West Africa (Benin, Togo), Haiti', 'Global'),
  ('Nile Valley', 'Africa'),
  ('Ancient Greece', 'Europe'),
  ('Ancient Rome', 'Europe'),
  ('China', 'East Asia'),
  ('Japan', 'East Asia'),
  ('United States', 'North America'),
  ('Various', 'Global'),
  ('Global', 'Global'),
  ('-', 'Global');

-- Update the religions table with standardized continent values
UPDATE religions
SET continent = m.standard_continent
FROM continent_mapping m
WHERE religions.continent = m.original_continent;

-- 5. Ensure all religions have an era_id assigned
-- For any religion without an era_id, assign it to the appropriate era based on founding_year
UPDATE religions
SET era_id = (
  SELECT id FROM eras
  WHERE religions.founding_year >= eras.start_year AND religions.founding_year <= eras.end_year
  LIMIT 1
)
WHERE era_id IS NULL;

-- 6. Add missing relationships between religions
-- First, create a table to map religion names to their IDs
DROP TABLE IF EXISTS religion_name_mapping;

CREATE TABLE religion_name_mapping (
  religion_name TEXT,
  religion_id UUID
);

-- Insert mappings for major religions
INSERT INTO religion_name_mapping (religion_name, religion_id)
SELECT name, id FROM religions
WHERE name IN (
  'Hinduism', 'Buddhism', 'Judaism', 'Christianity', 'Islam', 'Christianity (Early)',
  'Christianity (Catholicism)', 'Christianity (Orthodox)', 'Christian (Protestant Reformation)',
  'Sikhism', 'Jainism', 'Zoroastrianism', 'Bahá''í Faith', 'Mormonism', 'Daoism (Taoism)',
  'Confucianism', 'Shinto', 'Ancient Greek Religion', 'Roman Religion', 'Norse Paganism (Viking Age)',
  'Ancient Egyptians', 'Mesopotamian', 'Druidism (Celtic Religion)', 'Yoruba', 'Vodou',
  'Aztec Religion', 'Inca Religion', 'Māori Religion'
);

-- Add parent-child relationships between major religions
INSERT INTO religion_relationships (parent_id, child_id, relationship_type)
SELECT p.religion_id, c.religion_id, 'parent-child'
FROM religion_name_mapping p, religion_name_mapping c
WHERE 
  (p.religion_name = 'Hinduism' AND c.religion_name = 'Buddhism') OR
  (p.religion_name = 'Hinduism' AND c.religion_name = 'Jainism') OR
  (p.religion_name = 'Judaism' AND c.religion_name = 'Christianity') OR
  (p.religion_name = 'Judaism' AND c.religion_name = 'Islam') OR
  (p.religion_name = 'Christianity' AND c.religion_name = 'Islam') OR
  (p.religion_name = 'Christianity' AND c.religion_name = 'Christianity (Early)') OR
  (p.religion_name = 'Christianity' AND c.religion_name = 'Christianity (Catholicism)') OR
  (p.religion_name = 'Christianity' AND c.religion_name = 'Christianity (Orthodox)') OR
  (p.religion_name = 'Christianity' AND c.religion_name = 'Christian (Protestant Reformation)') OR
  (p.religion_name = 'Christianity' AND c.religion_name = 'Mormonism') OR
  (p.religion_name = 'Hinduism' AND c.religion_name = 'Sikhism') OR
  (p.religion_name = 'Islam' AND c.religion_name = 'Sikhism') OR
  (p.religion_name = 'Islam' AND c.religion_name = 'Bahá''í Faith') OR
  (p.religion_name = 'Ancient Greek Religion' AND c.religion_name = 'Roman Religion')
AND NOT EXISTS (
  SELECT 1 FROM religion_relationships
  WHERE parent_id = p.religion_id AND child_id = c.religion_id
);

-- 7. Log the results of the updates
SELECT 'Updated religion_beliefs: ' || COUNT(*) FROM religion_beliefs;
SELECT 'Updated religions continents: ' || COUNT(*) FROM religions;
SELECT 'Religions without era_id: ' || COUNT(*) FROM religions WHERE era_id IS NULL;
SELECT 'Religion relationships: ' || COUNT(*) FROM religion_relationships;

-- 8. Clean up the mapping tables
DROP TABLE IF EXISTS belief_mapping;
DROP TABLE IF EXISTS continent_mapping;
DROP TABLE IF EXISTS religion_name_mapping;