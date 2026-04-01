"use server";

import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const safeParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
};

const extractFirstJson = (text) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return text;
  return text.slice(start, end + 1);
};

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildFallbackQuestions = (quizIndustry) => [
  {
    question: `In ${quizIndustry}, which KPI best measures long-term profitability?`,
    options: [
      "Customer Lifetime Value (CLV)",
      "CPU Utilization",
      "Server Memory Speed",
      "Number of Code Commits",
    ],
    correctAnswer: "Customer Lifetime Value (CLV)",
    explanation: "CLV captures recurring revenue and retention impact for the industry.",
  },
  {
    question: `What tactic most directly reduces churn in ${quizIndustry}?`,
    options: [
      "Proactive support for at-risk customers",
      "Adding more signup fields",
      "Increasing CAPTCHA difficulty",
      "Longer shipping windows",
    ],
    correctAnswer: "Proactive support for at-risk customers",
    explanation: "Early intervention keeps customers engaged and reduces churn.",
  },
  {
    question: `Which metric is the clearest signal of conversion health in ${quizIndustry}?`,
    options: [
      "Cart-to-checkout rate",
      "Number of backend threads",
      "Average SQL query time",
      "Compiler warning count",
    ],
    correctAnswer: "Cart-to-checkout rate",
    explanation: "It shows how effectively intent turns into purchases.",
  },
  {
    question: `What customer data is most actionable for personalization in ${quizIndustry}?`,
    options: [
      "Recent browsing and purchase history",
      "CPU cache size",
      "Data center square footage",
      "IDE theme preference",
    ],
    correctAnswer: "Recent browsing and purchase history",
    explanation: "Behavioral signals drive relevant recommendations.",
  },
  {
    question: `Which lever best improves average order value in ${quizIndustry}?`,
    options: [
      "Contextual bundles and cross-sells",
      "Reducing payment options",
      "Removing product photos",
      "Longer checkout forms",
    ],
    correctAnswer: "Contextual bundles and cross-sells",
    explanation: "Well-placed bundles increase cart size without friction.",
  },
  {
    question: `What is the primary goal of a loyalty program in ${quizIndustry}?`,
    options: [
      "Increase repeat purchase frequency",
      "Consume more server bandwidth",
      "Reduce warehouse space",
      "Slow delivery times",
    ],
    correctAnswer: "Increase repeat purchase frequency",
    explanation: "Loyalty programs aim to lift retention and purchase cadence.",
  },
  {
    question: `Which A/B test metric best shows checkout UX improvement in ${quizIndustry}?`,
    options: [
      "Checkout completion rate",
      "CSS file size",
      "Number of log statements",
      "CI build duration",
    ],
    correctAnswer: "Checkout completion rate",
    explanation: "It directly measures successful conversions through checkout.",
  },
  {
    question: `What operational change most reduces returns in ${quizIndustry}?`,
    options: [
      "Clear sizing/fit guidance and photos",
      "Fewer product details",
      "Removing customer reviews",
      "Slower customer support responses",
    ],
    correctAnswer: "Clear sizing/fit guidance and photos",
    explanation: "Accurate expectations reduce mismatches and returns.",
  },
  {
    question: `Which channel is typically most measurable for ROAS in ${quizIndustry}?`,
    options: ["Paid search", "Office signage", "Random cold calls", "Untracked flyers"],
    correctAnswer: "Paid search",
    explanation: "Search ads provide strong intent signals and clear attribution.",
  },
  {
    question: `What inventory approach best prevents stockouts in ${quizIndustry}?`,
    options: [
      "Demand forecasting with safety stock",
      "Ignoring seasonality",
      "Single-supplier reliance",
      "No reorder thresholds",
    ],
    correctAnswer: "Demand forecasting with safety stock",
    explanation: "Forecasting plus buffers keeps popular items available.",
  },
].map((q) => ({ ...q, industry: quizIndustry, fallback: true }));

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

    const cleaned = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Try strict JSON first
    const parsed =
      safeParseJson(cleaned) ||
      // Fallback: try to extract first JSON object in the string
      safeParseJson(extractFirstJson(cleaned));

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("Quiz JSON missing or empty");
    }

    return parsed.questions.slice(0, 10).map((question) => ({
      ...question,
      industry: quizIndustry,
    }));
  } catch (error) {
    console.error("Error generating industry-specific quiz:", error);

    return shuffleArray(buildFallbackQuestions(quizIndustry)).map((q) => ({
      ...q,
      options: shuffleArray(q.options),
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
