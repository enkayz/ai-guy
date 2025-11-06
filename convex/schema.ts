import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  leads: defineTable({
    // Core lead data
    userId: v.optional(v.id("users")), // Optional - allows anonymous leads
    visitorText: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    
    // Lead qualification data
    leadIntent: v.optional(v.object({
      goal: v.string(),
      industry: v.optional(v.string()),
      companySize: v.optional(v.string()),
      budget: v.optional(v.string()),
      timeline: v.optional(v.string()),
      painPoints: v.array(v.string()),
      aiInterest: v.string(),
      qualificationScore: v.number(), // 1-10 score
    })),
    
    // State management
    state: v.string(), // "new", "qualified", "booked", "completed", "lost"
    
    // Chat history with timestamps
    chat: v.array(v.object({
      role: v.string(), // "user" | "assistant"
      content: v.string(),
      timestamp: v.optional(v.number()),
    })),
    
    // Booking information
    booking: v.optional(v.object({
      slot: v.string(), // ISO date string
      timezone: v.string(),
      bookedAt: v.optional(v.number()),
      confirmed: v.optional(v.boolean()),
    })),
    
    // Tracking data
    createdAt: v.number(),
    lastActivity: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    source: v.optional(v.string()), // "website", "referral", etc.
    
  })
    .index("by_state", ["state"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_created_at", ["createdAt"])
    .index("by_last_activity", ["lastActivity"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
