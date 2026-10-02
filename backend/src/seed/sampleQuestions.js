/**
 * Unofficial practice question seed for PTE Master.
 * Not affiliated with Pearson PTE Academic.
 */

const speaking = [
  {
    title: "Climate change opening",
    type: "Read Aloud",
    skill: "speaking",
    difficulty: "Easy",
    prompt:
      "Climate change is one of the most pressing challenges facing humanity today. Scientists around the world are working together to develop sustainable solutions that can reduce carbon emissions and protect vulnerable ecosystems for future generations.",
    timeLimit: 40,
    prepTime: 35,
    points: 1,
  },
  {
    title: "Industrial revolution",
    type: "Read Aloud",
    skill: "speaking",
    difficulty: "Medium",
    prompt:
      "The industrial revolution transformed manufacturing processes and social structures throughout Europe and North America. Innovations in steam power, textile production, and transportation fundamentally altered how goods were produced and distributed across global markets.",
    timeLimit: 40,
    prepTime: 35,
    points: 1,
  },
  {
    title: "Library closure",
    type: "Repeat Sentence",
    skill: "speaking",
    difficulty: "Easy",
    prompt: "The library will be closed for renovations next weekend.",
    correctAnswer: "The library will be closed for renovations next weekend.",
    timeLimit: 15,
    points: 1,
  },
  {
    title: "Research proposal deadline",
    type: "Repeat Sentence",
    skill: "speaking",
    difficulty: "Medium",
    prompt: "Students are required to submit their research proposals by the end of the semester.",
    correctAnswer: "Students are required to submit their research proposals by the end of the semester.",
    timeLimit: 15,
    points: 1,
  },
  {
    title: "Book writer",
    type: "Answer Short Question",
    skill: "speaking",
    difficulty: "Easy",
    prompt: "What do you call a person who writes books?",
    correctAnswer: "An author",
    timeLimit: 10,
    points: 1,
  },
  {
    title: "Leap year",
    type: "Answer Short Question",
    skill: "speaking",
    difficulty: "Easy",
    prompt: "How many days are there in a leap year?",
    correctAnswer: "366",
    timeLimit: 10,
    points: 1,
  },
  {
    title: "Sleep and cognition (retell)",
    type: "Retell Lecture",
    skill: "speaking",
    difficulty: "Hard",
    prompt:
      "You will hear a short lecture about sleep. After listening, retell it in your own words.",
    explanation:
      "Sleep is essential for memory consolidation; chronic deprivation harms attention and decision-making.",
    timeLimit: 40,
    prepTime: 10,
    points: 3,
  },
];

const writing = [
  {
    title: "Urban green spaces",
    type: "Summarize Written Text",
    skill: "writing",
    difficulty: "Medium",
    prompt:
      "Urban green spaces such as parks, gardens, and tree-lined streets improve air quality, encourage physical activity, and help communities manage stormwater and the urban heat island effect.",
    explanation:
      "Green spaces have environmental, social, and climate-resilience benefits.",
    timeLimit: 600,
    wordMin: 5,
    wordMax: 75,
    points: 3,
  },
  {
    title: "AI in healthcare",
    type: "Summarize Written Text",
    skill: "writing",
    difficulty: "Hard",
    prompt:
      "Artificial intelligence is reshaping healthcare through medical image analysis, predictive resource planning, and triage chatbots, although careful validation is required to manage privacy and clinical risk.",
    explanation:
      "AI offers multiple benefits but needs validation to address bias and privacy concerns.",
    timeLimit: 600,
    wordMin: 5,
    wordMax: 75,
    points: 3,
  },
  {
    title: "Online vs classroom learning",
    type: "Write Essay",
    skill: "writing",
    difficulty: "Medium",
    prompt:
      "Some people believe online education is as effective as traditional classroom learning. Discuss both views and give your own opinion.",
    explanation: "Discuss benefits of each, then a balanced opinion.",
    timeLimit: 1200,
    wordMin: 200,
    wordMax: 300,
    points: 5,
  },
  {
    title: "Free university education",
    type: "Write Essay",
    skill: "writing",
    difficulty: "Hard",
    prompt:
      "Some people argue that university education should be free for everyone, while others believe students should contribute to the cost. Discuss both views and state your opinion.",
    timeLimit: 1200,
    wordMin: 200,
    wordMax: 300,
    points: 5,
  },
];

const reading = [
  {
    title: "Biodiversity passage (R&W fill)",
    type: "Reading Fill in the Blanks",
    skill: "reading",
    difficulty: "Medium",
    passage:
      "Biodiversity is essential for maintaining healthy ecosystems. When species disappear, the delicate balance of nature can be disrupted. Conservation efforts aim to protect endangered animals and their habitats.",
    options: [
      { id: 1, choices: ["balance", "fashion", "distance"], answer: "balance" },
      { id: 2, choices: ["habitats", "vehicles", "schedules"], answer: "habitats" },
    ],
    correctAnswer: { 1: "balance", 2: "habitats" },
    explanation: "Context clues point to ecological vocabulary.",
    timeLimit: 180,
    points: 3,
  },
  {
    title: "Remote work (single choice)",
    type: "Multiple Choice",
    skill: "reading",
    difficulty: "Easy",
    passage:
      "Remote work has become increasingly common since the early 2020s. Many employees report higher job satisfaction because they avoid long commutes. However, some managers worry about reduced collaboration, and hybrid models have become a popular compromise.",
    question: "What is the main idea of the passage?",
    options: [
      "Remote work eliminates the need for offices.",
      "Remote work has benefits and drawbacks, and hybrid models are a common compromise.",
      "Managers universally oppose remote work.",
      "Commuting is the only reason employees prefer remote work.",
    ],
    correctAnswer: 1,
    explanation: "The passage presents both advantages and concerns.",
    timeLimit: 120,
    points: 2,
  },
  {
    title: "Photosynthesis (multiple choice)",
    type: "Multiple Choice",
    skill: "reading",
    difficulty: "Medium",
    passage:
      "Photosynthesis is the process by which green plants convert sunlight into chemical energy. Chlorophyll absorbs light, which drives the conversion of carbon dioxide and water into glucose and oxygen. Temperature affects the rate.",
    question: "Which of the following statements are true? (Select all that apply)",
    options: [
      "Chlorophyll absorbs light to power photosynthesis.",
      "Photosynthesis produces oxygen as a byproduct.",
      "Temperature has no effect on photosynthesis.",
      "Carbon dioxide is used during photosynthesis.",
    ],
    correctAnswer: [0, 1, 3],
    explanation: "The first, second, and fourth options are supported.",
    timeLimit: 150,
    points: 3,
  },
  {
    title: "Supply chain (reorder)",
    type: "Reorder Paragraphs",
    skill: "reading",
    difficulty: "Medium",
    passage:
      "First, raw materials are extracted from natural sources such as mines and forests. These materials are then transported to factories where they are processed into usable components. Finally, finished products are distributed to retailers and sold to consumers around the world. The modern supply chain involves several interconnected stages that transform resources into finished goods.",
    paragraphs: [
      { id: "d", text: "The modern supply chain involves several interconnected stages." },
      { id: "a", text: "First, raw materials are extracted from natural sources." },
      { id: "b", text: "These materials are then processed in factories." },
      { id: "c", text: "Finally, finished products are distributed to retailers." },
    ],
    correctAnswer: ["d", "a", "b", "c"],
    explanation: "Topic sentence first, then chronological order.",
    timeLimit: 180,
    points: 3,
  },
];

const listening = [
  {
    title: "Lecture audio (summarize)",
    type: "Summarize Spoken Text",
    skill: "listening",
    difficulty: "Medium",
    prompt:
      "You will hear a short lecture. Write a summary of between 50 and 70 words.",
    passage:
      "Learning a second language improves problem-solving and mental flexibility, expands career options, deepens cultural connection, and may delay age-related cognitive decline.",
    correctAnswer:
      "Bilingualism brings cognitive, professional, and cultural benefits, so educators support early language instruction.",
    explanation: "Cover all three benefits in the model summary.",
    timeLimit: 600,
    wordMin: 50,
    wordMax: 70,
    points: 3,
  },
  {
    title: "Museum hours (FIB)",
    type: "Listening Fill in the Blanks",
    skill: "listening",
    difficulty: "Easy",
    passage:
      "The museum opens at ___1___ o'clock every morning except on Mondays. Visitors can purchase tickets online or at the main ___2___.",
    correctAnswer: { 1: "nine", 2: "entrance" },
    timeLimit: 120,
    points: 2,
  },
  {
    title: "Picnic reschedule (MCQ)",
    type: "Multiple Choice",
    skill: "listening",
    difficulty: "Medium",
    passage:
      "Attention: the annual company picnic has been rescheduled from Saturday the tenth to Sunday the eighteenth due to expected heavy rain.",
    question: "Why was the picnic rescheduled?",
    options: ["The park was unavailable", "Expected heavy rain", "Staff shortage", "Food vendor cancelled"],
    correctAnswer: 1,
    explanation: "The announcement cites expected heavy rain.",
    timeLimit: 90,
    points: 2,
  },
  {
    title: "Highlight incorrect words",
    type: "Highlight Incorrect Words",
    skill: "listening",
    difficulty: "Hard",
    passage:
      "The water cycle describes how water moves through the environment. Water evaporates from oceans and lakes, forms clouds, and returns to the earth as precipitation.",
    displayText:
      "The water cycle describes how water moves through the atmosphere. Water evaporates from oceans and rivers, forms clouds, and returns to the earth as pollution.",
    correctAnswer: ["atmosphere", "rivers", "pollution"],
    explanation:
      "Three words differ from the audio: atmosphere, rivers, and pollution should be environment, lakes, precipitation.",
    timeLimit: 120,
    points: 3,
  },
  {
    title: "Write from dictation",
    type: "Write from Dictation",
    skill: "listening",
    difficulty: "Medium",
    passage: "Please submit the completed form to the reception desk.",
    correctAnswer: "Please submit the completed form to the reception desk.",
    timeLimit: 60,
    points: 2,
  },
];

export const sampleQuestions = [
  ...speaking.map((q) => ({ ...q, isPublished: true })),
  ...writing.map((q) => ({ ...q, isPublished: true })),
  ...reading.map((q) => ({ ...q, isPublished: true })),
  ...listening.map((q) => ({ ...q, isPublished: true })),
];
