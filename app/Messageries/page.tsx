"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import Link from "next/link";
import echo from "@/lib/echo";

interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
  is_online?: boolean;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  message: string;
  read_at: string | null;
  created_at: string;
  sender?: User;
}

interface Conversation {
  id: number;
  user_id: number;
  admin_id: number;
  user?: User;
  admin?: User;
  messages?: Message[];
  unread_count?: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export default function MessageriesPage() {
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [creatingConversation, setCreatingConversation] =
    useState(false);

  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null);

  const [currentUserRole, setCurrentUserRole] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [admins, setAdmins] = useState<User[]>([]);
  const [showAdminList, setShowAdminList] =
    useState(false);

  const [onlineUsers, setOnlineUsers] =
    useState<User[]>([]);

  const [deletingConversation, setDeletingConversation] =
    useState(false);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * =========================
   * UTILISATEUR CONNECTÉ
   * =========================
   */

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      return;
    }

    try {
      const parsedUser = JSON.parse(user);

      if (parsedUser?.id) {
        setCurrentUserId(parsedUser.id);
      }

      if (parsedUser?.role) {
        setCurrentUserRole(parsedUser.role);
      }
    } catch (error) {
      console.error(
        "Impossible de récupérer l'utilisateur connecté :",
        error
      );
    }
  }, []);

  const isAdmin = currentUserRole === "admin";

  /*
   * =========================
   * CONVERSATIONS
   * =========================
   */

  const fetchConversations = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur conversations : ${response.status}`
        );
      }

      const data = await response.json();

      setConversations(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Erreur récupération conversations :",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  /*
   * =========================
   * ADMINISTRATEURS
   * =========================
   */

  const fetchAdmins = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admins`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur récupération administrateurs : ${response.status}`
        );
      }

      const data = await response.json();

      const adminUsers: User[] = Array.isArray(data)
        ? data
        : [];

      setAdmins(
        adminUsers.filter(
          (admin) => admin.id !== currentUserId
        )
      );
    } catch (error) {
      console.error(
        "Erreur récupération administrateurs :",
        error
      );
    }
  };

  const handleNewConversation = async () => {
    setShowAdminList(true);
    await fetchAdmins();
  };

  /*
   * =========================
   * CRÉER CONVERSATION
   * =========================
   */

  const handleCreateConversation = async (
    admin: User
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setCreatingConversation(true);

    try {
      const response = await fetch(
        `${API_URL}/conversations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_id: admin.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Erreur création conversation : ${response.status}`
        );
      }

      const newConversation: Conversation =
        data.conversation;

      if (!newConversation?.id) {
        throw new Error(
          "Le serveur n'a pas retourné de conversation valide."
        );
      }

      const conversationResponse = await fetch(
        `${API_URL}/conversations/${newConversation.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (conversationResponse.ok) {
        const completeConversation =
          await conversationResponse.json();

        setConversations(
          (currentConversations) => {
            const alreadyExists =
              currentConversations.some(
                (conversation) =>
                  conversation.id ===
                  completeConversation.id
              );

            if (alreadyExists) {
              return currentConversations.map(
                (conversation) =>
                  conversation.id ===
                  completeConversation.id
                    ? completeConversation
                    : conversation
              );
            }

            return [
              completeConversation,
              ...currentConversations,
            ];
          }
        );

        setSelectedConversation(
          completeConversation
        );
      } else {
        const conversationWithAdmin: Conversation = {
          ...newConversation,
          admin,
        };

        setConversations(
          (currentConversations) => [
            conversationWithAdmin,
            ...currentConversations,
          ]
        );

        setSelectedConversation(
          conversationWithAdmin
        );
      }

      setShowAdminList(false);
    } catch (error) {
      console.error(
        "Erreur création conversation :",
        error
      );
    } finally {
      setCreatingConversation(false);
    }
  };

  /*
   * =========================
   * MARQUER CONVERSATION LUE
   * =========================
   */

  const handleMarkConversationAsRead = async (
    conversation: Conversation
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversation.id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            `Erreur marquage conversation : ${response.status}`
        );
      }

      setConversations(
        (currentConversations) =>
          currentConversations.map(
            (currentConversation) =>
              currentConversation.id === conversation.id
                ? {
                    ...currentConversation,
                    unread_count: 0,
                  }
                : currentConversation
          )
      );

      setSelectedConversation(
        (currentConversation) => {
          if (
            !currentConversation ||
            currentConversation.id !== conversation.id
          ) {
            return currentConversation;
          }

          return {
            ...currentConversation,
            unread_count: 0,
          };
        }
      );

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.sender_id !== currentUserId &&
          !message.read_at
            ? {
                ...message,
                read_at: new Date().toISOString(),
              }
            : message
        )
      );
    } catch (error) {
      console.error(
        "Erreur marquage conversation comme lue :",
        error
      );
    }
  };

  /*
   * =========================
   * SÉLECTION
   * =========================
   */

  const handleSelectConversation = async (
    conversation: Conversation
  ) => {
    setSelectedConversation(conversation);

    await handleMarkConversationAsRead(
      conversation
    );
  };

  const handleCloseConversation = () => {
    setSelectedConversation(null);
    setMessages([]);
    setNewMessage("");
  };

  /*
   * =========================
   * SUPPRESSION CONVERSATION
   * =========================
   */

  const handleDeleteConversation = async () => {
    if (!selectedConversation) {
      return;
    }

    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette conversation de votre liste ? Les messages resteront visibles pour l'autre participant."
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setDeletingConversation(true);

    try {
      const conversationId =
        selectedConversation.id;

      const response = await fetch(
        `${API_URL}/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Erreur suppression conversation : ${response.status}`
        );
      }

      setConversations(
        (currentConversations) =>
          currentConversations.filter(
            (conversation) =>
              conversation.id !== conversationId
          )
      );

      setSelectedConversation(null);
      setMessages([]);
      setNewMessage("");
    } catch (error) {
      console.error(
        "Erreur suppression conversation :",
        error
      );
    } finally {
      setDeletingConversation(false);
    }
  };

  /*
   * =========================
   * MESSAGES
   * =========================
   */

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/conversations/${selectedConversation.id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Erreur messages : ${response.status}`
          );
        }

        const data = await response.json();

        setMessages(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Erreur récupération messages :",
          error
        );
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  /*
   * Aller directement au dernier message
   */

  useEffect(() => {
    if (!selectedConversation || messages.length === 0) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, [messages, selectedConversation]);

  /*
   * =========================
   * ECHO / TEMPS RÉEL
   * =========================
   */

  useEffect(() => {
    if (!echo) {
      return;
    }

    const echoInstance = echo;

    const presenceChannel =
      echoInstance.join("presence.chat");

    presenceChannel.here((users: User[]) => {
      setOnlineUsers(users);
    });

    presenceChannel.joining((user: User) => {
      setOnlineUsers((currentUsers) => {
        if (
          currentUsers.some(
            (currentUser) =>
              currentUser.id === user.id
          )
        ) {
          return currentUsers;
        }

        return [...currentUsers, user];
      });
    });

    presenceChannel.leaving((user: User) => {
      setOnlineUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) =>
            currentUser.id !== user.id
        )
      );
    });

    if (selectedConversation) {
      echoInstance
        .private(
          `conversation.${selectedConversation.id}`
        )
        .listen(
          ".message.sent",
          (data: Message) => {
            setMessages((currentMessages) => {
              if (
                currentMessages.some(
                  (message) =>
                    message.id === data.id
                )
              ) {
                return currentMessages;
              }

              return [
                ...currentMessages,
                data,
              ];
            });

            if (
              data.sender_id !== currentUserId
            ) {
              handleMarkConversationAsRead(
                selectedConversation
              );
            }
          }
        )
        .listen(
          ".message.read",
          (data: {
            id: number;
            conversation_id: number;
            read_at: string | null;
          }) => {
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === data.id
                  ? {
                      ...message,
                      read_at: data.read_at,
                    }
                  : message
              )
            );
          }
        )
        .listen(
          ".message.deleted",
          (data: {
            id: number;
            conversation_id: number;
          }) => {
            setMessages((currentMessages) =>
              currentMessages.filter(
                (message) =>
                  message.id !== data.id
              )
            );
          }
        );
    }

    return () => {
      if (selectedConversation) {
        echoInstance.leave(
          `conversation.${selectedConversation.id}`
        );
      }

      echoInstance.leave("presence.chat");
    };
  }, [selectedConversation, currentUserId]);

  /*
   * =========================
   * ENVOYER MESSAGE
   * =========================
   */

  const handleSendMessage = async () => {
    if (!selectedConversation) {
      return;
    }

    const trimmedMessage =
      newMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            `Erreur envoi message : ${response.status}`
        );
      }

      const data = await response.json();

      if (data.data) {
        setMessages((currentMessages) => {
          if (
            currentMessages.some(
              (message) =>
                message.id === data.data.id
            )
          ) {
            return currentMessages;
          }

          return [
            ...currentMessages,
            data.data,
          ];
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error(
        "Erreur envoi message :",
        error
      );
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  /*
   * =========================
   * MESSAGE LU
   * =========================
   */

  const handleMarkAsRead = async (
    message: Message
  ) => {
    if (!currentUserId) {
      return;
    }

    if (message.sender_id === currentUserId) {
      return;
    }

    if (message.read_at) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/messages/${message.id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur marquage message : ${response.status}`
        );
      }

      setMessages((currentMessages) =>
        currentMessages.map(
          (currentMessage) =>
            currentMessage.id === message.id
              ? {
                  ...currentMessage,
                  read_at:
                    new Date().toISOString(),
                }
              : currentMessage
        )
      );
    } catch (error) {
      console.error(
        "Erreur message lu :",
        error
      );
    }
  };

  /*
   * =========================
   * SUPPRIMER MESSAGE
   * =========================
   */

  const handleDeleteMessage = async (
    message: Message
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/messages/${message.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            `Erreur suppression : ${response.status}`
        );
      }

      setMessages((currentMessages) =>
        currentMessages.filter(
          (currentMessage) =>
            currentMessage.id !== message.id
        )
      );
    } catch (error) {
      console.error(
        "Erreur suppression message :",
        error
      );
    }
  };

  /*
   * =========================
   * HELPERS
   * =========================
   */

  const isUserOnline = (
    userId: number | undefined
  ) => {
    if (!userId) {
      return false;
    }

    return onlineUsers.some(
      (user) => user.id === userId
    );
  };

  const getConversationUser = (
    conversation: Conversation
  ): User | undefined => {
    if (currentUserId === conversation.user_id) {
      return conversation.admin;
    }

    return conversation.user;
  };

  const getUnreadCount = (
    conversation: Conversation
  ) => {
    return conversation.unread_count ?? 0;
  };

  const filteredConversations =
    conversations.filter((conversation) => {
      if (!isAdmin) {
        return true;
      }

      const search = searchTerm
        .trim()
        .toLowerCase();

      if (!search) {
        return true;
      }

      const userName =
        conversation.user?.name
          ?.toLowerCase() ?? "";

      return userName.includes(search);
    });

  const totalUnread = conversations.reduce(
    (total, conversation) =>
      total + getUnreadCount(conversation),
    0
  );

  const selectedUser = selectedConversation
    ? getConversationUser(selectedConversation)
    : undefined;

  const selectedUserOnline = selectedUser
    ? isUserOnline(selectedUser.id)
    : false;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="flex h-screen flex-col overflow-hidden">

        {/* =====================================================
            NAVIGATION SHOPX
        ====================================================== */}

        <header className="z-30 flex h-16 shrink-0 items-center border-b border-white/10 bg-black/90 px-4 backdrop-blur-xl md:px-8">

          <div className="flex w-full items-center justify-between">

            {/* LOGO */}

            <Link
              href="/"
              className="group flex items-center gap-3"
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 via-violet-500/20 to-fuchsia-500/20 shadow-[0_0_25px_rgba(34,211,238,0.15)]">
                <span className="text-lg font-black italic text-cyan-300">
                  X
                </span>

                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:translate-x-full group-hover:opacity-100" />
              </div>

              <div>
                <span className="block text-lg font-black tracking-wider">
                  SHOP
                  <span className="text-cyan-300">X</span>
                </span>

                <span className="hidden text-[9px] uppercase tracking-[0.3em] text-zinc-500 sm:block">
                  Digital Store
                </span>
              </div>
            </Link>

            {/* NAVIGATION */}

            <nav className="hidden items-center gap-1 lg:flex">

              <Link
                href="/"
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Accueil
              </Link>

              <Link
                href="/Produits"
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Catalogue
              </Link>

              <Link
                href="/Boutique"
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Boutiques
              </Link>

              <Link
                href="/Commandes"
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Commandes
              </Link>

              <Link
                href="/Messageries"
                className="relative rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.12)]"
              >
                <span className="mr-2">✦</span>
                Messages

                {totalUnread > 0 && (
                  <span className="ml-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold shadow-[0_0_12px_rgba(217,70,239,0.5)]">
                    {totalUnread}
                  </span>
                )}
              </Link>

            </nav>

            {/* ACTIONS */}

            <div className="flex items-center gap-2">

              <Link
                href="/Notifications"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300 sm:flex"
                title="Notifications"
              >
                ♢
              </Link>

              <Link
                href="/Compte"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold transition hover:border-violet-400/30 hover:bg-violet-400/10"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-[10px] font-black text-black">
                  {currentUserId ? "U" : "?"}
                </span>

                <span className="hidden md:block">
                  Mon compte
                </span>
              </Link>

            </div>
          </div>
        </header>

        {/* =====================================================
            ESPACE MESSAGERIE
        ====================================================== */}

        <div className="flex min-h-0 flex-1">

          {/* ===================================================
              SIDEBAR
          ==================================================== */}

          <aside className="flex w-full shrink-0 flex-col border-r border-white/10 bg-[#080808] md:w-[340px]">

            {/* SIDEBAR HEADER */}

            <div className="border-b border-white/10 p-5">

              <div className="mb-5 flex items-start justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

                    <h1 className="text-xl font-black tracking-tight">
                      Messageries
                    </h1>
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    Centre de communication ShopX
                  </p>
                </div>

                <div className="rounded-lg border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Live
                </div>
              </div>

              {/* STAT */}

              <div className="mb-4 grid grid-cols-2 gap-2">

                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Discussions
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {conversations.length}
                  </p>
                </div>

                <div className="rounded-xl border border-fuchsia-400/10 bg-fuchsia-400/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Non lus
                  </p>

                  <p className="mt-1 text-lg font-black text-fuchsia-300">
                    {totalUnread}
                  </p>
                </div>

              </div>

              {/* RECHERCHE ADMIN */}

              {isAdmin && (
                <div className="relative mb-3">

                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                    ⌕
                  </span>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Rechercher un utilisateur..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 py-3 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/40 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                  />

                </div>
              )}

              {/* NOUVELLE CONVERSATION */}

              <button
                type="button"
                onClick={handleNewConversation}
                className="group relative w-full overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 via-violet-500/10 to-fuchsia-500/10 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-300/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.12)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-lg text-cyan-300">
                    ＋
                  </span>
                  Nouvelle conversation
                </span>

                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition duration-700 group-hover:translate-x-full" />
              </button>
            </div>

            {/* CHOIX ADMIN */}

            {showAdminList && (
              <div className="border-b border-white/10 bg-gradient-to-b from-violet-500/[0.06] to-transparent p-4">

                <div className="mb-3 flex items-center justify-between">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                      Nouvelle discussion
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Sélectionnez un administrateur
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAdminList(false)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-500 transition hover:border-white/20 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {admins.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                    <p className="text-sm text-zinc-500">
                      Aucun administrateur disponible.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {admins.map((admin) => (
                      <button
                        key={admin.id}
                        type="button"
                        disabled={
                          creatingConversation
                        }
                        onClick={() =>
                          handleCreateConversation(
                            admin
                          )
                        }
                        className="group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] disabled:opacity-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 font-black text-cyan-300 ring-1 ring-cyan-400/20">
                          {admin.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {admin.name}
                          </p>

                          <p className="text-[11px] text-zinc-500">
                            Administrateur ShopX
                          </p>
                        </div>

                        <span className="ml-auto text-zinc-600 transition group-hover:text-cyan-300">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LISTE */}

            <div className="min-h-0 flex-1 overflow-y-auto">

              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

                    <p className="text-xs text-zinc-600">
                      Chargement des discussions...
                    </p>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="px-6 py-16 text-center">

                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl text-zinc-600">
                    ◇
                  </div>

                  <p className="text-sm font-semibold text-zinc-400">
                    {isAdmin &&
                    searchTerm.trim()
                      ? "Aucun utilisateur trouvé."
                      : "Aucune conversation."}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Commencez une nouvelle discussion.
                  </p>

                </div>
              ) : (
                filteredConversations.map(
                  (conversation) => {
                    const otherUser =
                      getConversationUser(
                        conversation
                      );

                    const unreadCount =
                      getUnreadCount(
                        conversation
                      );

                    const online =
                      isUserOnline(
                        otherUser?.id
                      );

                    const active =
                      selectedConversation?.id ===
                      conversation.id;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          handleSelectConversation(
                            conversation
                          )
                        }
                        className={`group relative flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-4 text-left transition ${
                          active
                            ? "bg-gradient-to-r from-cyan-400/[0.08] via-violet-500/[0.07] to-transparent"
                            : "hover:bg-white/[0.025]"
                        }`}
                      >

                        {/* BARRE ACTIVE */}

                        {active && (
                          <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-r-full bg-gradient-to-b from-cyan-300 via-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                        )}

                        {/* AVATAR */}

                        <div
                          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black ${
                            active
                              ? "bg-gradient-to-br from-cyan-400/20 via-violet-500/20 to-fuchsia-500/20 text-cyan-300 ring-1 ring-cyan-400/30"
                              : "bg-white/[0.05] text-zinc-400 ring-1 ring-white/10"
                          }`}
                        >
                          {otherUser?.name
                            ?.charAt(0)
                            .toUpperCase() ?? "?"}

                          {online && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#080808] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                          )}
                        </div>

                        {/* INFOS */}

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center justify-between gap-2">

                            <p className="truncate text-sm font-bold text-zinc-200">
                              {otherUser?.name ??
                                "Utilisateur"}
                            </p>

                            {unreadCount > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1.5 text-[10px] font-black text-white shadow-[0_0_12px_rgba(217,70,239,0.45)]">
                                {unreadCount}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-2">

                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                online
                                  ? "bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.8)]"
                                  : "bg-zinc-700"
                              }`}
                            />

                            <p
                              className={`text-[11px] ${
                                online
                                  ? "text-emerald-400"
                                  : "text-zinc-600"
                              }`}
                            >
                              {online
                                ? "En ligne"
                                : "Hors ligne"}
                            </p>
                          </div>

                        </div>

                      </button>
                    );
                  }
                )
              )}
            </div>
          </aside>

          {/* ===================================================
              CHAT
          ==================================================== */}

          <main className="relative hidden min-w-0 flex-1 flex-col overflow-hidden bg-[#050505] md:flex">

            {/* GRADIENT BACKGROUND */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

              <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-violet-600/[0.07] blur-[120px]" />

              <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-cyan-400/[0.05] blur-[120px]" />

              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/[0.025] blur-[100px]" />

            </div>

            {!selectedConversation ? (
              <div className="relative flex flex-1 items-center justify-center">

                <div className="max-w-md px-6 text-center">

                  <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-violet-500/10 to-fuchsia-500/10 shadow-[0_0_60px_rgba(139,92,246,0.1)]">

                    <span className="text-4xl">
                      ◇
                    </span>

                    <span className="absolute inset-0 rounded-[28px] border border-white/5" />
                  </div>

                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400/70">
                    SHOPX MESSAGING
                  </p>

                  <h2 className="text-3xl font-black tracking-tight">
                    Votre espace
                    <span className="bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      {" "}
                      messages
                    </span>
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    Sélectionnez une conversation
                    pour échanger avec votre
                    interlocuteur en temps réel.
                  </p>

                  <button
                    type="button"
                    onClick={handleNewConversation}
                    className="mt-7 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:shadow-[0_0_25px_rgba(34,211,238,0.12)]"
                  >
                    ＋ Démarrer une conversation
                  </button>

                </div>
              </div>
            ) : (
              <>

                {/* ============================================
                    HEADER CHAT
                ============================================= */}

                <header className="relative flex shrink-0 items-center gap-3 border-b border-white/10 bg-black/70 px-5 py-4 backdrop-blur-xl">

                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 via-violet-500/20 to-fuchsia-500/20 font-black text-cyan-300 ring-1 ring-cyan-400/20">

                    {selectedUser?.name
                      ?.charAt(0)
                      .toUpperCase() ?? "?"}

                    {selectedUserOnline && (
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-black bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">

                      <h2 className="truncate text-sm font-black text-white">
                        {selectedUser?.name ??
                          "Utilisateur"}
                      </h2>

                      {selectedUserOnline && (
                        <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 sm:inline-block">
                          En ligne
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      {selectedUserOnline
                        ? "Disponible maintenant"
                        : "Hors ligne"}
                    </p>

                  </div>

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={
                        handleCloseConversation
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-500 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                      title="Fermer"
                    >
                      ×
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleDeleteConversation
                      }
                      disabled={
                        deletingConversation
                      }
                      className="hidden h-9 items-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.05] px-3 text-xs font-bold text-red-400 transition hover:border-red-500/30 hover:bg-red-500/10 sm:flex"
                    >
                      {deletingConversation
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>

                  </div>
                </header>

                {/* ============================================
                    MESSAGES
                ============================================= */}

                <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-6">

                  <div className="mx-auto flex max-w-4xl flex-col gap-3">

                    {messages.length === 0 ? (
                      <div className="flex h-full min-h-[400px] items-center justify-center">

                        <div className="text-center">

                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xl text-zinc-600">
                            ✦
                          </div>

                          <p className="text-sm font-semibold text-zinc-500">
                            Aucun message pour le moment.
                          </p>

                          <p className="mt-1 text-xs text-zinc-700">
                            Envoyez le premier message.
                          </p>

                        </div>

                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine =
                          message.sender_id ===
                          currentUserId;

                        return (
                          <div
                            key={message.id}
                            className={`group flex ${
                              isMine
                                ? "justify-end"
                                : "justify-start"
                            }`}
                            onMouseEnter={() =>
                              handleMarkAsRead(
                                message
                              )
                            }
                          >

                            <div
                              className={`relative max-w-[78%] rounded-2xl px-4 py-3 shadow-lg ${
                                isMine
                                  ? "rounded-br-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_30px_rgba(139,92,246,0.12)]"
                                  : "rounded-bl-md border border-white/[0.07] bg-white/[0.045] text-zinc-100"
                              }`}
                            >

                              <p className="break-words text-sm leading-6">
                                {message.message}
                              </p>

                              <div
                                className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${
                                  isMine
                                    ? "text-white/60"
                                    : "text-zinc-600"
                                }`}
                              >

                                <span>
                                  {new Date(
                                    message.created_at
                                  ).toLocaleTimeString(
                                    "fr-FR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>

                                {isMine && (
                                  <span
                                    className={
                                      message.read_at
                                        ? "font-bold text-cyan-200"
                                        : ""
                                    }
                                  >
                                    {message.read_at
                                      ? "✓✓"
                                      : "✓"}
                                  </span>
                                )}

                              </div>

                              {(isMine ||
                                selectedConversation.admin_id ===
                                  currentUserId) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMessage(
                                      message
                                    )
                                  }
                                  className={`mt-2 text-[10px] opacity-0 transition group-hover:opacity-100 ${
                                    isMine
                                      ? "text-white/60 hover:text-white"
                                      : "text-red-400 hover:text-red-300"
                                  }`}
                                >
                                  Supprimer
                                </button>
                              )}

                            </div>

                          </div>
                        );
                      })
                    )}

                    <div ref={messagesEndRef} />

                  </div>
                </div>

                {/* ============================================
                    COMPOSER
                ============================================= */}

                <div className="relative shrink-0 border-t border-white/10 bg-black/70 p-4 backdrop-blur-xl">

                  <div className="mx-auto flex max-w-4xl items-center gap-3">

                    <div className="relative flex-1">

                      <input
                        type="text"
                        value={newMessage}
                        onChange={(event) =>
                          setNewMessage(
                            event.target.value
                          )
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="Écrivez votre message..."
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/30 focus:bg-cyan-400/[0.025] focus:shadow-[0_0_25px_rgba(34,211,238,0.06)]"
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-700">
                        ↵
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="group flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 text-sm font-black text-black shadow-[0_0_25px_rgba(139,92,246,0.18)] transition hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(139,92,246,0.3)] disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:scale-100"
                    >
                      <span className="hidden sm:block">
                        Envoyer
                      </span>

                      <span className="text-lg">
                        →
                      </span>
                    </button>

                  </div>

                  <p className="mx-auto mt-2 hidden max-w-4xl text-[9px] uppercase tracking-wider text-zinc-700 sm:block">
                    Entrée pour envoyer • Communication sécurisée ShopX
                  </p>

                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}