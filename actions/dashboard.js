"use server";

import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const generateAIInsights = async (industry) => {
  // Using mock data - replace with real Gemini API when model access is available
  return {
    salaryRanges: [
      { role: "Junior Developer", min: 50000, max: 70000, median: 60000, location: "USA" },
      { role: "Mid-Level Developer", min: 75000, max: 100000, median: 87500, location: "USA" },
      { role: "Senior Developer", min: 100000, max: 140000, median: 120000, location: "USA" },
      { role: "Tech Lead", min: 120000, max: 170000, median: 145000, location: "USA" },
      { role: "Architect", min: 140000, max: 200000, median: 170000, location: "USA" }
    ],
    growthRate: 12,
    demandLevel: "High",
    topSkills: ["JavaScript", "Python", "React", "Node.js", "System Design"],
    marketOutlook: "Positive",
    keyTrends: ["AI Integration", "Remote Work", "Cloud Services", "DevOps", "Microservices"],
    recommendedSkills: ["AI/ML", "Cloud Platforms", "System Design", "Leadership", "Data Engineering"]
  };
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const baseUser = await checkUser();
  if (!baseUser) throw new Error("User not found");

  const user = await db.user.findUnique({
    where: { id: baseUser.id },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  // If no insights exist, generate them
  if (!user.industryInsight) {
    const insights = await generateAIInsights(user.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight;
  }

  return user.industryInsight;
}

const parseList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export async function updateIndustryInsights(payload) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const baseUser = await checkUser();
  if (!baseUser?.industry) throw new Error("User industry not set");

  let salaryRangesParsed;
  try {
    salaryRangesParsed =
      typeof payload.salaryRanges === "string"
        ? JSON.parse(payload.salaryRanges)
        : payload.salaryRanges;
  } catch (error) {
    throw new Error("Salary ranges must be valid JSON");
  }

  if (!Array.isArray(salaryRangesParsed) || salaryRangesParsed.length === 0) {
    throw new Error("Salary ranges must be a non-empty array");
  }

  const nextUpdate =
    payload.nextUpdate && !Number.isNaN(Date.parse(payload.nextUpdate))
      ? new Date(payload.nextUpdate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const growthRateNumber = Number(payload.growthRate);
  if (Number.isNaN(growthRateNumber)) {
    throw new Error("Growth rate must be a number");
  }

  const updateData = {
    salaryRanges: salaryRangesParsed,
    growthRate: growthRateNumber,
    demandLevel: payload.demandLevel || "Medium",
    marketOutlook: payload.marketOutlook || "Neutral",
    topSkills: parseList(payload.topSkills),
    keyTrends: parseList(payload.keyTrends),
    recommendedSkills: parseList(payload.recommendedSkills),
    lastUpdated: new Date(),
    nextUpdate,
    industry: baseUser.industry,
  };

  const insight = await db.industryInsight.upsert({
    where: { industry: baseUser.industry },
    update: updateData,
    create: updateData,
  });

  return insight;
}
