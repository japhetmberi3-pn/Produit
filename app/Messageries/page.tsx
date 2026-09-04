"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";

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

  /*
   * Récupérer l'utilisateur connecté
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

  /*
   * Vérifier si l'utilisateur connecté est admin
   */
  const isAdmin = currentUserRole === "admin";

  /*
   * Récupérer les conversations
   */
  const fetchConversations = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/conversations",
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

  /*
   * Charger les conversations au démarrage
   */
  useEffect(() => {
    fetchConversations();
  }, []);

  /*
   * Récupérer les administrateurs
   */
  const fetchAdmins = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/admins",
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

  /*
   * Ouvrir la fenêtre de création
   */
  const handleNewConversation = async () => {
    setShowAdminList(true);

    await fetchAdmins();
  };

  /*
   * Créer une conversation avec un admin
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
        "http://127.0.0.1:8000/api/conversations",
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

      /*
       * Récupérer la conversation complète
       */
      const conversationResponse = await fetch(
        `http://127.0.0.1:8000/api/conversations/${newConversation.id}`,
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
   * Marquer toute la conversation comme lue
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
        `http://127.0.0.1:8000/api/conversations/${conversation.id}/read`,
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

      /*
       * Mettre le compteur de cette conversation à 0
       */
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

      /*
       * Mettre également à jour la conversation sélectionnée
       */
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

      /*
       * Mettre les messages reçus comme lus
       */
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
   * Sélectionner une conversation
   */
  const handleSelectConversation = async (
    conversation: Conversation
  ) => {
    setSelectedConversation(conversation);

    await handleMarkConversationAsRead(
      conversation
    );
  };

  /*
   * Fermer la discussion ouverte.
   *
   * La conversation reste dans la liste.
   * Aucun message n'est supprimé.
   */
  const handleCloseConversation = () => {
    setSelectedConversation(null);
    setMessages([]);
    setNewMessage("");
  };

  /*
   * Supprimer la conversation uniquement pour
   * l'utilisateur connecté.
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
        `http://127.0.0.1:8000/api/conversations/${conversationId}`,
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

      /*
       * Retirer la conversation de la liste
       * uniquement chez l'utilisateur actuel.
       */
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
   * Récupérer les messages
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
          `http://127.0.0.1:8000/api/conversations/${selectedConversation.id}/messages`,
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
   * Echo + présence + temps réel
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

    let privateChannel:
      | ReturnType<typeof echoInstance.private>
      | null = null;

    if (selectedConversation) {
      privateChannel = echoInstance
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

            /*
             * Si le message vient de l'autre utilisateur,
             * la conversation est ouverte : on le marque comme lu.
             */
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
   * Envoyer un message
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
        `http://127.0.0.1:8000/api/conversations/${selectedConversation.id}/messages`,
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

  /*
   * Entrée
   */
  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  /*
   * Marquer un message comme lu
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
        `http://127.0.0.1:8000/api/messages/${message.id}/read`,
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
   * Supprimer un message
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
        `http://127.0.0.1:8000/api/messages/${message.id}`,
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
   * Utilisateur en ligne
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

  /*
   * Autre participant
   */
  const getConversationUser = (
    conversation: Conversation
  ): User | undefined => {
    if (currentUserId === conversation.user_id) {
      return conversation.admin;
    }

    return conversation.user;
  };

  /*
   * Messages non lus d'une conversation
   */
  const getUnreadCount = (
    conversation: Conversation
  ) => {
    if (
      conversation.unread_count !== undefined
    ) {
      return conversation.unread_count;
    }

    return 0;
  };

  /*
   * Recherche des conversations par nom.
   *
   * Pour l'administrateur, on recherche le nom
   * de l'utilisateur avec lequel il discute.
   */
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex h-screen max-w-7xl overflow-hidden">

        {/* =========================
            LISTE CONVERSATIONS
        ========================== */}

        <aside className="w-80 border-r border-gray-800 bg-gray-950">

          <div className="border-b border-gray-800 p-5">

            {/* TITRE */}
            <div>
              <h1 className="text-2xl font-bold text-blue-500">
                Messageries
              </h1>
            </div>

            <p className="mt-1 text-sm text-gray-400">
              Vos conversations
            </p>

            {/* =========================
                RECHERCHE ADMIN
            ========================== */}

            {isAdmin && (
              <div className="mt-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Rechercher par nom..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleNewConversation}
              className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700"
            >
              + Nouvelle conversation
            </button>
          </div>

          {/* =========================
              CHOIX ADMIN
          ========================== */}

          {showAdminList && (
            <div className="border-b border-gray-800 bg-gray-900 p-4">

              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">
                  Choisir un administrateur
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowAdminList(false)
                  }
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {admins.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Aucun administrateur disponible.
                </p>
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
                      className="flex w-full items-center gap-3 rounded-xl bg-gray-800 p-3 text-left transition hover:bg-blue-600 disabled:opacity-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold">
                        {admin.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {admin.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          Administrateur
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================
              CONVERSATIONS
          ========================== */}

          <div className="overflow-y-auto">
            {loading ? (
              <div className="p-5 text-center text-gray-400">
                Chargement...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-5 text-center text-gray-400">
                {isAdmin &&
                searchTerm.trim()
                  ? "Aucun utilisateur trouvé."
                  : "Aucune conversation."}
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

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() =>
                        handleSelectConversation(
                          conversation
                        )
                      }
                      className={`flex w-full items-center gap-3 border-b border-gray-800 p-4 text-left transition ${
                        selectedConversation?.id ===
                        conversation.id
                          ? "bg-blue-600"
                          : "hover:bg-gray-900"
                      }`}
                    >
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold">
                        {otherUser?.name
                          ?.charAt(0)
                          .toUpperCase() ?? "?"}

                        {online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-950 bg-green-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold">
                            {otherUser?.name ??
                              "Utilisateur"}
                          </p>

                          {unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs ${
                            online
                              ? "text-green-400"
                              : "text-gray-500"
                          }`}
                        >
                          {online
                            ? "En ligne"
                            : "Hors ligne"}
                        </p>
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </aside>

        {/* =========================
            ZONE CHAT
        ========================== */}

        <main className="flex flex-1 flex-col bg-gray-900">

          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">

                <div className="mb-4 text-6xl">
                  💬
                </div>

                <h2 className="text-2xl font-bold">
                  Messagerie
                </h2>

                <p className="mt-2 text-gray-400">
                  Cliquez sur une conversation
                  pour commencer.
                </p>

              </div>
            </div>
          ) : (
            <>
              {/* =========================
                  EN-TÊTE
              ========================== */}

              <header className="flex items-center gap-3 border-b border-gray-800 bg-gray-950 p-4">

                <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 font-bold">
                  {getConversationUser(
                    selectedConversation
                  )?.name
                    ?.charAt(0)
                    .toUpperCase() ?? "?"}

                  {isUserOnline(
                    getConversationUser(
                      selectedConversation
                    )?.id
                  ) && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-950 bg-green-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold">
                    {getConversationUser(
                      selectedConversation
                    )?.name ??
                      "Utilisateur"}
                  </h2>

                  <p className="text-sm text-gray-400">
                    {isUserOnline(
                      getConversationUser(
                        selectedConversation
                      )?.id
                    )
                      ? "En ligne"
                      : "Hors ligne"}
                  </p>
                </div>

                {/* =========================
                    BOUTON FERMER
                ========================== */}

                <button
                  type="button"
                  onClick={
                    handleCloseConversation
                  }
                  className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold transition hover:bg-gray-600"
                >
                  Fermer
                </button>

                {/* =========================
                    BOUTON SUPPRIMER
                ========================== */}

                <button
                  type="button"
                  onClick={
                    handleDeleteConversation
                  }
                  disabled={deletingConversation}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingConversation
                    ? "Suppression..."
                    : "Supprimer"}
                </button>
              </header>

              {/* =========================
                  MESSAGES
              ========================== */}

              <div className="flex-1 space-y-3 overflow-y-auto p-5">

                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Aucun message.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine =
                      message.sender_id ===
                      currentUserId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
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
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isMine
                              ? "bg-blue-600 text-white"
                              : "bg-gray-800 text-gray-100"
                          }`}
                        >
                          <p className="break-words">
                            {message.message}
                          </p>

                          <div className="mt-1 flex items-center justify-end gap-2 text-xs opacity-70">
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
                              <span>
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
                              className="mt-2 text-xs text-red-300 hover:text-red-100"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* =========================
                  ENVOI
              ========================== */}

              <div className="border-t border-gray-800 bg-gray-950 p-4">
                <div className="flex gap-3">

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
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Envoyer
                  </button>

                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}