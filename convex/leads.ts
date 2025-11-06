import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new lead and start chat
export const createLead = mutation({
  args: { visitorText: v.string() },
  handler: async (ctx, { visitorText }) => {
    const userId = await getAuthUserId(ctx);
    
    const leadId = await ctx.db.insert("leads", {
      userId: userId || undefined, // Optional - anonymous users can create leads
      visitorText,
      state: "new",
      chat: [{ role: "user", content: visitorText, timestamp: Date.now() }],
      createdAt: Date.now(),
      ipAddress: undefined, // Could be added via HTTP action if needed
      userAgent: undefined, // Could be added via HTTP action if needed
    });
    return leadId;
  },
});

// Add a chat turn to a lead
export const addChatTurn = mutation({
  args: {
    leadId: v.id("leads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, { leadId, role, content }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");
    
    await ctx.db.patch(leadId, {
      chat: [...lead.chat, { role, content, timestamp: Date.now() }],
      lastActivity: Date.now(),
    });
  },
});

// Get lead by id
export const getLead = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) return null;
    
    // Optional: Check if user owns this lead (for authenticated users)
    const userId = await getAuthUserId(ctx);
    if (lead.userId && userId && lead.userId !== userId) {
      return null; // Don't return leads that don't belong to the user
    }
    
    return lead;
  },
});

// List leads for authenticated users
export const listMyLeads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("leads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// Admin function to list all leads (requires authentication)
export const listAllLeads = query({
  args: { 
    limit: v.optional(v.number()),
    state: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, state }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // In production, you'd want to check if user is admin
    // For now, any authenticated user can view leads
    if (state) {
      return await ctx.db
        .query("leads")
        .withIndex("by_state", (q) => q.eq("state", state))
        .order("desc")
        .take(Math.min(limit, 100));
    }
    
    return await ctx.db
      .query("leads")
      .order("desc")
      .take(Math.min(limit, 100));
  },
});

// Save lead intent (after chat analysis)
export const saveLeadIntent = mutation({
  args: {
    leadId: v.id("leads"),
    leadIntent: v.object({
      goal: v.string(),
      industry: v.optional(v.string()),
      companySize: v.optional(v.string()),
      budget: v.optional(v.string()),
      timeline: v.optional(v.string()),
      painPoints: v.array(v.string()),
      aiInterest: v.string(),
      qualificationScore: v.number(), // 1-10 score
    }),
  },
  handler: async (ctx, { leadId, leadIntent }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");
    
    await ctx.db.patch(leadId, { 
      leadIntent,
      state: "qualified",
      lastActivity: Date.now(),
    });
  },
});

// Book a slot with enhanced validation
export const bookSlot = mutation({
  args: {
    leadId: v.id("leads"),
    slot: v.string(),
    timezone: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { leadId, slot, timezone, email, name, company, phone }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
    
    // Validate slot is in the future
    const slotDate = new Date(slot);
    if (slotDate <= new Date()) {
      throw new Error("Cannot book slots in the past");
    }
    
    // Check if slot is already taken (optional - implement if needed)
    const existingBooking = await ctx.db
      .query("leads")
      .withIndex("by_state", (q) => q.eq("state", "booked"))
      .filter((q) => q.eq(q.field("booking.slot"), slot))
      .first();
    
    if (existingBooking) {
      throw new Error("This time slot is no longer available. Please select a different time or try a custom time slot.");
    }
    
    await ctx.db.patch(leadId, {
      booking: { 
        slot, 
        timezone,
        bookedAt: Date.now(),
        confirmed: false,
      },
      state: "booked",
      email,
      name,
      company,
      phone,
      lastActivity: Date.now(),
    });
    
    // Schedule confirmation email (if email service is configured)
    await ctx.scheduler.runAfter(0, api.leads.sendBookingConfirmation, {
      leadId,
    });
  },
});

// Generate AI response using OpenAI
export const generateAIResponse = mutation({
  args: {
    leadId: v.id("leads"),
    userMessage: v.string(),
  },
  handler: async (ctx, { leadId, userMessage }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");
    
    // Rate limiting: prevent too many AI calls
    const recentMessages = lead.chat.filter(
      msg => msg.timestamp && msg.timestamp > Date.now() - 60000 // Last minute
    );
    
    if (recentMessages.length > 10) {
      throw new Error("Too many messages. Please wait a moment.");
    }
    
    // Schedule the AI response generation
    await ctx.scheduler.runAfter(0, api.leads.processAIResponse, {
      leadId,
      userMessage,
    });
  },
});

// Process AI response (scheduled action)
export const processAIResponse = action({
  args: {
    leadId: v.id("leads"),
    userMessage: v.string(),
  },
  handler: async (ctx, { leadId, userMessage }) => {
    try {
      // Get the current lead and chat history
      const lead = await ctx.runQuery(api.leads.getLead, { leadId });
      if (!lead) return;

      // Build context for AI
      const chatHistory = lead.chat
        .slice(-10) // Only use last 10 messages for context
        .map(msg => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content,
        }));

      // Enhanced system prompt - removed auto-booking trigger
      const systemPrompt = `You are an expert AI business consultant for "The AI Guy" - a premium consultancy helping businesses implement AI solutions.

Your goals:
1. Understand their business context (industry, size, challenges)
2. Identify specific AI opportunities and use cases
3. Assess their readiness and budget for AI implementation
4. Build trust through expertise and valuable insights
5. Be helpful and provide value in every response

Guidelines:
- Keep responses conversational and under 100 words
- Ask ONE specific follow-up question per response
- Show expertise by mentioning relevant AI solutions
- Focus on business value, not technical details
- Be helpful even if they're not ready to buy
- NEVER mention booking or scheduling - let the user decide when they're ready
- Provide actionable insights and recommendations
- Ask about their specific challenges and goals

Current conversation stage: Lead qualification and value delivery`;

      // Use the bundled OpenAI API with better error handling
      const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-nano",
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
          ],
          max_tokens: 150,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      // Add AI response to chat
      await ctx.runMutation(api.leads.addChatTurn, {
        leadId,
        role: "assistant",
        content: aiResponse,
      });

    } catch (error) {
      console.error("AI response generation failed:", error);
      
      // Intelligent fallback responses based on conversation stage
      const lead = await ctx.runQuery(api.leads.getLead, { leadId });
      if (!lead) return;
      
      const conversationLength = lead.chat.length;
      let fallbackResponse: string;
      
      if (conversationLength <= 2) {
        fallbackResponse = "That's interesting! What industry is your business in, and what's your biggest operational challenge right now?";
      } else if (conversationLength <= 4) {
        fallbackResponse = "I can see several AI opportunities for your business. What's your current experience with automation or AI tools?";
      } else if (conversationLength <= 6) {
        fallbackResponse = "Based on what you've shared, AI could significantly impact your operations. What's your timeline for exploring new technology solutions?";
      } else {
        fallbackResponse = "That's a great point. What specific outcomes are you hoping to achieve with AI in your business?";
      }

      await ctx.runMutation(api.leads.addChatTurn, {
        leadId,
        role: "assistant",
        content: fallbackResponse,
      });
    }
  },
});

// Send booking confirmation email (placeholder - requires email service)
export const sendBookingConfirmation = action({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.runQuery(api.leads.getLead, { leadId });
    if (!lead || !lead.booking || !lead.email) return;
    
    try {
      // Send confirmation email using Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CONVEX_RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The AI Guy <agent1@system8.com.au>',
          to: lead.email,
          subject: '🎉 Your AI Discovery Session is Confirmed!',
          html: `<h1>🤖 Session Confirmed!</h1><p>Date: ${new Date(lead.booking.slot).toLocaleString()}</p><p>We'll send a calendar invite soon!</p>`,
        }),
      });

      if (response.ok) {
        console.log('Email sent successfully');
      }
    } catch (error) {
      console.error('Email failed:', error);
    }
    
    // Mark as confirmation sent
    await ctx.runMutation(api.leads.updateBookingStatus, {
      leadId,
      confirmed: true,
    });
  },
});

// Update booking confirmation status
export const updateBookingStatus = mutation({
  args: {
    leadId: v.id("leads"),
    confirmed: v.boolean(),
  },
  handler: async (ctx, { leadId, confirmed }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead || !lead.booking) return;
    
    await ctx.db.patch(leadId, {
      booking: {
        ...lead.booking,
        confirmed,
      },
    });
  },
});

// Analytics: Get lead conversion stats
export const getLeadStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const allLeads = await ctx.db.query("leads").collect();
    
    const stats = {
      total: allLeads.length,
      new: allLeads.filter(l => l.state === "new").length,
      qualified: allLeads.filter(l => l.state === "qualified").length,
      booked: allLeads.filter(l => l.state === "booked").length,
      confirmed: allLeads.filter(l => l.booking?.confirmed).length,
      conversionRate: allLeads.length > 0 ? 
        (allLeads.filter(l => l.state === "booked").length / allLeads.length * 100).toFixed(1) : "0",
    };
    
    return stats;
  },
});
