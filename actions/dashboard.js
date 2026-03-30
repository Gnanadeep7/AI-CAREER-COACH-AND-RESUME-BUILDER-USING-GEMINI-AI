"use server";

import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
