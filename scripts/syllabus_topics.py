"""
Shared syllabus topic taxonomy used for ingestion and template deck seeding.
"""

TOPIC_RULES: list[tuple[str, str]] = [
    ("adavu", "Adavus"),
    ("aharya", "Aharya Abhinaya"),
    ("abhinaya", "Abhinaya"),
    ("bhagavatamela", "Bhagavatamela"),
    ("dasi attam", "Dasi Attam"),
    ("folk", "Folk Dances"),
    ("classical", "Classical Dances"),
    ("comparison", "Dance Forms"),
    ("tala", "Tala"),
    ("tandava", "Tandava Lasya"),
    ("lasya", "Tandava Lasya"),
    ("tanjavur", "Tanjavur Quartet"),
    ("music", "Music and Instruments"),
    ("instrument", "Music and Instruments"),
    ("sculpture", "Dance Sculptures"),
    ("dance item", "Dance Items"),
    ("preceptor", "Preceptors"),
    ("dancer", "Preceptors"),
    ("treatise", "Treatises"),
    ("exercise", "Exercises"),
    ("sabha", "Sabha"),
    ("mudra", "Mudras"),
    ("gesture", "Mudras"),
    ("viniyoga", "Mudras"),
    ("beda", "Bhedas"),
    ("bheda", "Bhedas"),
    ("bharatanatyam", "Bharatanatyam"),
]

SYLLABUS_TOPICS: list[str] = sorted({topic for _, topic in TOPIC_RULES})
TEMPLATE_LEVELS: list[str] = ["Junior", "Senior"]
