-- Seed pre-made syllabus flashcard decks for Junior and Senior levels.
-- Each deck is a template (user_id=NULL, is_template=true).
-- Run after 003_template_decks.sql.

BEGIN;

-- ============================================================
--  JUNIOR GRADE DECKS
-- ============================================================

-- Junior: Natyothpatthi (Origin of Dance)
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0001-4000-8000-000000000001', NULL, 'Junior: Origin of Dance (Natyothpatthi)', 'Junior', 'Bharatanatyam', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', 'According to Natyashasthra, who created Natya?', 'Lord Brahma created Natya (Natyaveda) by taking elements from the four Vedas: Pathya (words) from Rigveda, Abhinaya (gestures) from Yajurveda, Geeth (music) from Samaveda, and Rasa (aesthetic sentiment) from Atharvaveda.', 0, NOW()),
('c0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000001', 'What are the four elements Brahma drew from the Vedas to create Natyaveda?', 'Pathya (words/text) from Rigveda, Abhinaya (gesture/expression) from Yajurveda, Geeth (music/song) from Samaveda, and Rasa (aesthetic sentiment) from Atharvaveda.', 0, NOW()),
('c0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000001', 'Who is considered the first teacher of Natya according to Natyashasthra?', 'Sage Bharata Muni is considered the first teacher of Natya. Lord Brahma taught him the Natyaveda, and Bharata then propagated it.', 0, NOW()),
('c0000001-0001-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000001', 'What is the meaning of the word "Bharatanatyam"?', 'Bharatanatyam is derived from the syllables BHA (Bhava - expression), RA (Raga - music), TA (Tala - rhythm) and Natyam (dance/drama). Together it means the dance that combines expression, melody, and rhythm.', 0, NOW()),
('c0000001-0001-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000001', 'What was Bharatanatyam previously known as?', 'Bharatanatyam was previously known as Sadir Attam (or Dasi Attam), practiced by Devadasis in temples of South India.', 0, NOW()),
('c0000001-0001-4000-8000-000000000006', 'a0000001-0001-4000-8000-000000000001', 'What is Natyashasthra?', 'Natyashasthra is the ancient Indian treatise on performing arts authored by Sage Bharata Muni. It covers drama, dance, music, stage design, and aesthetics. It is considered the oldest surviving text on dramaturgy.', 0, NOW()),
('c0000001-0001-4000-8000-000000000007', 'a0000001-0001-4000-8000-000000000001', 'What is Abhinayadarpanam?', 'Abhinayadarpanam ("Mirror of Gesture") is a treatise on dance and abhinaya written by Nandikeshwara. It details hastha mudras, bhedas, and is widely referenced in Bharatanatyam training.', 0, NOW()),
('c0000001-0001-4000-8000-000000000008', 'a0000001-0001-4000-8000-000000000001', 'What are the three components of Bharatanatyam?', 'Nritta (pure rhythmic dance without expression), Nritya (expressive dance combining rhythm and emotion), and Natya (dramatic dance or dance-drama with a story).', 0, NOW());

-- Junior: Classical Dance Forms
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0002-4000-8000-000000000001', NULL, 'Junior: Eight Indian Classical Dance Forms', 'Junior', 'Classical Dances', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000002-0001-4000-8000-000000000001', 'a0000001-0002-4000-8000-000000000001', 'Name all eight Indian classical dance forms.', 'Bharatanatyam (Tamil Nadu), Kuchipudi (Andhra Pradesh), Mohini Attam (Kerala), Kathakali (Kerala), Kathak (North India), Manipuri (Manipur), Odissi (Odisha), and Sattriya (Assam).', 0, NOW()),
('c0000002-0001-4000-8000-000000000002', 'a0000001-0002-4000-8000-000000000001', 'Which state does Bharatanatyam originate from?', 'Bharatanatyam originates from Tamil Nadu in South India. It is one of the oldest classical dance forms, rooted in Natyashasthra.', 0, NOW()),
('c0000002-0001-4000-8000-000000000003', 'a0000001-0002-4000-8000-000000000001', 'What is Kuchipudi and where does it originate?', 'Kuchipudi is a classical dance-drama form originating from the village of Kuchipudi in Andhra Pradesh. It combines fast rhythmic footwork with expressive storytelling.', 0, NOW()),
('c0000002-0001-4000-8000-000000000004', 'a0000001-0002-4000-8000-000000000001', 'What is Kathakali known for?', 'Kathakali from Kerala is known for its elaborate makeup, colorful costumes, and dramatic storytelling based on Hindu epics. It emphasizes Angika Abhinaya with exaggerated facial expressions.', 0, NOW()),
('c0000002-0001-4000-8000-000000000005', 'a0000001-0002-4000-8000-000000000001', 'Which classical dance form is also called the "Dance of the Enchantress"?', 'Mohini Attam (from Kerala) is called the "Dance of the Enchantress." It is characterized by graceful swaying movements and feminine expressions (Lasya style).', 0, NOW()),
('c0000002-0001-4000-8000-000000000006', 'a0000001-0002-4000-8000-000000000001', 'What are the key features of Kathak?', 'Kathak (North India) is known for fast spins (chakkars), intricate footwork (tatkar), expressive storytelling, and influences from both Hindu and Mughal court traditions.', 0, NOW()),
('c0000002-0001-4000-8000-000000000007', 'a0000001-0002-4000-8000-000000000001', 'What is unique about Manipuri dance?', 'Manipuri from Manipur is known for its gentle, graceful movements and rounded body posture. It often depicts Radha-Krishna themes (Ras Leela) and avoids sharp or angular movements.', 0, NOW()),
('c0000002-0001-4000-8000-000000000008', 'a0000001-0002-4000-8000-000000000001', 'What is Odissi and its distinguishing features?', 'Odissi from Odisha is one of the oldest classical forms featuring the Tribhangi posture (three-body bends) and Chouka (square stance). Temple sculptures at Konark are key references.', 0, NOW()),
('c0000002-0001-4000-8000-000000000009', 'a0000001-0002-4000-8000-000000000001', 'What is Sattriya?', 'Sattriya is a classical dance from Assam, created by the 15th-century saint Shankaradeva. It was traditionally performed in Vaishnava monasteries (Sattras) depicting stories of Krishna.', 0, NOW());

-- Junior: Tala
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0003-4000-8000-000000000001', NULL, 'Junior: Tala System', 'Junior', 'Tala', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000003-0001-4000-8000-000000000001', 'a0000001-0003-4000-8000-000000000001', 'What are the three basic Tala Angas (limbs)?', 'Laghu (clap + finger counts), Dhrutha (clap + wave), and Anudhrutha (a single clap).', 0, NOW()),
('c0000003-0001-4000-8000-000000000002', 'a0000001-0003-4000-8000-000000000001', 'Name the five Jaathis and their counts.', 'Tishra (3 counts), Chaturashra (4 counts), Khanda (5 counts), Mishra (7 counts), and Sankeerna (9 counts).', 0, NOW()),
('c0000003-0001-4000-8000-000000000003', 'a0000001-0003-4000-8000-000000000001', 'What is Adi Tala and its structure?', 'Adi Tala is Chaturashra Jaathi Triputa Tala. Its structure is one Laghu (4 counts) + two Dhruthas (2+2 counts) = 8 beats total.', 0, NOW()),
('c0000003-0001-4000-8000-000000000004', 'a0000001-0003-4000-8000-000000000001', 'What is Roopaka Tala?', 'Roopaka Tala consists of one Dhrutha + one Laghu = 2 + 4 = 6 beats in Chaturashra Jaathi.', 0, NOW()),
('c0000003-0001-4000-8000-000000000005', 'a0000001-0003-4000-8000-000000000001', 'What are the three speeds (Trikalas) in Bharatanatyam?', 'Vilamba Kala (slow speed), Madhyama Kala (medium speed), and Druta Kala (fast speed). Each successive speed doubles the tempo.', 0, NOW()),
('c0000003-0001-4000-8000-000000000006', 'a0000001-0003-4000-8000-000000000001', 'How many aksharas does a Laghu have in Chaturashra Jaathi?', 'A Laghu in Chaturashra Jaathi has 4 aksharas (one clap + three finger counts).', 0, NOW()),
('c0000003-0001-4000-8000-000000000007', 'a0000001-0003-4000-8000-000000000001', 'How many aksharas does a Dhrutha have?', 'A Dhrutha always has 2 aksharas (one clap + one wave), regardless of Jaathi.', 0, NOW());

-- Junior: Adavus
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0004-4000-8000-000000000001', NULL, 'Junior: Dashavidha Adavus', 'Junior', 'Adavus', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000004-0001-4000-8000-000000000001', 'a0000001-0004-4000-8000-000000000001', 'What are Adavus?', 'Adavus are the basic dance steps or units of Bharatanatyam. They combine footwork (pada), hand gestures (hasta), body posture (anga), and rhythmic patterns (sollukattus).', 0, NOW()),
('c0000004-0001-4000-8000-000000000002', 'a0000001-0004-4000-8000-000000000001', 'How many types of Adavus are there in Dashavidha Adavu system?', 'The Dashavidha Adavu system has ten types of Adavus, each with multiple variations practiced in three speeds.', 0, NOW()),
('c0000004-0001-4000-8000-000000000003', 'a0000001-0004-4000-8000-000000000001', 'What are the four basic elements of Adavus?', 'The four basic elements are: Sthana (standing position/posture), Nritta Hasta (hand gesture used in pure dance), Chari (leg movement), and Paada Bedha (foot position/variety).', 0, NOW()),
('c0000004-0001-4000-8000-000000000004', 'a0000001-0004-4000-8000-000000000001', 'List all ten types of Dashavidha Adavus.', '1. Tattadavu, 2. Nattadavu, 3. Visharu Adavu (Mettadavu), 4. Tattimettadavu, 5. Teermanam Adavu (Tirumanam), 6. Sarikkal Adavu (Sarukkal), 7. Mandi Adavu, 8. Kudichmettu Adavu (Kudithamettadavu), 9. Jati Adavu, 10. Murka Adavu.', 0, NOW()),
('c0000004-0001-4000-8000-000000000005', 'a0000001-0004-4000-8000-000000000001', 'What is Aramandi?', 'Aramandi is the half-sitting position fundamental to Bharatanatyam. The dancer bends the knees outward with feet turned sideways, forming a diamond shape. It is the basic stance for most Adavus.', 0, NOW()),
('c0000004-0001-4000-8000-000000000006', 'a0000001-0004-4000-8000-000000000001', 'What is Sollukattu?', 'Sollukattu refers to the rhythmic syllables recited while performing Adavus, e.g., "Tai Ya Tai Hi," "Tat Tai Ta Ha." They guide the dancer''s footwork and timing.', 0, NOW()),
('c0000004-0001-4000-8000-000000000007', 'a0000001-0004-4000-8000-000000000001', 'What is Tattadavu?', 'Tattadavu is the first and most basic Dashavidha Adavu. The dancer stamps the floor alternately with flat feet in Aramandi. It builds rhythm sense, leg strength, and correct posture. Common sollukattu: "tai ya tai hi."', 0, NOW()),
('c0000004-0001-4000-8000-000000000008', 'a0000001-0004-4000-8000-000000000001', 'What is Nattadavu?', 'Nattadavu involves stretching the leg outward (natta = stretched) while shifting weight. The working foot is placed heel-first or toe-first in a controlled extension. It trains balance, leg lines, and smooth weight transfer.', 0, NOW()),
('c0000004-0001-4000-8000-000000000009', 'a0000001-0004-4000-8000-000000000001', 'What is Visharu Adavu (Mettadavu)?', 'Visharu or Mettadavu features waving, circular leg movements where the foot traces an arc before placement. It develops fluid leg mobility and graceful transitions between positions.', 0, NOW()),
('c0000004-0001-4000-8000-000000000010', 'a0000001-0004-4000-8000-000000000001', 'What is Tattimettadavu?', 'Tattimettadavu combines tatta (flat stamp) with mettu (heel lift). The dancer alternates stamping the sole and lifting the heel, adding rhythmic complexity beyond basic Tattadavu.', 0, NOW()),
('c0000004-0001-4000-8000-000000000011', 'a0000001-0004-4000-8000-000000000001', 'What is Teermanam Adavu (Tirumanam)?', 'Teermanam or Tirumanam Adavu is used for rhythmic cadences and concluding phrases. It often involves turns or repeated patterns ending in a decisive stamp, similar to a theermanam in jathis.', 0, NOW()),
('c0000004-0001-4000-8000-000000000012', 'a0000001-0004-4000-8000-000000000001', 'What is Sarikkal Adavu (Sarukkal)?', 'Sarikkal Adavu is a sliding Adavu where one foot glides to meet the other. It trains neat foot placement, controlled slides, and precise finishing of leg lines.', 0, NOW()),
('c0000004-0001-4000-8000-000000000013', 'a0000001-0004-4000-8000-000000000001', 'What is Mandi Adavu?', 'Mandi Adavu is performed in a deep squat close to the floor (mandi stance). It develops lower-body strength, stamina, and control of the low seated position used in many compositions.', 0, NOW()),
('c0000004-0001-4000-8000-000000000014', 'a0000001-0004-4000-8000-000000000001', 'What is Kudichmettu Adavu (Kudithamettadavu)?', 'Kudichmettu Adavu includes a small jump or hop with a kick and heel lift (mettu). It adds a lively, aerial quality and prepares the dancer for more dynamic nritta passages.', 0, NOW()),
('c0000004-0001-4000-8000-000000000015', 'a0000001-0004-4000-8000-000000000001', 'What is Jati Adavu?', 'Jati Adavu uses more intricate rhythmic foot patterns, often with crossing steps or longer sollukattu sequences. It bridges basic adavus and the jathi patterns used in Alaripu and Jathiswara.', 0, NOW()),
('c0000004-0001-4000-8000-000000000016', 'a0000001-0004-4000-8000-000000000001', 'What is Murka Adavu?', 'Murka Adavu is an advanced decorative Adavu with quick, intricate footwork and characteristic nritta hastas. It demands speed, precision, and stamina, and is among the more challenging Dashavidha Adavus.', 0, NOW());

-- Junior: Musical Instruments
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0005-4000-8000-000000000001', NULL, 'Junior: Music and Instruments', 'Junior', 'Music and Instruments', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000005-0001-4000-8000-000000000001', 'a0000001-0005-4000-8000-000000000001', 'What are the four categories of musical instruments (Chaturvidha Vadya)?', 'Tatha (stringed - e.g., Veena, Tambura), Sushira (wind/blown - e.g., Flute), Avanaddha (covered/percussion - e.g., Mridangam, Tabla), and Ghana (solid/struck - e.g., Cymbals, Nattuvangam).', 0, NOW()),
('c0000005-0001-4000-8000-000000000002', 'a0000001-0005-4000-8000-000000000001', 'What is the main percussion instrument used in Bharatanatyam?', 'Mridangam is the main percussion instrument. It is a double-headed drum that provides the rhythmic foundation for Bharatanatyam performances.', 0, NOW()),
('c0000005-0001-4000-8000-000000000003', 'a0000001-0005-4000-8000-000000000001', 'What is Nattuvangam?', 'Nattuvangam refers to the pair of small cymbals used by the Nattuvanar (conductor) who recites sollukattus and keeps rhythm during a Bharatanatyam recital.', 0, NOW()),
('c0000005-0001-4000-8000-000000000004', 'a0000001-0005-4000-8000-000000000001', 'Give an example of a Tatha Vadya used in Bharatanatyam.', 'Veena is a Tatha (stringed) instrument. Tambura is also commonly used to provide the drone (shruti) during Bharatanatyam performances.', 0, NOW()),
('c0000005-0001-4000-8000-000000000005', 'a0000001-0005-4000-8000-000000000001', 'What is a Sushira Vadya? Give an example.', 'Sushira Vadya are wind instruments where sound is produced by blowing. The flute (Venu/Bansuri) is a primary example used in dance accompaniment.', 0, NOW()),
('c0000005-0001-4000-8000-000000000006', 'a0000001-0005-4000-8000-000000000001', 'What instrument category does Mridangam belong to?', 'Mridangam belongs to the Avanaddha Vadya category (covered/membrane instruments). Sound is produced by striking a stretched membrane/skin.', 0, NOW());

-- Junior: Dance Sculptures
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0006-4000-8000-000000000001', NULL, 'Junior: Dance Sculptures of Karnataka', 'Junior', 'Dance Sculptures', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000006-0001-4000-8000-000000000001', 'a0000001-0006-4000-8000-000000000001', 'Name the major Karnataka temple sites known for dance sculptures.', 'Beluru (Chennakeshava Temple), Halebeedu (Hoysaleshwara Temple), Badami (Cave Temples), Aihole, Pattadakal, and Hampi (Vijayanagara ruins).', 0, NOW()),
('c0000006-0001-4000-8000-000000000002', 'a0000001-0006-4000-8000-000000000001', 'What is special about the Beluru Chennakeshava Temple sculptures?', 'The Beluru Chennakeshava Temple (12th century Hoysala dynasty) features exquisite bracket figures of celestial dancers (Madanikas/Shilabalikas) in various Bharatanatyam poses and mudras.', 0, NOW()),
('c0000006-0001-4000-8000-000000000003', 'a0000001-0006-4000-8000-000000000001', 'Which dynasty built the Hoysaleshwara Temple at Halebeedu?', 'The Hoysala dynasty built the Hoysaleshwara Temple (12th century). Its outer walls are covered with sculptures including dancers, musicians, and mythological scenes.', 0, NOW()),
('c0000006-0001-4000-8000-000000000004', 'a0000001-0006-4000-8000-000000000001', 'What are the Badami cave temples known for in dance context?', 'The Badami cave temples (6th century Chalukya dynasty) contain sculptures of Nataraja (Lord Shiva dancing) in the 18-armed Tandava form, depicting various Karanas from Natyashasthra.', 0, NOW()),
('c0000006-0001-4000-8000-000000000005', 'a0000001-0006-4000-8000-000000000001', 'What is the historical significance of Hampi for dance?', 'Hampi, the capital of the Vijayanagara Empire, has dance-related sculptures and dance halls (Ranga Mantapas). The Hazara Rama Temple has carvings of dancers and musicians depicting court celebrations.', 0, NOW()),
('c0000006-0001-4000-8000-000000000006', 'a0000001-0006-4000-8000-000000000001', 'Why are Pattadakal and Aihole significant for dance history?', 'Pattadakal and Aihole (Chalukya era, 7th-8th century) are UNESCO heritage sites with temple sculptures depicting dance forms, Karanas, and Nataraja figures that validate ancient dance practices described in Natyashasthra.', 0, NOW());

-- Junior: Preceptors and Biographies
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0007-4000-8000-000000000001', NULL, 'Junior: Preceptors and Biographies', 'Junior', 'Preceptors', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000007-0001-4000-8000-000000000001', 'a0000001-0007-4000-8000-000000000001', 'Who was Purandaradasaru?', 'Purandaradasaru (1484–1564) is called the "Pitamaha (grandfather) of Carnatic Music." He composed thousands of devotional songs (Devaranamas) in Kannada and systematized music education with exercises like Sarale Varase.', 0, NOW()),
('c0000007-0001-4000-8000-000000000002', 'a0000001-0007-4000-8000-000000000001', 'Who was Kanakadasaru?', 'Kanakadasaru (15th-16th century) was a Haridasa saint and poet of Karnataka. He composed devotional Keerthanas and philosophical compositions. He was a contemporary of Purandaradasaru.', 0, NOW()),
('c0000007-0001-4000-8000-000000000003', 'a0000001-0007-4000-8000-000000000001', 'Who was Rukmini Devi Arundale?', 'Rukmini Devi Arundale (1904–1986) was a pioneering Bharatanatyam revivalist who founded Kalakshetra in Chennai (1936). She elevated Bharatanatyam from the temple devadasi tradition to the modern concert stage.', 0, NOW()),
('c0000007-0001-4000-8000-000000000004', 'a0000001-0007-4000-8000-000000000001', 'Who was Meenakshi Sundaram Pillai?', 'Meenakshi Sundaram Pillai (1869–1954) was a legendary Bharatanatyam guru and nattuvanar from the Tanjore tradition. He was the guru of Rukmini Devi Arundale and played a key role in the revival of Bharatanatyam.', 0, NOW()),
('c0000007-0001-4000-8000-000000000005', 'a0000001-0007-4000-8000-000000000001', 'Who was Dr. Venkatalakshmamma?', 'Dr. Venkatalakshmamma was a distinguished Bharatanatyam exponent and scholar from Karnataka who contributed significantly to Bharatanatyam pedagogy and the Gandharva exam system.', 0, NOW()),
('c0000007-0001-4000-8000-000000000006', 'a0000001-0007-4000-8000-000000000001', 'Who was V. Ramaiah Pillai?', 'V. Ramaiah Pillai was a renowned Bharatanatyam nattuvanar and dance master from the Tanjore Quartet lineage who contributed to preserving and teaching the traditional repertoire.', 0, NOW());

-- Junior: Mudras and Bhedas
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0008-4000-8000-000000000001', NULL, 'Junior: Mudras and Bhedas', 'Junior', 'Mudras', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000008-0001-4000-8000-000000000001', 'a0000001-0008-4000-8000-000000000001', 'What are Asamyutha Hasthas?', 'Asamyutha Hasthas are single-hand gestures used in Bharatanatyam. According to Abhinayadarpanam, there are 28 Asamyutha Hasthas. Examples: Pathaka, Tripataka, Ardhapathaka, Kartarimukha.', 0, NOW()),
('c0000008-0001-4000-8000-000000000002', 'a0000001-0008-4000-8000-000000000001', 'What are Samyutha Hasthas?', 'Samyutha Hasthas are combined (double-hand) gestures. According to Abhinayadarpanam, there are 23 Samyutha Hasthas. Examples: Anjali (namaste), Kapota, Pushpaputa.', 0, NOW()),
('c0000008-0001-4000-8000-000000000003', 'a0000001-0008-4000-8000-000000000001', 'What is Shirobheda?', 'Shirobheda refers to the movements of the head. According to Abhinayadarpanam, there are 9 types: Sama, Udvahitha, Adhomukha, Alolitha, Dhutham, Kampitham, Paravrittham, Ukshiptham, and Parivahitham.', 0, NOW()),
('c0000008-0001-4000-8000-000000000004', 'a0000001-0008-4000-8000-000000000001', 'What is Drishtibheda?', 'Drishtibheda refers to the movements of the eyes (glances). According to Abhinayadarpanam, there are 8 types: Sama, Alolitha, Sachi, Pralokitha, Nimilitha, Ullokitha, Anuvrittha, and Avalokitha.', 0, NOW()),
('c0000008-0001-4000-8000-000000000005', 'a0000001-0008-4000-8000-000000000001', 'What is Greevabheda?', 'Greevabheda refers to the movements of the neck. There are 4 types: Sundari (side-to-side), Tirascheena (front-to-back zigzag), Parivartitha (circular), and Prakampitha (forward-backward nodding).', 0, NOW()),
('c0000008-0001-4000-8000-000000000006', 'a0000001-0008-4000-8000-000000000001', 'What is Bhroobheda?', 'Bhroobheda refers to eyebrow movements. There are types like Sahaja (natural), Utkshepa (raised), Patanam (lowered), and Rechita (up-and-down movement).', 0, NOW()),
('c0000008-0001-4000-8000-000000000007', 'a0000001-0008-4000-8000-000000000001', 'What is the Pathaka Hasta and its uses?', 'Pathaka (flag) is an Asamyutha Hasta where all fingers are extended and joined. Viniyogas include depicting clouds, forest, moonlight, river, blessing, waves, and various other meanings.', 0, NOW()),
('c0000008-0001-4000-8000-000000000008', 'a0000001-0008-4000-8000-000000000001', 'What is the Anjali Hasta?', 'Anjali is a Samyutha Hasta where both palms are joined together. At the chest level it denotes salutation to humans, at the face level to gurus, and above the head to gods.', 0, NOW());

-- Junior: Sabha and Dance Items
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000001-0009-4000-8000-000000000001', NULL, 'Junior: Sabha Lakshana and Dance Items', 'Junior', 'Dance Items', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000009-0001-4000-8000-000000000001', 'a0000001-0009-4000-8000-000000000001', 'What is Sabha Lakshana according to Abhinayadarpanam?', 'Sabha Lakshana describes the characteristics and qualities of an ideal audience hall (Sabha) for dance performances, including dimensions, seating arrangement, and auspicious features.', 0, NOW()),
('c0000009-0001-4000-8000-000000000002', 'a0000001-0009-4000-8000-000000000001', 'What is Kinkini Lakshana?', 'Kinkini Lakshana refers to the qualities and specifications of the ankle bells (Ghungroo/Salangai) worn by dancers, including their ideal number, material, and sound quality.', 0, NOW()),
('c0000009-0001-4000-8000-000000000003', 'a0000001-0009-4000-8000-000000000001', 'What is Pathra Antahprana and Pathra Bahiprana?', 'Pathra Antahprana refers to the inner qualities a dancer must possess (devotion, dedication, knowledge). Pathra Bahiprana refers to the external qualities (grace, beauty, physical fitness, stage presence).', 0, NOW()),
('c0000009-0001-4000-8000-000000000004', 'a0000001-0009-4000-8000-000000000001', 'What is Alaripu?', 'Alaripu ("flowering bud") is the opening item of a Bharatanatyam recital. It is a pure Nritta piece in a specific Tala that introduces the dancer to the audience, warming up body parts systematically.', 0, NOW()),
('c0000009-0001-4000-8000-000000000005', 'a0000001-0009-4000-8000-000000000001', 'What is a Jathiswara?', 'Jathiswara is a Nritta item combining Jathis (rhythmic patterns) set to Swaras (musical notes). It tests the dancer''s ability to execute complex rhythmic patterns with precision.', 0, NOW()),
('c0000009-0001-4000-8000-000000000006', 'a0000001-0009-4000-8000-000000000001', 'What is a Kauthvam?', 'Kauthvam is a dance item that includes both Nritta (pure dance jathis) and Nritya (abhinaya/expressive portions). It often invokes a deity and is set to a specific Tala.', 0, NOW());


-- ============================================================
--  SENIOR GRADE DECKS
-- ============================================================

-- Senior: Technical Terminology
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0001-4000-8000-000000000001', NULL, 'Senior: Technical Terminology in Bharatanatyam', 'Senior', 'Bharatanatyam', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000010-0001-4000-8000-000000000001', 'a0000002-0001-4000-8000-000000000001', 'What is the difference between Tandava and Lasya?', 'Tandava is the vigorous, masculine form of dance performed by Lord Shiva, characterized by forceful movements. Lasya is the graceful, feminine form attributed to Goddess Parvathi, featuring delicate and expressive movements.', 0, NOW()),
('c0000010-0001-4000-8000-000000000002', 'a0000002-0001-4000-8000-000000000001', 'What is the difference between Deshi and Margi?', 'Margi refers to the classical, codified, traditional style of dance as prescribed by the shastras. Deshi refers to the regional/local/folk style that varies from place to place.', 0, NOW()),
('c0000010-0001-4000-8000-000000000003', 'a0000002-0001-4000-8000-000000000001', 'What is Mukthaya (Muktayi)?', 'Mukthaya is the concluding rhythmic phrase or cadence that ends a Jathi or Korvai. It typically involves a pattern repeated three times (Teermanam) ending with a decisive stamp.', 0, NOW()),
('c0000010-0001-4000-8000-000000000004', 'a0000002-0001-4000-8000-000000000001', 'What is Angashuddhi?', 'Angashuddhi refers to the purity and precision of body movements in dance. It emphasizes correct posture, alignment, geometry, and the clean execution of every Anga (body part) movement.', 0, NOW()),
('c0000010-0001-4000-8000-000000000005', 'a0000002-0001-4000-8000-000000000001', 'What is a Jathi in Bharatanatyam?', 'A Jathi is a rhythmic composition made up of Sollukattu syllables performed in a specific Tala. Jathis are a key element in Nritta items like Alaripu, Jathiswara, and Varnam.', 0, NOW()),
('c0000010-0001-4000-8000-000000000006', 'a0000002-0001-4000-8000-000000000001', 'What is Rangapravesha?', 'Rangapravesha (Arangetram) is the debut solo performance of a Bharatanatyam dancer on stage. It marks the formal presentation of a student''s training and readiness to perform independently.', 0, NOW()),
('c0000010-0001-4000-8000-000000000007', 'a0000002-0001-4000-8000-000000000001', 'What is Sollukattu?', 'Sollukattu (Sollukattus) are rhythmic syllables or mnemonics used to represent dance steps and patterns (e.g., "Ta Tai Ta Ha," "Dhit Dhit Tai"). They serve as the verbal notation for Adavus and Jathis.', 0, NOW());

-- Senior: Chaturvidha Abhinaya
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0002-4000-8000-000000000001', NULL, 'Senior: Chaturvidha Abhinaya (Four Types)', 'Senior', 'Abhinaya', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000011-0001-4000-8000-000000000001', 'a0000002-0002-4000-8000-000000000001', 'What are the four types of Abhinaya (Chaturvidha Abhinaya)?', 'Angika (body/gesture), Vachika (speech/song), Aharya (costume/makeup/ornaments), and Sathvika (emotional/psychological expression conveying inner feelings through Sathvika Bhavas).', 0, NOW()),
('c0000011-0001-4000-8000-000000000002', 'a0000002-0002-4000-8000-000000000001', 'What is Angika Abhinaya?', 'Angika Abhinaya is expression through body movements. It involves Anga (major limbs: head, hands, chest, sides, hips, feet), Pratyanga (minor limbs: shoulders, arms, back, stomach, thighs, shanks), and Upanga (face parts: eyes, eyebrows, nose, lips, cheeks, chin).', 0, NOW()),
('c0000011-0001-4000-8000-000000000003', 'a0000002-0002-4000-8000-000000000001', 'What is Vachika Abhinaya?', 'Vachika Abhinaya is expression through words, songs, and vocal delivery. It encompasses the sahitya (lyrics), ragas, and literary content that the dancer interprets.', 0, NOW()),
('c0000011-0001-4000-8000-000000000004', 'a0000002-0002-4000-8000-000000000001', 'What is Aharya Abhinaya?', 'Aharya Abhinaya is expression through costumes, makeup, jewelry, and stage décor. It includes the dancer''s attire, ornaments like temple jewelry, and the visual elements that enhance the presentation.', 0, NOW()),
('c0000011-0001-4000-8000-000000000005', 'a0000002-0002-4000-8000-000000000001', 'What is Sathvika Abhinaya?', 'Sathvika Abhinaya is the portrayal of involuntary emotional states. It includes 8 Sathvika Bhavas: Stambha (paralysis), Sveda (perspiration), Romancha (horripilation), Svarabheda (change of voice), Vepathu (trembling), Vaivarnya (change of color), Ashru (tears), and Pralaya (fainting).', 0, NOW()),
('c0000011-0001-4000-8000-000000000006', 'a0000002-0002-4000-8000-000000000001', 'What is the famous shloka about the four types of Abhinaya?', '"Angikam Bhuvanam Yasya, Vachikam Sarva Vangmayam, Aharyam Chandra Taradi, Tam Vande Sathvikam Shivam" - meaning Shiva whose Angika is the whole world, Vachika is all language, Aharya is moon and stars, we bow to that Sathvika form.', 0, NOW()),
('c0000011-0001-4000-8000-000000000007', 'a0000002-0002-4000-8000-000000000001', 'What are the six Angas (major limbs) in Angika Abhinaya?', 'The six Angas are: Shiras (head), Hastha (hands), Vaksha (chest), Parshva (sides), Kati (hips/waist), and Pada (feet).', 0, NOW());

-- Senior: Nataraja
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0003-4000-8000-000000000001', NULL, 'Senior: Lord Nataraja', 'Senior', 'Tandava Lasya', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000012-0001-4000-8000-000000000001', 'a0000002-0003-4000-8000-000000000001', 'What does the Nataraja idol symbolize?', 'The Nataraja idol symbolizes the cosmic dance of Lord Shiva encompassing creation (Srishti), preservation (Sthiti), destruction (Samhara), veiling/illusion (Tirobhava), and grace/liberation (Anugraha) — the Panchakrityas.', 0, NOW()),
('c0000012-0001-4000-8000-000000000002', 'a0000002-0003-4000-8000-000000000001', 'What does the Damaru (drum) in Nataraja''s upper right hand represent?', 'The Damaru represents the sound of creation (Srishti) — the primordial sound (Nada) from which all existence emanates. It symbolizes rhythm and time.', 0, NOW()),
('c0000012-0001-4000-8000-000000000003', 'a0000002-0003-4000-8000-000000000001', 'What does the fire (Agni) in Nataraja''s upper left hand represent?', 'The fire represents destruction (Samhara) — the force that dissolves the universe at the end of each cosmic cycle.', 0, NOW()),
('c0000012-0001-4000-8000-000000000004', 'a0000002-0003-4000-8000-000000000001', 'What does the Abhaya Hasta in Nataraja''s lower right hand signify?', 'The Abhaya Hasta (gesture of fearlessness/protection) signifies preservation (Sthiti) and reassures devotees with divine protection.', 0, NOW()),
('c0000012-0001-4000-8000-000000000005', 'a0000002-0003-4000-8000-000000000001', 'What does the raised left foot of Nataraja represent?', 'The raised left foot (Kunchita Pada) represents liberation (Moksha/Anugraha) — offering grace and spiritual release to devotees.', 0, NOW()),
('c0000012-0001-4000-8000-000000000006', 'a0000002-0003-4000-8000-000000000001', 'What is the dwarf figure (Apasmara) under Nataraja''s right foot?', 'Apasmara (also called Muyalaka) represents ignorance and forgetfulness. Shiva trampling him symbolizes the victory of knowledge over ignorance (Tirobhava — the veiling force overcome).', 0, NOW()),
('c0000012-0001-4000-8000-000000000007', 'a0000002-0003-4000-8000-000000000001', 'What does the ring of fire (Prabhamandala) around Nataraja signify?', 'The ring of fire (Prabhamandala/Tiruvasi) represents the cosmic cycle of creation and destruction, the eternal process of the universe, and the fire of consciousness.', 0, NOW());

-- Senior: Dance Items (Margam)
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0004-4000-8000-000000000001', NULL, 'Senior: Dance Items (Margam)', 'Senior', 'Dance Items', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000013-0001-4000-8000-000000000001', 'a0000002-0004-4000-8000-000000000001', 'What is the Margam in Bharatanatyam?', 'The Margam is the traditional order of items in a full Bharatanatyam recital: Alaripu, Jathiswara, Shabdam, Varnam (centerpiece), Padam, Javali, Thillana, and Mangalam.', 0, NOW()),
('c0000013-0001-4000-8000-000000000002', 'a0000002-0004-4000-8000-000000000001', 'What is a Shabdam?', 'Shabdam is a Nritya item that combines rhythmic dance (Nritta) with lyrics expressing devotion. It is the first item in the Margam where the dancer begins to use Abhinaya along with Sahitya (words).', 0, NOW()),
('c0000013-0001-4000-8000-000000000003', 'a0000002-0004-4000-8000-000000000001', 'What is a Padavarnam and why is it the centerpiece of Margam?', 'Padavarnam is the most elaborate and demanding item, combining complex Nritta (Jathis) with extensive Abhinaya (Sanchari). It tests the dancer''s mastery of technique, expression, stamina, and musicality.', 0, NOW()),
('c0000013-0001-4000-8000-000000000004', 'a0000002-0004-4000-8000-000000000001', 'What is a Padam?', 'Padam is an Abhinaya-focused item expressing deep devotional or romantic poetry (often Shringara or Bhakthi rasa). It demands nuanced facial expression and emotional depth with minimal Nritta.', 0, NOW()),
('c0000013-0001-4000-8000-000000000005', 'a0000002-0004-4000-8000-000000000001', 'What is a Javali?', 'Javali is a light, romantic (Shringara rasa) composition with playful, coquettish expression. It is simpler and more direct than a Padam, often in colloquial language.', 0, NOW()),
('c0000013-0001-4000-8000-000000000006', 'a0000002-0004-4000-8000-000000000001', 'What is a Thillana?', 'Thillana is a rhythmically vibrant Nritta item near the end of the Margam. It features energetic footwork, spins, and jathis set to rhythmic syllables (tillana swaras), ending with a brief lyrical portion.', 0, NOW()),
('c0000013-0001-4000-8000-000000000007', 'a0000002-0004-4000-8000-000000000001', 'What is Mangalam?', 'Mangalam is the concluding auspicious item of a Bharatanatyam recital. It is a brief piece seeking blessings for all, typically a short devotional verse.', 0, NOW());

-- Senior: Padabhedhas
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0005-4000-8000-000000000001', NULL, 'Senior: Padabhedhas (Foot Movements)', 'Senior', 'Bhedas', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000014-0001-4000-8000-000000000001', 'a0000002-0005-4000-8000-000000000001', 'What are the four types of Padabhedhas according to Abhinayadarpanam?', 'Mandala (standing positions/stances), Utplavana (leaps/jumps), Bhramari (spins/turns), and Chari (leg movements/gaits).', 0, NOW()),
('c0000014-0001-4000-8000-000000000002', 'a0000002-0005-4000-8000-000000000001', 'What are Mandalas?', 'Mandalas are standing positions or stances. There are 10 types of Mandalas including Sthana (Sthanaka), Ayatha, Alidha, Pratyalidha, Prerita, Preritaka, Pratyalidha, Swastika, Motita, and Samasuchi.', 0, NOW()),
('c0000014-0001-4000-8000-000000000003', 'a0000002-0005-4000-8000-000000000001', 'What are Utplavanas?', 'Utplavanas are leaping or jumping movements. They include various aerial movements where the dancer leaves the ground, such as Alaga, Karthari, Aswa, and Motita Utplavanas.', 0, NOW()),
('c0000014-0001-4000-8000-000000000004', 'a0000002-0005-4000-8000-000000000001', 'What are Bhramaris?', 'Bhramaris are spinning or turning movements. They include turns performed on one foot, both feet, or while moving across the stage. Types vary in speed and direction.', 0, NOW()),
('c0000014-0001-4000-8000-000000000005', 'a0000002-0005-4000-8000-000000000001', 'What are Charis?', 'Charis are leg movements or gaits that depict walking, running, or various modes of locomotion. They include both Bhoomi Chari (ground-level movements) and Akasha Chari (aerial movements).', 0, NOW()),
('c0000014-0001-4000-8000-000000000006', 'a0000002-0005-4000-8000-000000000001', 'What is the significance of Padabhedhas in Bharatanatyam?', 'Padabhedhas form the foundation of complex choreography. They define how a dancer moves through space, combines footwork with body movements, and creates dynamic visual compositions on stage.', 0, NOW());

-- Senior: Folk Dances of Karnataka
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0006-4000-8000-000000000001', NULL, 'Senior: Folk Dances of Karnataka', 'Senior', 'Folk Dances', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000015-0001-4000-8000-000000000001', 'a0000002-0006-4000-8000-000000000001', 'Name the seven folk dances of Karnataka studied in the Senior syllabus.', 'Kamsale, Dollu Kunitha, Nandidhwaja, Veeragase, Bolakaat (Bolak-aat), Ummatthat (Ummattha Aat), and Suggi Kunitha.', 0, NOW()),
('c0000015-0001-4000-8000-000000000002', 'a0000002-0006-4000-8000-000000000001', 'What is Dollu Kunitha?', 'Dollu Kunitha is a vigorous drum dance from North Karnataka, performed by the Kuruba community. Dancers carry large drums (dollu) and perform energetic movements in circular formations.', 0, NOW()),
('c0000015-0001-4000-8000-000000000003', 'a0000002-0006-4000-8000-000000000001', 'What is Veeragase?', 'Veeragase is a vigorous folk dance from Karnataka associated with Veerashaiva tradition. Dancers wear special costumes and perform intense devotional movements honoring Lord Shiva.', 0, NOW()),
('c0000015-0001-4000-8000-000000000004', 'a0000002-0006-4000-8000-000000000001', 'What is Kamsale?', 'Kamsale is a folk dance from the Mysore region performed using brass cymbals (Kamsale) held in hands. It is associated with the worship of Male Mahadeshwara and performed by the Kuruba community.', 0, NOW()),
('c0000015-0001-4000-8000-000000000005', 'a0000002-0006-4000-8000-000000000001', 'What is Suggi Kunitha?', 'Suggi Kunitha is a harvest dance of Karnataka, performed during the suggi (harvest) season. It celebrates the agricultural bounty and is performed with colorful costumes and energetic movements.', 0, NOW()),
('c0000015-0001-4000-8000-000000000006', 'a0000002-0006-4000-8000-000000000001', 'What is Nandidhwaja?', 'Nandidhwaja is a Karnataka folk dance where performers carry tall decorated structures (dhwaja/banner) representing Nandi (Shiva''s bull). It involves balancing the heavy structure while dancing.', 0, NOW());

-- Senior: Sooladi Saptha Tala
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0007-4000-8000-000000000001', NULL, 'Senior: Sooladi Saptha Tala', 'Senior', 'Tala', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000016-0001-4000-8000-000000000001', 'a0000002-0007-4000-8000-000000000001', 'What are the Sooladi Saptha Talas?', 'The seven fundamental talas: Dhruva (IOII), Matya (IOI), Roopaka (OI), Jhampa (IUO), Triputa (IOO), Ata (IIOO), and Eka (I). [I=Laghu, O=Dhrutha, U=Anudhrutha]', 0, NOW()),
('c0000016-0001-4000-8000-000000000002', 'a0000002-0007-4000-8000-000000000001', 'What are the Angas of Triputa Tala?', 'Triputa Tala consists of one Laghu + two Dhruthas (I O O). In Chaturashra Jaathi (Adi Tala), it has 4+2+2 = 8 aksharas.', 0, NOW()),
('c0000016-0001-4000-8000-000000000003', 'a0000002-0007-4000-8000-000000000001', 'What are the Angas of Ata Tala?', 'Ata Tala consists of two Laghus + two Dhruthas (I I O O). In Chaturashra Jaathi, it has 4+4+2+2 = 12 aksharas.', 0, NOW()),
('c0000016-0001-4000-8000-000000000004', 'a0000002-0007-4000-8000-000000000001', 'What is Eka Tala?', 'Eka Tala consists of just one Laghu (I). In Chaturashra Jaathi, it has 4 aksharas. It is the simplest of the Saptha Talas.', 0, NOW()),
('c0000016-0001-4000-8000-000000000005', 'a0000002-0007-4000-8000-000000000001', 'How many total Tala varieties result from the Saptha Talas and Pancha Jaathis?', '35 Tala varieties (7 Talas × 5 Jaathis = 35). Each Tala can be rendered in any of the five Jaathis (Tishra, Chaturashra, Khanda, Mishra, Sankeerna).', 0, NOW()),
('c0000016-0001-4000-8000-000000000006', 'a0000002-0007-4000-8000-000000000001', 'What is Jhampa Tala and its Angas?', 'Jhampa Tala consists of one Laghu + one Anudhrutha + one Dhrutha (I U O). In Mishra Jaathi (the default), it has 7+1+2 = 10 aksharas.', 0, NOW()),
('c0000016-0001-4000-8000-000000000007', 'a0000002-0007-4000-8000-000000000001', 'What is the Anga notation for Dhruva Tala?', 'Dhruva Tala has Laghu + Dhrutha + Laghu + Laghu (I O I I). In Chaturashra Jaathi it has 4+2+4+4 = 14 aksharas.', 0, NOW());

-- Senior: Navarasa
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0008-4000-8000-000000000001', NULL, 'Senior: Navarasa (Nine Rasas)', 'Senior', 'Abhinaya', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000017-0001-4000-8000-000000000001', 'a0000002-0008-4000-8000-000000000001', 'What are the Navarasa (Nine Rasas)?', 'Shringara (love/beauty), Hasya (laughter/comedy), Karuna (compassion/sorrow), Raudra (fury/anger), Veera (heroism/valor), Bhayanaka (fear/terror), Bibhatsa (disgust), Adbhuta (wonder/amazement), and Shantha (peace/tranquility).', 0, NOW()),
('c0000017-0001-4000-8000-000000000002', 'a0000002-0008-4000-8000-000000000001', 'What is Shringara Rasa and its Sthayi Bhava?', 'Shringara (erotic/love) is considered the king of all Rasas. Its Sthayi Bhava (dominant emotion) is Rati (love/attraction). It has two types: Sambhoga Shringara (love in union) and Vipralambha Shringara (love in separation).', 0, NOW()),
('c0000017-0001-4000-8000-000000000003', 'a0000002-0008-4000-8000-000000000001', 'What is Karuna Rasa and its Sthayi Bhava?', 'Karuna (compassion/pathos) is the rasa of sorrow and sympathy. Its Sthayi Bhava is Shoka (grief/sorrow). It evokes empathy in the audience through portrayal of suffering or loss.', 0, NOW()),
('c0000017-0001-4000-8000-000000000004', 'a0000002-0008-4000-8000-000000000001', 'What is Veera Rasa and its Sthayi Bhava?', 'Veera (heroic) is the rasa of courage and valor. Its Sthayi Bhava is Utsaha (enthusiasm/energy). It depicts heroism, determination, and confidence.', 0, NOW()),
('c0000017-0001-4000-8000-000000000005', 'a0000002-0008-4000-8000-000000000001', 'What is Raudra Rasa?', 'Raudra (fury) is the rasa of anger. Its Sthayi Bhava is Krodha (anger). It is expressed through fierce facial expressions, aggressive movements, and intense energy.', 0, NOW()),
('c0000017-0001-4000-8000-000000000006', 'a0000002-0008-4000-8000-000000000001', 'What is the difference between Sthayi Bhava and Rasa?', 'Sthayi Bhava is the permanent/dominant emotion (e.g., Rati, Krodha). When this emotion is fully developed through Vibhava (stimulus), Anubhava (response), and Vyabhichari Bhava (transitory emotions), it becomes Rasa — the aesthetic experience in the audience.', 0, NOW()),
('c0000017-0001-4000-8000-000000000007', 'a0000002-0008-4000-8000-000000000001', 'Which Rasa was added as the ninth Rasa and by whom?', 'Shantha Rasa (peace/serenity) was added as the ninth Rasa by Abhinavagupta. Its Sthayi Bhava is Shama (tranquility). The original eight Rasas were enumerated by Bharata Muni in Natyashasthra.', 0, NOW());

-- Senior: Legends and Preceptors
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0009-4000-8000-000000000001', NULL, 'Senior: Legends and Preceptors', 'Senior', 'Preceptors', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000018-0001-4000-8000-000000000001', 'a0000002-0009-4000-8000-000000000001', 'Who were the Tanjore Quartet?', 'The Tanjore Quartet — Chinnayya, Ponnayya, Sivanandam, and Vadivelu — were four brothers (early 19th century) who codified the Bharatanatyam Margam (repertoire sequence) and composed many dance compositions still performed today.', 0, NOW()),
('c0000018-0001-4000-8000-000000000002', 'a0000002-0009-4000-8000-000000000001', 'What is the Tanjore Quartet''s main contribution?', 'They systematized the Bharatanatyam Margam (Alaripu → Jathiswara → Shabdam → Varnam → Padam → Javali → Thillana → Mangalam) and composed Varnams, Jathiswarams, and Thillanas that remain central to the repertoire.', 0, NOW()),
('c0000018-0001-4000-8000-000000000003', 'a0000002-0009-4000-8000-000000000001', 'Who was Swathi Tirunal Maharaj?', 'Swathi Tirunal Rama Varma (1813–1846) was the Maharaja of Travancore (Kerala) and a prolific composer. He composed in multiple languages and ragas; his Padams and Varnams are widely used in Bharatanatyam.', 0, NOW()),
('c0000018-0001-4000-8000-000000000004', 'a0000002-0009-4000-8000-000000000001', 'Who was Kshetrajna (Kshethrajna)?', 'Kshetrajna (17th century) was a legendary Telugu poet-composer known as the father of the Padam genre. His compositions (Muvagopala Padams) expressing Shringara are central to Bharatanatyam Abhinaya repertoire.', 0, NOW()),
('c0000018-0001-4000-8000-000000000005', 'a0000002-0009-4000-8000-000000000001', 'Who was Oothukadu Venkata Subbaiar?', 'Oothukadu Venkata Subbaiar (18th century) was a Tamil composer famous for his Krishna Leela Tarangini compositions. His kritis depict the childhood and divine play of Lord Krishna and are popular in dance.', 0, NOW()),
('c0000018-0001-4000-8000-000000000006', 'a0000002-0009-4000-8000-000000000001', 'Who was Jayachamarajendra Wodeyar?', 'Jayachamarajendra Wodeyar (1919–1974) was the last Maharaja of Mysore. He was a learned patron of arts, a composer of musical compositions, and contributed significantly to the promotion of classical arts in Karnataka.', 0, NOW()),
('c0000018-0001-4000-8000-000000000007', 'a0000002-0009-4000-8000-000000000001', 'What are Ragalakshanas that Senior students must know?', 'Ragalakshana (characteristics of Ragas) for: Thodi (a melancholic, devotional raga), Kambhoji (a majestic raga), Shankarabharana (equivalent to Western major scale), Bhairavi (versatile, morning raga), and Kalyani (an auspicious, bright raga).', 0, NOW());

-- Senior: Hastha Viniyoga
INSERT INTO flashcard_decks (id, user_id, title, level, topic, is_template, created_at, updated_at)
VALUES ('a0000002-0010-4000-8000-000000000001', NULL, 'Senior: Hastha Viniyogas and Nrittha Hasthas', 'Senior', 'Mudras', true, NOW(), NOW());

INSERT INTO deck_cards (id, deck_id, front, back, mastery_level, created_at) VALUES
('c0000019-0001-4000-8000-000000000001', 'a0000002-0010-4000-8000-000000000001', 'What is Viniyoga in the context of Hastha Mudras?', 'Viniyoga means the application or usage of a Hastha (hand gesture). Each Asamyutha and Samyutha Hasta has multiple Viniyogas — specific meanings when used in particular contexts during Abhinaya.', 0, NOW()),
('c0000019-0001-4000-8000-000000000002', 'a0000002-0010-4000-8000-000000000001', 'What are Nrittha Hasthas?', 'Nrittha Hasthas are hand gestures used specifically in pure dance (Nritta) portions, as opposed to Abhinaya. According to Abhinayadarpanam, there are specific gestures meant for rhythmic dance that do not convey literal meaning.', 0, NOW()),
('c0000019-0001-4000-8000-000000000003', 'a0000002-0010-4000-8000-000000000001', 'How many Asamyutha Hasthas are listed in Abhinayadarpanam?', '28 Asamyutha Hasthas (single-hand gestures) are listed in Abhinayadarpanam, each with multiple Viniyogas.', 0, NOW()),
('c0000019-0001-4000-8000-000000000004', 'a0000002-0010-4000-8000-000000000001', 'How many Samyutha Hasthas are listed in Abhinayadarpanam?', '23 Samyutha Hasthas (combined/double-hand gestures) are listed, including Anjali, Kapota, Karkata, Swastika, Pushpaputa, and others.', 0, NOW()),
('c0000019-0001-4000-8000-000000000005', 'a0000002-0010-4000-8000-000000000001', 'Name some Viniyogas of the Tripataka Hasta.', 'Tripataka (three parts of a flag) depicts a crown, tree, lamp, fire, door, hair plait, and is used to show Indra and other concepts. The ring finger is bent while other fingers remain extended.', 0, NOW()),
('c0000019-0001-4000-8000-000000000006', 'a0000002-0010-4000-8000-000000000001', 'What are Devatha Hasthas?', 'Devatha Hasthas are specific hand gesture combinations assigned to depict different deities (e.g., Brahma, Vishnu, Shiva, Saraswati, Lakshmi, Parvathi) according to Abhinayadarpanam.', 0, NOW());

COMMIT;
