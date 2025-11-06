import { useMutation, useQuery } from "convex/react";
import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Hero } from "./components/Hero";
import { Chat } from "./components/Chat";
import { Scheduler } from "./components/Scheduler";
import { Confirmation } from "./components/Confirmation";
import React from "react";

export default function App() {
  const user = useQuery(api.auth.loggedInUser);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="w-full max-w-md mx-auto p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to The AI Guy</h1>
            <p className="text-gray-600">Sign in to start your AI transformation journey</p>
          </div>
          <SignInForm />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              The AI Guy
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.name || user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  // App state: "hero" | "chat" | "scheduler" | "confirmation"
  const [step, setStep] = React.useState<"hero" | "chat" | "scheduler" | "confirmation">("hero");
  const [leadId, setLeadId] = React.useState<Id<"leads"> | null>(null);
  const [systemThinking, setSystemThinking] = React.useState(false);
  const [bookingDetails, setBookingDetails] = React.useState<{
    slot: string;
    timezone: string;
    email: string;
  } | null>(null);

  // Chat state
  const lead = useQuery(
    api.leads.getLead,
    leadId ? { leadId } : "skip"
  );

  // 1. Hero: capture initial text
  const createLead = useMutation(api.leads.createLead);
  const handleHeroSubmit = async (text: string) => {
    try {
      const id = await createLead({ visitorText: text });
      setLeadId(id);
      setStep("chat");
      
      // Start AI conversation with a slight delay for better UX
      setTimeout(() => {
        handleAIResponse(id, text);
      }, 1500);
    } catch (error) {
      console.error("Failed to create lead:", error);
    }
  };

  // AI Response handler
  const generateAIResponse = useMutation(api.leads.generateAIResponse);
  const handleAIResponse = async (currentLeadId: Id<"leads">, userMessage: string) => {
    setSystemThinking(true);
    try {
      await generateAIResponse({ leadId: currentLeadId, userMessage });
    } catch (error) {
      console.error("Failed to generate AI response:", error);
      // Fallback response
      await addChatTurn({
        leadId: currentLeadId,
        role: "assistant",
        content: "I'd love to learn more about your business. What industry are you in?"
      });
    } finally {
      setSystemThinking(false);
    }
  };

  // 2. Chat: multi-turn with user-controlled booking
  const addChatTurn = useMutation(api.leads.addChatTurn);
  const handleChatSend = async (text: string) => {
    if (!leadId || !lead) return;
    
    try {
      // Add user message
      await addChatTurn({ leadId, role: "user", content: text });
      
      // Add delay before AI response for better readability
      setTimeout(async () => {
        await handleAIResponse(leadId, text);
      }, 800);
      
    } catch (error) {
      console.error("Failed to handle chat:", error);
    }
  };

  // Handle booking button click from chat
  const handleBookingRequest = () => {
    setStep("scheduler");
  };

  // 3. Scheduler
  const bookSlot = useMutation(api.leads.bookSlot);
  const [bookingLoading, setBookingLoading] = React.useState(false);
  const [bookingError, setBookingError] = React.useState("");
  
  const handleBook = async (slot: string, timezone: string, email: string) => {
    if (!leadId) return;
    
    setBookingLoading(true);
    setBookingError("");
    try {
      await bookSlot({ leadId, slot, timezone, email });
      setBookingDetails({ slot, timezone, email });
      setStep("confirmation");
    } catch (error) {
      console.error("Failed to book slot:", error);
      setBookingError(error instanceof Error ? error.message : "Failed to book slot. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (step === "hero") {
    return <Hero onSubmit={handleHeroSubmit} />;
  }
  if (step === "chat" && lead) {
    return (
      <Chat
        chat={lead.chat}
        onSend={handleChatSend}
        onBookingRequest={handleBookingRequest}
        disabled={systemThinking}
        systemThinking={systemThinking}
      />
    );
  }
  if (step === "scheduler") {
    return <Scheduler onBook={handleBook} loading={bookingLoading} error={bookingError} />;
  }
  if (step === "confirmation") {
    return <Confirmation booking={bookingDetails} />;
  }
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
