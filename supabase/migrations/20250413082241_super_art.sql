/*
  # Populate Religions Data
  
  1. Changes
    - Adds helper functions for data processing
    - Populates religion tables with core religion data
    - Creates relationships between religions
*/

-- Helper function to create a slug from religion name
CREATE OR REPLACE FUNCTION create_slug(name_text text) 
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(name_text, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to get era_id by name
CREATE OR REPLACE FUNCTION get_era_id(era_name text) 
RETURNS uuid AS $$
DECLARE
  era_id uuid;
BEGIN
  -- Try to match exactly first
  SELECT id INTO era_id FROM eras WHERE name = era_name;
  
  -- If not found, try a more flexible match
  IF era_id IS NULL THEN
    SELECT id INTO era_id FROM eras 
    WHERE era_name ILIKE '%' || name || '%' OR name ILIKE '%' || era_name || '%'
    LIMIT 1;
  END IF;
  
  -- If still not found, default to Contemporary Period
  IF era_id IS NULL THEN
    SELECT id INTO era_id FROM eras WHERE name = 'Contemporary Period';
  END IF;
  
  RETURN era_id;
END;
$$ LANGUAGE plpgsql;

-- Function to parse year string to integer
CREATE OR REPLACE FUNCTION parse_year(year_text text) 
RETURNS integer AS $$
DECLARE
  result integer := NULL;
BEGIN
  -- Try to extract numeric values
  IF year_text ~ '[0-9]+' THEN
    result := (regexp_matches(year_text, '([0-9]+)'))[1]::integer;
    
    -- Check if BCE/BC (negative year)
    IF year_text ~* 'BCE|BC' THEN
      result := -result;
    END IF;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert main religions data
DO $$
DECLARE
  new_religion_id uuid;
  hinduism_id uuid := '71f0d6d0-8b3a-4270-9f45-b373a27fa0f5';
  buddhism_id uuid := '8f0d6d00-8b3a-4270-9f45-b373a27fa0f6'; -- Fixed UUID format
  judaism_id uuid := 'a2f0d6d0-8b3a-4270-9f45-b373a27fa0f7';
  christianity_id uuid := 'b3f0d6d0-8b3a-4270-9f45-b373a27fa0f8';
  islam_id uuid := 'c4f0d6d0-8b3a-4270-9f45-b373a27fa0f9';
BEGIN
  -- Insert Hinduism
  INSERT INTO religions (
    id, slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    hinduism_id, 
    'hinduism',
    'Hinduism',
    'One of the oldest religions, originating in the Indian subcontinent.',
    'Hinduism is a diverse family of religions with roots dating back to ancient times. It encompasses a rich variety of beliefs and practices, including the concepts of dharma, karma, and reincarnation.',
    NULL,
    -1500,
    'Asia',
    'India',
    'active',
    1200000000,
    get_era_id('Bronze Age')
  );
  
  -- Insert beliefs for Hinduism
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES 
    (hinduism_id, 'Polytheism'),
    (hinduism_id, 'Pantheism'),
    (hinduism_id, 'Monotheism');
  
  -- Insert practices for Hinduism
  INSERT INTO religion_practices (religion_id, practice)
  VALUES 
    (hinduism_id, 'Yoga'),
    (hinduism_id, 'Meditation'),
    (hinduism_id, 'Puja (worship)'),
    (hinduism_id, 'Pilgrimage');
  
  -- Insert texts for Hinduism
  INSERT INTO religion_texts (religion_id, text_name)
  VALUES 
    (hinduism_id, 'Vedas'),
    (hinduism_id, 'Upanishads'),
    (hinduism_id, 'Bhagavad Gita'),
    (hinduism_id, 'Puranas');
  
  -- Insert key figures for Hinduism
  INSERT INTO religion_figures (religion_id, figure_name)
  VALUES 
    (hinduism_id, 'Vishnu'),
    (hinduism_id, 'Shiva'),
    (hinduism_id, 'Brahma'),
    (hinduism_id, 'Krishna'),
    (hinduism_id, 'Ganesh');
  
  -- Insert branches for Hinduism
  INSERT INTO religion_branches (religion_id, branch_name)
  VALUES 
    (hinduism_id, 'Vaishnavism'),
    (hinduism_id, 'Shaivism'),
    (hinduism_id, 'Shaktism'),
    (hinduism_id, 'Smartism');

  -- Insert Buddhism
  INSERT INTO religions (
    id, slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    buddhism_id, 
    'buddhism',
    'Buddhism',
    'A path of practice and spiritual development leading to insight into the true nature of reality.',
    'Buddhism is a religion and philosophical system based on the teachings of Siddhartha Gautama, the Buddha. It emphasizes personal spiritual development and the attainment of deep insight into the true nature of life.',
    'Siddhartha Gautama (Buddha)',
    -563,
    'Asia',
    'India',
    'active',
    500000000,
    get_era_id('Classical Antiquity')
  );
  
  -- Insert beliefs for Buddhism
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES 
    (buddhism_id, 'Nontheism');
  
  -- Insert practices for Buddhism
  INSERT INTO religion_practices (religion_id, practice)
  VALUES 
    (buddhism_id, 'Meditation'),
    (buddhism_id, 'Mindfulness'),
    (buddhism_id, 'Chanting'),
    (buddhism_id, 'Pilgrimage');
  
  -- Insert texts for Buddhism
  INSERT INTO religion_texts (religion_id, text_name)
  VALUES 
    (buddhism_id, 'Tripitaka'),
    (buddhism_id, 'Sutras'),
    (buddhism_id, 'Abhidharma');
  
  -- Insert key figures for Buddhism
  INSERT INTO religion_figures (religion_id, figure_name)
  VALUES 
    (buddhism_id, 'Buddha'),
    (buddhism_id, 'Dalai Lama'),
    (buddhism_id, 'Thich Nhat Hanh');
  
  -- Insert branches for Buddhism
  INSERT INTO religion_branches (religion_id, branch_name)
  VALUES 
    (buddhism_id, 'Theravada'),
    (buddhism_id, 'Mahayana'),
    (buddhism_id, 'Vajrayana'),
    (buddhism_id, 'Zen');

  -- Insert Judaism
  INSERT INTO religions (
    id, slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    judaism_id, 
    'judaism',
    'Judaism',
    'The oldest of the three Abrahamic faiths, centered on belief in one God and the Torah.',
    'Judaism is a monotheistic religion centered on the belief in one God and the study and practice of the laws and ethics found in the Torah, Talmud, and other Jewish texts.',
    'Abraham/Moses',
    -1800,
    'Asia',
    'Israel/Palestine',
    'active',
    15000000,
    get_era_id('Iron Age')
  );
  
  -- Insert beliefs for Judaism
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES 
    (judaism_id, 'Monotheism');
  
  -- Insert practices for Judaism
  INSERT INTO religion_practices (religion_id, practice)
  VALUES 
    (judaism_id, 'Prayer'),
    (judaism_id, 'Torah study'),
    (judaism_id, 'Observance of Shabbat and holidays');
  
  -- Insert texts for Judaism
  INSERT INTO religion_texts (religion_id, text_name)
  VALUES 
    (judaism_id, 'Tanakh (Hebrew Bible)'),
    (judaism_id, 'Talmud'),
    (judaism_id, 'Midrash');
  
  -- Insert key figures for Judaism
  INSERT INTO religion_figures (religion_id, figure_name)
  VALUES 
    (judaism_id, 'Abraham'),
    (judaism_id, 'Moses'),
    (judaism_id, 'David'),
    (judaism_id, 'Solomon');
  
  -- Insert branches for Judaism
  INSERT INTO religion_branches (religion_id, branch_name)
  VALUES 
    (judaism_id, 'Orthodox'),
    (judaism_id, 'Conservative'),
    (judaism_id, 'Reform'),
    (judaism_id, 'Reconstructionist');

  -- Insert Christianity
  INSERT INTO religions (
    id, slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    christianity_id, 
    'christianity',
    'Christianity',
    'An Abrahamic religion based on the life and teachings of Jesus Christ.',
    'Christianity is centered on the life and teachings of Jesus of Nazareth, whom Christians believe to be the Son of God and the savior of humanity. Christianity is the world''s largest religion, with about 2.4 billion followers.',
    'Jesus Christ',
    30,
    'Asia',
    'Israel/Palestine',
    'active',
    2400000000,
    get_era_id('Classical Antiquity')
  );
  
  -- Insert beliefs for Christianity
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES 
    (christianity_id, 'Monotheism');
  
  -- Insert practices for Christianity
  INSERT INTO religion_practices (religion_id, practice)
  VALUES 
    (christianity_id, 'Prayer'),
    (christianity_id, 'Worship services'),
    (christianity_id, 'Communion'),
    (christianity_id, 'Baptism');
  
  -- Insert texts for Christianity
  INSERT INTO religion_texts (religion_id, text_name)
  VALUES 
    (christianity_id, 'Bible (Old and New Testaments)');
  
  -- Insert key figures for Christianity
  INSERT INTO religion_figures (religion_id, figure_name)
  VALUES 
    (christianity_id, 'Jesus Christ'),
    (christianity_id, 'Apostles'),
    (christianity_id, 'Paul'),
    (christianity_id, 'Mary');
  
  -- Insert branches for Christianity
  INSERT INTO religion_branches (religion_id, branch_name)
  VALUES 
    (christianity_id, 'Catholicism'),
    (christianity_id, 'Protestantism'),
    (christianity_id, 'Eastern Orthodoxy'),
    (christianity_id, 'Oriental Orthodoxy');

  -- Insert Islam
  INSERT INTO religions (
    id, slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    islam_id, 
    'islam',
    'Islam',
    'An Abrahamic monotheistic religion centered on the Quran and the teachings of Muhammad.',
    'Islam is an Abrahamic monotheistic religion teaching that there is only one God (Allah) and that Muhammad is a messenger of God. It is the world''s second-largest religion with 1.9 billion followers.',
    'Muhammad',
    610,
    'Asia',
    'Saudi Arabia',
    'active',
    1900000000,
    get_era_id('Early Middle Ages')
  );
  
  -- Insert beliefs for Islam
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES 
    (islam_id, 'Monotheism');
  
  -- Insert practices for Islam
  INSERT INTO religion_practices (religion_id, practice)
  VALUES 
    (islam_id, 'Five Pillars of Islam'),
    (islam_id, 'Salat (prayer)'),
    (islam_id, 'Sawm (fasting)'),
    (islam_id, 'Hajj (pilgrimage)');
  
  -- Insert texts for Islam
  INSERT INTO religion_texts (religion_id, text_name)
  VALUES 
    (islam_id, 'Quran'),
    (islam_id, 'Hadith');
  
  -- Insert key figures for Islam
  INSERT INTO religion_figures (religion_id, figure_name)
  VALUES 
    (islam_id, 'Muhammad'),
    (islam_id, 'Abu Bakr'),
    (islam_id, 'Umar'),
    (islam_id, 'Uthman'),
    (islam_id, 'Ali');
  
  -- Insert branches for Islam
  INSERT INTO religion_branches (religion_id, branch_name)
  VALUES 
    (islam_id, 'Sunni'),
    (islam_id, 'Shia'),
    (islam_id, 'Sufism');

  -- Add relationships between religions
  INSERT INTO religion_relationships (parent_id, child_id, relationship_type)
  VALUES 
    (hinduism_id, buddhism_id, 'parent-child'),
    (judaism_id, christianity_id, 'parent-child'),
    (judaism_id, islam_id, 'parent-child'),
    (christianity_id, islam_id, 'parent-child');
END $$;

-- Add additional religions (individually to avoid issues with special characters)
DO $$
DECLARE
  new_religion_id uuid;
  bahai_id uuid;
  islam_id uuid := 'c4f0d6d0-8b3a-4270-9f45-b373a27fa0f9';
  christianity_id uuid := 'b3f0d6d0-8b3a-4270-9f45-b373a27fa0f8';
  hinduism_id uuid := '71f0d6d0-8b3a-4270-9f45-b373a27fa0f5';
  modern_era_id uuid;
  early_modern_id uuid;
  contemporary_id uuid;
BEGIN
  -- Get era IDs for later use
  SELECT id INTO modern_era_id FROM eras WHERE name = 'Modern Age' LIMIT 1;
  IF modern_era_id IS NULL THEN
    SELECT id INTO modern_era_id FROM eras WHERE name ILIKE '%modern%' LIMIT 1;
  END IF;
  
  SELECT id INTO early_modern_id FROM eras WHERE name = 'Early Modern Period' LIMIT 1;
  IF early_modern_id IS NULL THEN
    SELECT id INTO early_modern_id FROM eras WHERE name ILIKE '%early modern%' LIMIT 1;
  END IF;
  
  SELECT id INTO contemporary_id FROM eras WHERE name = 'Contemporary Period' LIMIT 1;
  IF contemporary_id IS NULL THEN
    SELECT id INTO contemporary_id FROM eras WHERE name ILIKE '%contemporary%' LIMIT 1;
  END IF;
  
  -- Use the most recent era if none of the above were found
  IF modern_era_id IS NULL AND early_modern_id IS NULL AND contemporary_id IS NULL THEN
    SELECT id INTO contemporary_id FROM eras ORDER BY end_year DESC LIMIT 1;
  END IF;
  
  -- 1. Bahá'í Faith
  INSERT INTO religions (
    slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    'bahai-faith',
    'Bahá''í Faith',
    'A religion teaching the essential worth of all religions and the unity of all people.',
    'Unity of humanity, equality, education, elimination of prejudice, peace, justice',
    'Bahá''u''lláh',
    1800,
    'Middle East (West Asia)',
    'Persia (modern-day Iran)',
    'active',
    7500000,
    COALESCE(modern_era_id, contemporary_id)
  )
  RETURNING id INTO bahai_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (bahai_id, 'Monotheism');
  
  -- Insert practices
  INSERT INTO religion_practices (religion_id, practice)
  VALUES 
    (bahai_id, 'Prayer'),
    (bahai_id, 'Fasting');
  
  -- Insert texts
  INSERT INTO religion_texts (religion_id, text_name)
  VALUES 
    (bahai_id, 'Writings of Bahá''u''lláh'),
    (bahai_id, 'The Kitáb-i-Aqdas'),
    (bahai_id, 'The Kitáb-i-Íqán');
  
  -- Insert figures
  INSERT INTO religion_figures (religion_id, figure_name)
  VALUES (bahai_id, 'Bahá''u''lláh');
  
  -- Add relationship with Islam if Islam exists
  IF islam_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (islam_id, bahai_id);
  END IF;
  
  -- 2. Spiritualism
  INSERT INTO religions (
    slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    'spiritualism',
    'Spiritualism',
    'A spiritual movement that emerged in the 19th century based on communication with spirits.',
    'Communication with spirits of the dead, survival of human personality, mediums',
    'Emanuel Swedenborg',
    1800,
    'North America',
    'United States',
    'active',
    NULL,
    COALESCE(modern_era_id, contemporary_id)
  )
  RETURNING id INTO new_religion_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (new_religion_id, 'Belief in Spirits');
  
  -- Insert practices
  INSERT INTO religion_practices (religion_id, practice)
  VALUES (new_religion_id, 'Seances');
  
  -- Insert texts
  INSERT INTO religion_texts (religion_id, text_name)
  VALUES (new_religion_id, 'Various spiritualist writings');
  
  -- 3. Vodou
  INSERT INTO religions (
    slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    'vodou',
    'Vodou',
    'A syncretic religion that combines African traditions with Catholicism.',
    'Synthesis of African animism, spirit worship, Catholicism, belief in spirits (lwa), ancestral reverence',
    NULL,
    1600,
    'Africa',
    'West Africa (Benin, Togo), Haiti',
    'active',
    70000000,
    COALESCE(early_modern_id, modern_era_id)
  )
  RETURNING id INTO new_religion_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (new_religion_id, 'Polytheism');
  
  -- Insert practices
  INSERT INTO religion_practices (religion_id, practice)
  VALUES 
    (new_religion_id, 'Ritual possession'),
    (new_religion_id, 'Offerings');
  
  -- 4. Aztec Religion
  INSERT INTO religions (
    slug, name, summary, description, founder_name, founding_year, 
    end_year, continent, origin_country, status, era_id
  )
  VALUES (
    'aztec-religion',
    'Aztec Religion',
    'The religious traditions of the Aztec civilization.',
    'Cosmovision based on warfare, agricultural cycles, human sacrifice, various destinies based on type of death',
    'Huitzilopochtli',
    1300,
    1521,
    'North America',
    'Central Mexico',
    'extinct',
    COALESCE(early_modern_id, modern_era_id)
  )
  RETURNING id INTO new_religion_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (new_religion_id, 'Polytheism');
  
  -- Insert practices
  INSERT INTO religion_practices (religion_id, practice)
  VALUES 
    (new_religion_id, 'Human sacrifice'),
    (new_religion_id, 'Ceremonial feasting');
  
  -- Insert texts
  INSERT INTO religion_texts (religion_id, text_name)
  VALUES 
    (new_religion_id, 'Codex Borgia'),
    (new_religion_id, 'Codex Borbonicus');
    
  -- 5. Inca Religion
  INSERT INTO religions (
    slug, name, summary, description, founding_year, 
    end_year, continent, origin_country, status, era_id
  )
  VALUES (
    'inca-religion',
    'Inca Religion',
    'The religious system of the Inca civilization.',
    'Reciprocity with gods, nature, concept of ''ayni'' or mutual aid, underworld called Ukhu Pacha',
    1200,
    1533,
    'South America',
    'Andes region',
    'extinct',
    COALESCE(early_modern_id, modern_era_id)
  )
  RETURNING id INTO new_religion_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (new_religion_id, 'Polytheism');
  
  -- Add key deities
  INSERT INTO religion_figures (religion_id, figure_name)
  VALUES 
    (new_religion_id, 'Inti'),
    (new_religion_id, 'Viracocha');
    
  -- 6. Māori Religion
  INSERT INTO religions (
    slug, name, summary, description, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    'maori-religion',
    'Māori Religion',
    'The indigenous religious beliefs and practices of the Māori people.',
    'Mana, tapu, importance of ancestry, spiritual afterlife in Hawaiki',
    1300,
    'Australia/Oceania',
    'New Zealand',
    'active',
    640000,
    COALESCE(early_modern_id, modern_era_id)
  )
  RETURNING id INTO new_religion_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (new_religion_id, 'Polytheism');
  
  -- Add key figures
  INSERT INTO religion_figures (religion_id, figure_name)
  VALUES 
    (new_religion_id, 'Tāne'),
    (new_religion_id, 'Tangaroa');
    
  -- 7. Protestant Reformation
  INSERT INTO religions (
    slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    'protestantism',
    'Protestantism',
    'A major branch of Christianity that emerged from the Reformation movement.',
    'Critique of Catholic Church practices, emphasis on salvation through faith alone',
    'Martin Luther',
    1500,
    'Europe',
    'Germany',
    'active',
    850000000,
    get_era_id('Renaissance')
  )
  RETURNING id INTO new_religion_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (new_religion_id, 'Monotheism');
  
  -- Add relationship with Christianity if Christianity exists
  IF christianity_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (christianity_id, new_religion_id);
  END IF;
  
  -- 8. Mormonism
  INSERT INTO religions (
    slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    'mormonism',
    'Mormonism',
    'A restorationist Christian denomination founded by Joseph Smith.',
    'Belief in additional scriptures including the Book of Mormon, belief in modern prophets, emphasis on family',
    'Joseph Smith Jr.',
    1830,
    'North America',
    'United States',
    'active',
    16000000,
    COALESCE(contemporary_id, modern_era_id)
  )
  RETURNING id INTO new_religion_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (new_religion_id, 'Monotheism');
  
  -- Add relationship with Christianity if Christianity exists
  IF christianity_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (christianity_id, new_religion_id);
  END IF;
  
  -- 9. Sikhism
  INSERT INTO religions (
    slug, name, summary, description, founder_name, founding_year, 
    continent, origin_country, status, approx_followers, era_id
  )
  VALUES (
    'sikhism',
    'Sikhism',
    'A monotheistic religion founded in the Punjab region of South Asia in the 15th century.',
    'Equality, selfless service, community, belief in reincarnation, belief in afterlife',
    'Guru Nanak',
    1500,
    'Asia',
    'Punjab',
    'active',
    30000000,
    COALESCE(early_modern_id, modern_era_id)
  )
  RETURNING id INTO new_religion_id;
  
  -- Insert beliefs
  INSERT INTO religion_beliefs (religion_id, belief)
  VALUES (new_religion_id, 'Monotheism');
  
  -- Add key relationships if parent religions exist
  IF hinduism_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (hinduism_id, new_religion_id);
  END IF;
  
  IF islam_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (islam_id, new_religion_id);
  END IF;
END $$;

-- Add additional religions from dataset (each in separate statements)
DO $$
DECLARE
  new_id uuid;
  era_id uuid;
  christianity_id uuid := 'b3f0d6d0-8b3a-4270-9f45-b373a27fa0f8';
BEGIN
  -- Shinto
  SELECT get_era_id('Early Middle Ages') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('shinto', 'Shinto', 'Kami (spirits), rituals, harmony with nature', 600, 'East Asia', 'Japan', 'active', 2800000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Polytheism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Zoroastrianism
  SELECT get_era_id('Iron Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('zoroastrianism', 'Zoroastrianism', 'One of the world''s oldest continuously practiced religions', -1000, 'Asia', 'Iran', 'active', 200000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Monotheism');
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Dualism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Confucianism
  SELECT get_era_id('Classical Antiquity') INTO era_id;
  INSERT INTO religions (slug, name, summary, founder_name, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('confucianism', 'Confucianism', 'Emphasis on moral values, family harmony, and social order', 'Confucius', -500, 'East Asia', 'China', 'active', 6000000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Non-theistic');
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Philosophical');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
  hinduism_id uuid := '71f0d6d0-8b3a-4270-9f45-b373a27fa0f5';
BEGIN
  -- Jainism
  SELECT get_era_id('Classical Antiquity') INTO era_id;
  INSERT INTO religions (slug, name, summary, founder_name, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('jainism', 'Jainism', 'Non-violence (Ahimsa), self-discipline, asceticism', 'Mahavira', -527, 'Asia', 'India', 'active', 4200000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Non-theistic');
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Philosophical');
  
  -- Add relationship with Hinduism if it exists
  IF hinduism_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (hinduism_id, new_id);
  END IF;
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Ancient Greek Religion
  SELECT get_era_id('Iron Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, end_year, continent, origin_country, status, era_id)
  VALUES ('ancient-greek-religion', 'Ancient Greek Religion', 'Worship of pantheon of gods and goddesses, afterlife realm', -800, 400, 'Europe', 'Ancient Greece', 'extinct', era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Polytheism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Roman Religion
  SELECT get_era_id('Iron Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, end_year, continent, origin_country, status, era_id)
  VALUES ('roman-religion', 'Roman Religion', 'Worship of pantheon of gods and goddesses, afterlife beliefs', -800, 400, 'Europe', 'Ancient Rome', 'extinct', era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Polytheism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Taoism (Daoism)
  SELECT get_era_id('Classical Antiquity') INTO era_id;
  INSERT INTO religions (slug, name, summary, founder_name, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('daoism', 'Daoism (Taoism)', 'Wu wei, naturalness, simplicity', 'Laozi', 142, 'East Asia', 'China', 'active', 25000000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Polytheism');
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Philosophical');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Druidism
  SELECT get_era_id('Iron Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, end_year, continent, origin_country, status, era_id)
  VALUES ('druidism', 'Druidism (Celtic Religion)', 'Worship of Celtic deities, reverence for nature', -1200, 43, 'Europe', 'Celtic regions', 'extinct', era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Polytheism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Yoruba
  SELECT get_era_id('Iron Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('yoruba', 'Yoruba', 'Worship of Orishas, ancestor veneration, divination', -1000, 'Africa', 'West Africa, Nigeria', 'active', 40000000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Polytheism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Norse Paganism
  SELECT get_era_id('Early Middle Ages') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, end_year, continent, origin_country, status, era_id)
  VALUES ('norse-paganism', 'Norse Paganism (Viking Age)', 'Worship of Norse gods and goddesses', 800, 1100, 'Europe', 'Scandinavia', 'extinct', era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Polytheism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Ancient Egyptian Religion
  SELECT get_era_id('Bronze Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, end_year, continent, origin_country, status, era_id)
  VALUES ('ancient-egyptian', 'Ancient Egyptian Religion', 'Ma''at (order, balance), afterlife', -3100, 395, 'Africa', 'Nile Valley', 'extinct', era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Polytheism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Stone Age Animism
  SELECT get_era_id('Stone Age Religions') INTO era_id;
  IF era_id IS NULL THEN
    SELECT get_era_id('Prehistoric') INTO era_id;
  END IF;
  
  INSERT INTO religions (slug, name, summary, founding_year, continent, status, era_id)
  VALUES ('stone-age-animism', 'Stone Age Animism', 'Perception of spirits, natural elements', -50000, 'Global', 'extinct', era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Animism');
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
  christianity_id uuid := 'b3f0d6d0-8b3a-4270-9f45-b373a27fa0f8';
BEGIN
  -- Quakerism
  SELECT get_era_id('Early Modern Period') INTO era_id;
  INSERT INTO religions (slug, name, summary, founder_name, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('quakerism', 'Quakerism', 'Emphasis on direct experience of God through "inner light"', 'George Fox', 1650, 'Europe', 'England', 'active', 400000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Monotheism');
  
  -- Add relationship with Christianity if it exists
  IF christianity_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (christianity_id, new_id);
  END IF;
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
  christianity_id uuid := 'b3f0d6d0-8b3a-4270-9f45-b373a27fa0f8';
BEGIN
  -- Methodism
  SELECT get_era_id('Modern Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founder_name, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('methodism', 'Methodism', 'Emphasis on methodical spiritual disciplines, personal holiness', 'John Wesley', 1730, 'Europe', 'England', 'active', 80000000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Monotheism');
  
  -- Add relationship with Christianity if it exists
  IF christianity_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (christianity_id, new_id);
  END IF;
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
  christianity_id uuid := 'b3f0d6d0-8b3a-4270-9f45-b373a27fa0f8';
BEGIN
  -- Unitarianism
  SELECT get_era_id('Modern Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, continent, status, approx_followers, era_id)
  VALUES ('unitarianism', 'Unitarianism', 'Belief in the unity of God rather than the Trinity', 1650, 'Europe', 'active', 800000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Monotheism');
  
  -- Add relationship with Christianity if it exists
  IF christianity_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (christianity_id, new_id);
  END IF;
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
  christianity_id uuid := 'b3f0d6d0-8b3a-4270-9f45-b373a27fa0f8';
BEGIN
  -- Pentecostalism
  SELECT get_era_id('Contemporary Period') INTO era_id;
  INSERT INTO religions (slug, name, summary, founding_year, continent, origin_country, status, approx_followers, era_id)
  VALUES ('pentecostalism', 'Pentecostalism', 'Emphasis on spiritual gifts, dynamic worship, speaking in tongues', 1906, 'North America', 'United States', 'active', 280000000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Monotheism');
  
  -- Add relationship with Christianity if it exists
  IF christianity_id IS NOT NULL THEN
    INSERT INTO religion_relationships (parent_id, child_id)
    VALUES (christianity_id, new_id);
  END IF;
END $$;

DO $$
DECLARE
  new_id uuid;
  era_id uuid;
BEGIN
  -- Theosophy
  SELECT get_era_id('Modern Age') INTO era_id;
  INSERT INTO religions (slug, name, summary, founder_name, founding_year, continent, status, approx_followers, era_id)
  VALUES ('theosophy', 'Theosophy', 'Synthesis of Eastern and Western spiritual traditions', 'Helena Blavatsky', 1875, 'Europe', 'active', 10000, era_id)
  RETURNING id INTO new_id;
  
  INSERT INTO religion_beliefs (religion_id, belief) VALUES (new_id, 'Philosophical');
END $$;

-- Drop helper functions
DROP FUNCTION IF EXISTS create_slug;
DROP FUNCTION IF EXISTS get_era_id;
DROP FUNCTION IF EXISTS parse_year;