"use client";

export default function MessageriesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div>
        {/* NAVIGATION */}
        <nav className="flex items-center justify-between p-4 bg-blue-600/50">
          <h1 className="text-3xl font-bold text-white">
            💬 Messageres
          </h1>

          <div className="flex gap-3">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
              🔔
            </button>

            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
              Mon compte
            </button>
          </div>
        </nav>

        {/* ZONE MESSAGERIE */}
        <div className="flex h-[600px] border border-gray-700 bg-gray-950 shadow-sm">

          {/* COLONNE GAUCHE */}
          <div className="w-1/3 border-r border-gray-700">

            {/* TITRE */}
            <h2 className="p-4 text-xl font-bold text-white">
              Messages
            </h2>

            {/* RECHERCHE */}
            <div className="px-4 pb-4">
              <input
                type="text"
                placeholder="🔍 Rechercher..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* CONVERSATION ADMIN */}
            <div className="cursor-pointer border-y border-gray-700 bg-blue-900/30 px-4 py-4 hover:bg-blue-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-xl">
                    👨‍💼
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Admin ShopX
                    </h3>
                  </div>

                </div>

              </div>
            </div>

            {/* CONVERSATION SERVICE CLIENT */}
            <div className="cursor-pointer px-4 py-4 hover:bg-gray-900">
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-700 text-xl">
                  👨‍💻
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    Service client
                  </h3>
                </div>

              </div>
            </div>

          </div>

          {/* COLONNE DROITE */}
          <div className="flex flex-1 flex-col">

            {/* EN-TÊTE CONVERSATION */}
            <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-xl">
                  👨‍💼
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    Admin ShopX
                  </h2>

                </div>

              </div>

            </div>

            {/* MESSAGES */}
            <div className="flex-1 space-y-5 overflow-y-auto bg-gray-900 p-6">

              {/* MESSAGE ADMIN */}
              <div className="flex items-start gap-3">


              </div>

              {/* MESSAGE UTILISATEUR */}
              <div className="flex justify-end">

              </div>

            </div>

            {/* ZONE D'ÉCRITURE */}
            <div className="border-t border-gray-700 bg-gray-950 p-4">

              <div className="flex items-center gap-3">

                <button className="rounded-full p-3 text-xl text-white hover:bg-gray-800">
                  📎
                </button>

                <input
                  type="text"
                  placeholder="Écrire un message..."
                  className="flex-1 rounded-full border border-gray-700 bg-gray-900 px-5 py-3 text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />

                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-xl text-white hover:bg-blue-700">
                  ➤
                </button>

              </div>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
}