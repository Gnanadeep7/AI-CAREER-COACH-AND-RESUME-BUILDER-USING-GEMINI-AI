"use server";

import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const fallbackQuestions = [
  {
    question: "What is a key principle in software development?",
    options: [
      "DRY (Don't Repeat Yourself)",
      "WET (Write Everything Twice)",
      "CHAOS (Code by Haphazard)",
      "MESS (Make Each Section Separate)",
    ],
    correctAnswer: "DRY (Don't Repeat Yourself)",
    explanation:
      "DRY is a fundamental principle that encourages code reuse and reduces redundancy, making code more maintainable.",
  },
  {
    question: "Which design pattern is used to create a single instance of a class?",
    options: ["Factory", "Singleton", "Observer", "Adapter"],
    correctAnswer: "Singleton",
    explanation:
      "The Singleton pattern ensures that a class has only one instance and provides a global point of access to it.",
  },
  {
    question: "What does SOLID stand for in software architecture?",
    options: [
      "Structured, Organized, Logical, Integrated, Designed",
      "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion",
      "Simple, Optional, Linear, Immediate, Dynamic",
      "Scalable, Optimized, Low-cost, Integrated, Distributed",
    ],
    correctAnswer:
      "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion",
    explanation:
      "SOLID is a set of five design principles that help make software more maintainable, flexible, and scalable.",
  },
  {
    question: "What is the primary benefit of unit testing?",
    options: [
      "Increases code lines",
      "Catches bugs early",
      "Slows development",
      "Makes code slower",
    ],
    correctAnswer: "Catches bugs early",
    explanation:
      "Unit testing helps identify and fix bugs early in the development process, reducing costs and improving quality.",
  },
  {
    question: "Which of the following best describes refactoring?",
    options: [
      "Adding new features",
      "Improving code structure without changing behavior",
      "Rewriting from scratch",
      "Deleting old code",
    ],
    correctAnswer: "Improving code structure without changing behavior",
    explanation:
      "Refactoring is the process of restructuring code to improve readability and maintainability while preserving functionality.",
  },
  {
    question: "What does REST stand for?",
    options: [
      "Remote Execution Service Technology",
      "Representational State Transfer",
      "Rapid Electronic Software Transfer",
      "Resource Execution and Service Technology",
    ],
    correctAnswer: "Representational State Transfer",
    explanation:
      "REST is an architectural style for designing networked applications using HTTP requests.",
  },
  {
    question: "What is the purpose of version control?",
    options: [
      "To delete old files",
      "To track changes and collaborate on code",
      "To compile code",
      "To optimize performance",
    ],
    correctAnswer: "To track changes and collaborate on code",
    explanation:
      "Version control systems like Git help teams track code changes, collaborate, and revert to previous versions if needed.",
  },
  {
    question: "Which is NOT a benefit of using microservices?",
    options: [
      "Independent deployability",
      "Easier debugging",
      "Technology flexibility",
      "Reduced complexity",
    ],
    correctAnswer: "Reduced complexity",
    explanation:
      "While microservices offer many benefits, they generally increase overall system complexity compared to monolithic applications.",
  },
  {
    question: "What is continuous integration (CI)?",
    options: [
      "Manual testing",
      "Automating code integration and testing",
      "Writing documentation",
      "Code review only",
    ],
    correctAnswer: "Automating code integration and testing",
    explanation:
      "CI is a practice where code changes are automatically integrated and tested frequently, catching issues early.",
  },
  {
    question: "What does the CAP Theorem state about distributed systems?",
    options: [
      "All systems must have high capacity",
      "You can have Consistency, Availability, and Partition tolerance simultaneously",
      "You can have at most two of: Consistency, Availability, Partition tolerance",
      "Nodes must communicate constantly",
    ],
    correctAnswer:
      "You can have at most two of: Consistency, Availability, Partition tolerance",
    explanation:
      "The CAP Theorem states that distributed systems can guarantee only two of: consistency, availability, and partition tolerance.",
  },
];

export async function generateQuiz(selectedIndustry) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const baseUser = await checkUser();
  if (!baseUser) throw new Error("User not found");

  const user = await db.user.findUnique({
    where: { id: baseUser.id },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const quizIndustry = selectedIndustry || user.industry || "General";
  const skillsText = user.skills?.length ? user.skills.join(", ") : "general professional skills";
  const prompt = `
    Generate exactly 10 multiple-choice interview questions for the ${quizIndustry} industry.
    Tailor them to this user's skills: ${skillsText}.

    Return only valid JSON in this exact format:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }

    Requirements:
    1. Every question must be clearly relevant to ${quizIndustry}.
    2. Each question must have exactly 4 options.
    3. The correctAnswer must exactly match one option.
    4. Keep explanations concise and helpful.
    5. Avoid markdown, code fences, and extra commentary.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleanedText);

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("Invalid quiz format");
    }

    return parsed.questions.slice(0, 10).map((question) => ({
      ...question,
      industry: quizIndustry,
    }));
  } catch (error) {
    console.error("Error generating industry-specific quiz:", error);

    return fallbackQuestions.map((question) => ({
      ...question,
      question: `[${quizIndustry}] ${question.question}`,
      explanation: `${question.explanation} This fallback question set is currently labeled for ${quizIndustry}.`,
      industry: quizIndustry,
    }));
  }
}

export async function saveQuizResult(questions, answers, score, selectedIndustry) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await checkUser();

  if (!user) throw new Error("User not found");

  const quizIndustry =
    selectedIndustry || questions?.[0]?.industry || user.industry || "General";

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${quizIndustry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: `Technical - ${quizIndustry}`,
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await checkUser();

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}
