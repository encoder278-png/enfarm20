
import React, { useMemo, useState } from "react";
import type { FarmerProfile } from "../types";
import {
  MessageCircle,
  Send,
  Phone,
  MapPin,
  Leaf,
  Users,
  Search,
  Sprout,
  ShieldCheck,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface WhatsAppChatViewProps {
  farmers: FarmerProfile[];
  selectedFarmer: FarmerProfile | null;
  onSelectFarmer: (farmer: FarmerProfile) => void;
}

type SentMessage = {
  text: string;
  timestamp: string;
};

export default function WhatsAppChatView({
  farmers,
  selectedFarmer,
  onSelectFarmer,
}: WhatsAppChatViewProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [sendError, setSendError] = useState("");
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);

  const formatPhone = (id: string) =>
    id
      .replace("wa_", "+")
      .replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");

  const formatTime = (iso: string) => {
    if (!iso) return "";

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-TZ", {
      day: "numeric",
      month: "short",
    });
  };

  const filteredFarmers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return farmers;

    return farmers.filter((farmer) => {
      const name = farmer.name || "";
      const phone = formatPhone(farmer.farmerId);
      const location = farmer.location || "";
      const crops = (farmer.crops || []).join(" ");

      return `${name} ${phone} ${location} ${crops}`
        .toLowerCase()
        .includes(term);
    });
  }, [farmers, search]);

  const handleSend = async () => {
    if (!message.trim() || !selectedFarmer || sending) return;

    const messageText = message.trim();

    setSending(true);
    setSendError("");

    try {
      const response = await fetch("/api/whatsapp-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": import.meta.env.VITE_ADMIN_API_KEY || "",
        },
        body: JSON.stringify({
          to: selectedFarmer.farmerId.replace("wa_", "+"),
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Message request failed: ${response.status}`);
      }

      setSentMessages((previous) => [
        ...previous,
        {
          text: messageText,
          timestamp: new Date().toISOString(),
        },
      ]);

      setMessage("");
    } catch (error) {
      console.error("WhatsApp message error:", error);
      setSendError(
        "Message could not be sent. Check the connection and try again."
      );
    } finally {
      setSending(false);
    }
  };

  const allConversations = selectedFarmer
    ? [
        ...(selectedFarmer.conversations || []).map((conversation) => ({
          role: conversation.role,
          text: conversation.text,
          timestamp: conversation.timestamp,
        })),
        ...sentMessages.map((sent) => ({
          role: "admin" as const,
          text: sent.text,
          timestamp: sent.timestamp,
        })),
      ].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-0 overflow-hidden bg-[#F4F5F0] p-3 sm:p-5 lg:p-7"
    >
      <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col gap-5">

        {/* Page heading */}
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#557C62]">
              FARMER COMMUNICATION
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#183D32] sm:text-3xl">
              WhatsApp conversations
            </h1>

            <p className="mt-1 text-sm text-[#718076]">
              View farmer messages and communicate through EnFarm.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DCE4DA] bg-white px-3 py-2 text-xs font-medium text-[#52665A]">
            <MessageCircle className="h-4 w-4 text-[#477C62]" />
            {farmers.length} farmer records
          </div>
        </header>

        {/* Main messaging layout */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-[#E1E7DF] bg-white shadow-sm lg:grid-cols-[310px_minmax(0,1fr)]">

          {/* Farmer list */}
          <aside className="flex min-h-0 flex-col border-b border-[#E8ECE5] lg:border-b-0 lg:border-r">

            <div className="border-b border-[#E8ECE5] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[#183D32]">
                    Farmers
                  </h2>
                  <p className="mt-1 text-xs text-[#829287]">
                    Available farmer records
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDEFE4] text-[#315C47]">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829287]" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search farmers..."
                  aria-label="Search farmers"
                  className="w-full rounded-xl border border-[#E1E7DF] bg-[#F8FAF6] py-2.5 pl-9 pr-3 text-sm text-[#354B3D] outline-none transition-colors placeholder:text-[#9AA79D] focus:border-[#8DB49A] focus:bg-white"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {farmers.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F5EE] text-[#829287]">
                    <Users className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 font-semibold text-[#354B3D]">
                    No farmer records
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#829287]">
                    Farmer conversations will appear here when farmer records
                    are available.
                  </p>
                </div>
              ) : filteredFarmers.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-[#829287]">
                  No farmers match your search.
                </div>
              ) : (
                filteredFarmers.map((farmer) => {
                  const lastMessage =
                    (farmer.conversations || []).slice(-1)[0];

                  const isSelected =
                    selectedFarmer?.farmerId === farmer.farmerId;

                  const displayName =
                    farmer.name || formatPhone(farmer.farmerId);

                  return (
                    <button
                      type="button"
                      key={farmer.farmerId}
                      onClick={() => {
                        setSendError("");
                        setSentMessages([]);
                        onSelectFarmer(farmer);
                      }}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3 border-b border-[#EEF1EB] px-4 py-4 text-left transition-colors hover:bg-[#F8FAF6] ${
                        isSelected
                          ? "border-l-[3px] border-l-[#477C62] bg-[#F0F6F0]"
                          : "border-l-[3px] border-l-transparent"
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DDEFE4] text-sm font-semibold text-[#315C47]">
                        {displayName[0]?.toUpperCase() || "F"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[#273D30]">
                            {displayName}
                          </p>

                          {lastMessage && (
                            <span className="shrink-0 text-[11px] text-[#829287]">
                              {formatDate(lastMessage.timestamp)}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs text-[#829287]">
                          {lastMessage
                            ? `${lastMessage.role === "farmer" ? "" : "CEN: "}${lastMessage.text}`
                            : formatPhone(farmer.farmerId)}
                        </p>

                        {farmer.location && (
                          <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-[#9AA79D]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {farmer.location}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-[#E8ECE5] bg-[#FAFBF8] px-4 py-3">
              <p className="text-xs text-[#829287]">
                Showing {filteredFarmers.length} of {farmers.length} records
              </p>
            </div>
          </aside>

          {/* Conversation panel */}
          <section className="flex min-h-0 min-w-0 flex-col bg-[#FBFCF9]">

            {selectedFarmer ? (
              <>
                {/* Conversation header */}
                <div className="flex shrink-0 items-center gap-3 border-b border-[#E8ECE5] bg-white px-4 py-4 sm:px-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DDEFE4] text-sm font-semibold text-[#315C47]">
                    {(selectedFarmer.name ||
                      formatPhone(selectedFarmer.farmerId))[0]?.toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-[#183D32]">
                      {selectedFarmer.name ||
                        formatPhone(selectedFarmer.farmerId)}
                    </h2>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#829287]">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(selectedFarmer.farmerId)}
                      </span>

                      {selectedFarmer.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedFarmer.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#EDF5EE] px-3 py-2 text-xs font-medium text-[#477C62] sm:flex">
                    <ShieldCheck className="h-4 w-4" />
                    Farmer record
                  </div>
                </div>

                {/* Recorded crops */}
                {(selectedFarmer.crops || []).length > 0 && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#E8ECE5] bg-white px-4 py-3 sm:px-6">
                    <Sprout className="h-4 w-4 text-[#557C62]" />

                    <span className="text-xs font-medium text-[#718076]">
                      Recorded crops:
                    </span>

                    {selectedFarmer.crops.map((crop, index) => (
                      <span
                        key={`${crop}-${index}`}
                        className="rounded-full border border-[#DCE8DC] bg-[#F0F6F0] px-2.5 py-1 text-xs text-[#477C62]"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                )}

                {/* Messages */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                  {allConversations.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDF4EC] text-[#829287]">
                        <MessageCircle className="h-8 w-8" />
                      </div>

                      <h3 className="mt-4 font-semibold text-[#354B3D]">
                        No messages recorded
                      </h3>

                      <p className="mt-2 max-w-sm text-sm leading-6 text-[#829287]">
                        There are currently no conversation messages available
                        for this farmer.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto flex max-w-3xl flex-col gap-4">
                      {allConversations.map((msg, index) => {
                        const isFarmer = msg.role === "farmer";
                        const isAdmin = msg.role === "admin";

                        return (
                          <div
                            key={`${msg.timestamp}-${index}`}
                            className={`flex ${
                              isFarmer ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
                                isFarmer
                                  ? "rounded-bl-md border border-[#E1E7DF] bg-white text-[#354B3D]"
                                  : isAdmin
                                  ? "rounded-br-md bg-[#DDEFE4] text-[#183D32]"
                                  : "rounded-br-md bg-[#EDF3EB] text-[#315C47]"
                              }`}
                            >
                              <p
                                className={`mb-1.5 text-[11px] font-semibold ${
                                  isFarmer
                                    ? "text-[#829287]"
                                    : isAdmin
                                    ? "text-[#315C47]"
                                    : "text-[#477C62]"
                                }`}
                              >
                                {isFarmer
                                  ? "Farmer"
                                  : isAdmin
                                  ? "EnFarm operator"
                                  : "CEN AI"}
                              </p>

                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {msg.text}
                              </p>

                              <p className="mt-2 flex items-center justify-end gap-1 text-[10px] opacity-60">
                                <Clock3 className="h-3 w-3" />
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Message error */}
                {sendError && (
                  <div
                    role="alert"
                    className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:mx-6"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {sendError}
                  </div>
                )}

                {/* Message composer */}
                <div className="shrink-0 border-t border-[#E8ECE5] bg-white p-4 sm:px-6 sm:py-5">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSend();
                    }}
                    className="mx-auto flex max-w-3xl items-center gap-3"
                  >
                    <input
                      type="text"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Write a message to this farmer..."
                      aria-label="Message to farmer"
                      className="min-w-0 flex-1 rounded-xl border border-[#E1E7DF] bg-[#F8FAF6] px-4 py-3 text-sm text-[#354B3D] outline-none transition-colors placeholder:text-[#9AA79D] focus:border-[#8DB49A] focus:bg-white"
                    />

                    <button
                      type="submit"
                      disabled={!message.trim() || sending}
                      aria-label="Send message"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#183D32] text-white transition-colors hover:bg-[#315C47] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>

                  <p className="mx-auto mt-2 max-w-3xl text-xs text-[#9AA79D]">
                    Messages are sent through the configured EnFarm WhatsApp
                    service.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EDF4EC] text-[#477C62]">
                  <MessageCircle className="h-9 w-9" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-[#183D32]">
                  Farmer conversations
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#829287]">
                  Select a farmer from the list to view their available
                  conversation history and send a message.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  );
}
