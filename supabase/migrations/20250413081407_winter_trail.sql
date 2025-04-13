/*
  # Populate Eras Table
  
  1. Changes
    - Inserts basic era data for the religion timeline
    - Creates standard historical periods from prehistoric to modern times
*/

-- Insert eras data
INSERT INTO eras (id, name, start_year, end_year, description)
VALUES
  (gen_random_uuid(), 'Prehistoric', -100000, -3000, 'The earliest period of human history, before written records, when spiritual beliefs began to emerge.'),
  (gen_random_uuid(), 'Stone Age Religions', -50000, -3000, 'Early animistic and shamanistic traditions of prehistoric humans.'),
  (gen_random_uuid(), 'Bronze Age', -3300, -1200, 'Period of early civilizations with developed religious institutions and pantheons.'),
  (gen_random_uuid(), 'Iron Age', -1200, -500, 'Era that saw the development of many major religious and philosophical traditions.'),
  (gen_random_uuid(), 'Classical Antiquity', -800, 600, 'Period of Greco-Roman and early major world religious developments.'),
  (gen_random_uuid(), 'Early Middle Ages', 500, 1000, 'Post-Roman period with spread of Christianity, Islam, and evolution of religious institutions.'),
  (gen_random_uuid(), 'High Middle Ages', 1000, 1300, 'Period of religious consolidation and influence in society.'),
  (gen_random_uuid(), 'Renaissance', 1300, 1600, 'Period of cultural rebirth and religious reformation.'),
  (gen_random_uuid(), 'Early Modern Period', 1600, 1800, 'Era of religious diversification and enlightenment thinking.'),
  (gen_random_uuid(), 'Modern Age', 1800, 1945, 'Period of scientific advancement and religious adaptation.'),
  (gen_random_uuid(), 'Contemporary Period', 1945, EXTRACT(YEAR FROM CURRENT_DATE)::int, 'Modern era with religious pluralism and new spiritual movements.');