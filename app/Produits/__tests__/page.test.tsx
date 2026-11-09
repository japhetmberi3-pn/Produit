import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProductsPage from "../page";
import { AuthProvider } from "@/app/context/AuthContext";
import { ThemeProvider } from "@/app/context/ThemeContext";

/* =========================================================
   MOCKS
========================================================= */

const pushMock = vi.fn();

// Objet routeur STABLE (comme dans Next) : un nouvel objet à chaque rendu
// relancerait les useEffect dépendant de `router` en boucle.
const routerMock = { push: pushMock };
let searchParamsMock = new URLSearchParams();

vi.mock("next/navigation", () => ({
    useRouter: () => routerMock,
    usePathname: () => "/Produits",
    useSearchParams: () => searchParamsMock,
}));

interface TestProduct {
    id: number;
    user_id: number;
    shop_id: number;
    name: string;
    description?: string | null;
    price: number;
    stock: number;
    created_at: string;
    updated_at: string;
    shop?: { id: number; name: string; description?: string | null } | null;
}

const baseProduct: TestProduct = {
    id: 1,
    user_id: 1,
    shop_id: 3,
    name: "Ordinateur HP",
    description: "Ordinateur portable",
    price: 500000,
    stock: 10,
    created_at: "2026-09-01",
    updated_at: "2026-09-01",
    shop: { id: 3, name: "Boutique Tech", description: null },
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });

type Handler = (init?: RequestInit) => Response | Promise<Response>;

/**
 * Faux fetch routé par "MÉTHODE chemin" (ex. "GET /products").
 * Les appels de la Navbar (notifications, conversations...) reçoivent
 * une réponse vide par défaut : l'ordre des appels n'a plus d'importance.
 */
const routes = new Map<string, Handler>();

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const path = url.pathname.replace(/^\/api/, "");
    const method = (init?.method ?? "GET").toUpperCase();

    const handler = routes.get(`${method} ${path}`);

    if (handler) return handler(init);
    if (path.endsWith("/reviews")) return json({ reviews: [], average: 0, count: 0 });
    if (path === "/notifications") return json({ notifications: [], unread_count: 0 });
    if (path === "/conversations" || path === "/cart") return json([]);

    throw new Error(`Route non simulée : ${method} ${path}`);
});

const route = (key: string, handler: Handler) => routes.set(key, handler);

const callsTo = (method: string, path: string) =>
    fetchMock.mock.calls.filter(([input, init]) => {
        const url = new URL(String(input));

        return (
            (init?.method ?? "GET").toUpperCase() === method &&
            url.pathname.replace(/^\/api/, "") === path
        );
    });

const bodyOf = (method: string, path: string) => {
    const calls = callsTo(method, path);
    const init = calls[calls.length - 1]?.[1];

    return init?.body ? JSON.parse(String(init.body)) : undefined;
};

/* =========================================================
   HELPERS
========================================================= */

const login = (role?: string) => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, name: "Test User", ...(role ? { role } : {}) })
    );
};

const renderPage = () =>
    render(
        <ThemeProvider>
            <AuthProvider>
                <ProductsPage />
            </AuthProvider>
        </ThemeProvider>
    );

const findCard = async (name: string) =>
    (await screen.findByRole("heading", { name })).closest("article") as HTMLElement;

beforeEach(() => {
    localStorage.clear();
    routes.clear();
    searchParamsMock = new URLSearchParams();
    fetchMock.mockClear();
    pushMock.mockReset();

    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    vi.spyOn(console, "error").mockImplementation(() => {});

    route("GET /products", () => json([baseProduct]));
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

/* =========================================================
   TESTS
========================================================= */

describe("ProduitsPage — chargement", () => {
    it("redirige vers la connexion sans token", async () => {
        renderPage();

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/Connexion"));
        expect(callsTo("GET", "/products")).toHaveLength(0);
    });

    it("affiche les produits récupérés depuis l'API", async () => {
        login();
        renderPage();

        const card = await findCard("Ordinateur HP");

        expect(within(card).getByText("Ordinateur portable")).toBeInTheDocument();
        expect(within(card).getByText(/500\s000/)).toBeInTheDocument();
        expect(within(card).getByText("Disponible")).toBeInTheDocument();
        expect(within(card).getByText("Boutique Tech")).toBeInTheDocument();

        const [, init] = callsTo("GET", "/products")[0];
        expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    });

    it("accepte une réponse { products: [...] }", async () => {
        login();
        route("GET /products", () => json({ products: [baseProduct] }));
        renderPage();

        expect(await findCard("Ordinateur HP")).toBeInTheDocument();
    });

    it("affiche un état vide lorsqu'il n'y a aucun produit", async () => {
        login();
        route("GET /products", () => json([]));
        renderPage();

        expect(await screen.findByText("Aucun produit disponible")).toBeInTheDocument();
    });

    it("affiche une erreur lorsque la récupération des produits échoue", async () => {
        login();
        route("GET /products", () => json({ message: "Erreur serveur" }, 500));
        renderPage();

        expect(await screen.findByText("Impossible de récupérer les produits.")).toBeInTheDocument();
    });

    it("déconnecte l'utilisateur lorsque l'API retourne 401", async () => {
        login();
        route("GET /products", () => json({ message: "Unauthenticated." }, 401));
        renderPage();

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/Connexion"));
        expect(localStorage.getItem("token")).toBeNull();
    });

    it("affiche la note moyenne récupérée pour chaque produit", async () => {
        login();
        route("GET /products/1/reviews", () => json({ reviews: [], average: 4.5, count: 2 }));
        renderPage();

        const card = await findCard("Ordinateur HP");

        expect(await within(card).findByText("4.5")).toBeInTheDocument();
        expect(within(card).getByText("(2 avis)")).toBeInTheDocument();
    });

    it("affiche le nombre d'articles du panier", async () => {
        login();
        route("GET /cart", () => json({ items: [{ id: 1, quantity: 2 }, { id: 2, quantity: 3 }] }));
        renderPage();

        expect(await screen.findByRole("link", { name: "Panier (5)" })).toBeInTheDocument();
    });
});

describe("ProduitsPage — recherche, filtres et tri", () => {
    const catalog = [
        { ...baseProduct, id: 1, name: "Ordinateur HP", price: 500000, created_at: "2026-09-01" },
        { ...baseProduct, id: 2, name: "Téléphone Samsung", description: "Smartphone", price: 250000, stock: 0, created_at: "2026-09-03",
          shop: { id: 4, name: "Mobile Shop", description: null } },
        { ...baseProduct, id: 3, name: "Souris sans fil", description: "Accessoire", price: 15000, created_at: "2026-09-02" },
    ];

    const productNames = () =>
        screen.getAllByRole("article").map((article) => within(article).getByRole("heading").textContent);

    beforeEach(() => {
        route("GET /products", () => json(catalog));
    });

    it("reprend la recherche passée dans l'URL (?search=)", async () => {
        login();
        searchParamsMock = new URLSearchParams("search=telephone");
        renderPage();

        expect(await screen.findByRole("heading", { name: /Résultats pour « telephone »/ })).toBeInTheDocument();
        expect(productNames()).toEqual(["Téléphone Samsung"]);
    });

    it("filtre en stock, par boutique et par prix", async () => {
        login();
        const user = userEvent.setup();
        renderPage();

        await findCard("Ordinateur HP");
        expect(productNames()).toHaveLength(3);

        await user.click(screen.getByLabelText("En stock uniquement"));
        expect(productNames()).toEqual(["Souris sans fil", "Ordinateur HP"]);

        await user.type(screen.getByLabelText("Prix maximum"), "100000");
        expect(productNames()).toEqual(["Souris sans fil"]);

        await user.click(screen.getAllByRole("button", { name: "Réinitialiser les filtres" })[0]);
        await user.click(screen.getByRole("checkbox", { name: /Mobile Shop/ }));
        expect(productNames()).toEqual(["Téléphone Samsung"]);
    });

    it("trie par prix croissant", async () => {
        login();
        const user = userEvent.setup();
        renderPage();

        await findCard("Ordinateur HP");
        expect(productNames()).toEqual(["Téléphone Samsung", "Souris sans fil", "Ordinateur HP"]);

        await user.selectOptions(screen.getByLabelText("Trier par"), "price-asc");
        expect(productNames()).toEqual(["Souris sans fil", "Téléphone Samsung", "Ordinateur HP"]);
    });

    it("affiche un message quand aucun produit ne correspond", async () => {
        login();
        const user = userEvent.setup();
        renderPage();

        await findCard("Ordinateur HP");
        await user.type(screen.getByLabelText("Rechercher"), "introuvable");

        expect(screen.getByText("Aucun produit ne correspond à vos critères")).toBeInTheDocument();
    });
});

describe("ProduitsPage — panier et favoris", () => {
    it("ajoute un produit au panier puis rafraîchit le compteur", async () => {
        login();
        let cart: { id: number; quantity: number }[] = [];
        route("GET /cart", () => json(cart));
        route("POST /cart", () => {
            cart = [{ id: 1, quantity: 1 }];
            return json({ message: "Ajouté" }, 201);
        });

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: /Ajouter au panier/ }));

        await waitFor(() => expect(callsTo("POST", "/cart")).toHaveLength(1));
        expect(bodyOf("POST", "/cart")).toEqual({ product_id: 1, quantity: 1 });

        // La Navbar recharge le panier après l'événement "cartUpdated".
        expect(await screen.findByRole("link", { name: "Panier (1)" })).toBeInTheDocument();
        expect(within(card).getByRole("button", { name: /Ajouté au panier/ })).toBeInTheDocument();
    });

    it("affiche l'erreur de l'API lorsque l'ajout au panier échoue", async () => {
        login();
        route("POST /cart", () => json({ message: "Stock insuffisant." }, 422));

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: /Ajouter au panier/ }));

        expect(await screen.findByText("Stock insuffisant.")).toBeInTheDocument();
    });

    it("désactive l'achat d'un produit en rupture de stock", async () => {
        login();
        route("GET /products", () => json([{ ...baseProduct, stock: 0 }]));
        renderPage();

        const card = await findCard("Ordinateur HP");

        expect(within(card).getByRole("button", { name: "Rupture de stock" })).toBeDisabled();
        expect(within(card).getByText("Rupture", { ignore: "script, style, button *" })).toBeInTheDocument();
    });

    it("ajoute puis retire un produit des favoris", async () => {
        login();
        const onFavoritesUpdated = vi.fn();
        window.addEventListener("favoritesUpdated", onFavoritesUpdated);

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");

        await user.click(within(card).getByRole("button", { name: "Ajouter aux favoris" }));
        await waitFor(() => expect(localStorage.getItem("shopx_favorites")).toBe("[1]"));

        await user.click(within(card).getByRole("button", { name: "Retirer des favoris" }));
        await waitFor(() => expect(localStorage.getItem("shopx_favorites")).toBe("[]"));

        expect(onFavoritesUpdated).toHaveBeenCalled();
        window.removeEventListener("favoritesUpdated", onFavoritesUpdated);
    });

    it("recharge les favoris existants depuis localStorage", async () => {
        login();
        localStorage.setItem("shopx_favorites", JSON.stringify([1]));
        renderPage();

        const card = await findCard("Ordinateur HP");

        expect(within(card).getByRole("button", { name: "Retirer des favoris" })).toBeInTheDocument();
    });

    it("propose des liens vers la boutique et la fiche du produit", async () => {
        login();
        renderPage();

        const card = await findCard("Ordinateur HP");

        expect(within(card).getByRole("link", { name: /Boutique Tech/ })).toHaveAttribute("href", "/Boutique/3");
        expect(within(card).getByRole("link", { name: "Ordinateur HP" })).toHaveAttribute("href", "/Produits/1");
    });
});

describe("ProduitsPage — gestion des produits", () => {
    it("n'affiche pas le formulaire de gestion à un client", async () => {
        login();
        renderPage();

        const card = await findCard("Ordinateur HP");

        expect(screen.queryByLabelText("Nom du produit")).not.toBeInTheDocument();
        expect(within(card).queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    });

    it("crée un produit (vendeur)", async () => {
        login("vendeur");
        route("POST /products", () => json({ product: { ...baseProduct, id: 2 } }, 201));

        const user = userEvent.setup();
        renderPage();

        await findCard("Ordinateur HP");

        await user.type(screen.getByLabelText("Nom du produit"), "Téléphone Samsung");
        await user.type(screen.getByLabelText("Prix"), "250000");
        await user.type(screen.getByLabelText("Stock"), "5");
        await user.type(screen.getByLabelText("Description"), "Smartphone");
        await user.click(screen.getByRole("button", { name: "Ajouter le produit" }));

        await waitFor(() => expect(callsTo("POST", "/products")).toHaveLength(1));
        expect(bodyOf("POST", "/products")).toEqual({
            name: "Téléphone Samsung",
            description: "Smartphone",
            price: 250000,
            stock: 5,
        });

        // Liste rechargée et formulaire vidé.
        await waitFor(() => expect(callsTo("GET", "/products")).toHaveLength(2));
        expect(screen.getByLabelText("Nom du produit")).toHaveValue("");
    });

    it("affiche l'erreur retournée par l'API lors de la création", async () => {
        login("admin");
        route("POST /products", () => json({ message: "Le nom est déjà utilisé." }, 422));

        const user = userEvent.setup();
        renderPage();

        await findCard("Ordinateur HP");

        await user.type(screen.getByLabelText("Nom du produit"), "Doublon");
        await user.type(screen.getByLabelText("Prix"), "10");
        await user.type(screen.getByLabelText("Stock"), "1");
        await user.click(screen.getByRole("button", { name: "Ajouter le produit" }));

        expect(await screen.findByText("Le nom est déjà utilisé.")).toBeInTheDocument();
    });

    it("modifie un produit (admin)", async () => {
        login("admin");
        route("PUT /products/1", () => json({ product: { ...baseProduct, name: "Ordinateur Dell" } }));

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: "Modifier" }));

        const nameInput = screen.getByLabelText("Nom du produit");
        expect(nameInput).toHaveValue("Ordinateur HP");

        await user.clear(nameInput);
        await user.type(nameInput, "Ordinateur Dell");
        await user.click(screen.getByRole("button", { name: "Modifier le produit" }));

        await waitFor(() => expect(callsTo("PUT", "/products/1")).toHaveLength(1));
        expect(bodyOf("PUT", "/products/1")).toEqual({
            name: "Ordinateur Dell",
            description: "Ordinateur portable",
            price: 500000,
            stock: 10,
        });
    });

    it("annule la modification", async () => {
        login("admin");

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: "Modifier" }));
        await user.click(screen.getByRole("button", { name: "Annuler" }));

        expect(screen.getByLabelText("Nom du produit")).toHaveValue("");
        expect(screen.getByRole("button", { name: "Ajouter le produit" })).toBeInTheDocument();
    });

    it("supprime un produit après confirmation", async () => {
        login("vendeur");
        localStorage.setItem("shopx_favorites", JSON.stringify([1]));
        route("DELETE /products/1", () => json({ message: "Supprimé" }));

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: "Supprimer" }));

        await waitFor(() =>
            expect(screen.queryByRole("heading", { name: "Ordinateur HP" })).not.toBeInTheDocument()
        );
        expect(callsTo("DELETE", "/products/1")).toHaveLength(1);
        expect(localStorage.getItem("shopx_favorites")).toBe("[]");
    });

    it("ne supprime rien si l'utilisateur annule la confirmation", async () => {
        login("vendeur");
        vi.mocked(window.confirm).mockReturnValue(false);

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: "Supprimer" }));

        expect(callsTo("DELETE", "/products/1")).toHaveLength(0);
        expect(screen.getByRole("heading", { name: "Ordinateur HP" })).toBeInTheDocument();
    });
});

describe("ProduitsPage — avis", () => {
    it("publie un avis avec la note et le commentaire choisis", async () => {
        login();
        route("POST /products/1/reviews", () => json({ message: "OK" }, 201));

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: /Donner une note/ }));
        await user.click(within(card).getByRole("button", { name: "Donner 4 étoiles" }));
        await user.type(within(card).getByLabelText("Commentaire"), "  Très bon produit  ");
        await user.click(within(card).getByRole("button", { name: "Publier mon avis" }));

        expect(await within(card).findByText(/Votre avis a été ajouté avec succès/)).toBeInTheDocument();
        expect(bodyOf("POST", "/products/1/reviews")).toEqual({
            rating: 4,
            comment: "Très bon produit",
        });
    });

    it("affiche le message d'erreur de l'API pour un avis refusé", async () => {
        login();
        route("POST /products/1/reviews", () =>
            json({ message: "Vous avez déjà noté ce produit." }, 422)
        );

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: /Donner une note/ }));
        await user.click(within(card).getByRole("button", { name: "Publier mon avis" }));

        expect(await within(card).findByText("Vous avez déjà noté ce produit.")).toBeInTheDocument();
        expect(bodyOf("POST", "/products/1/reviews")).toEqual({ rating: 5, comment: null });
    });

    it("ferme le formulaire d'avis avec Annuler", async () => {
        login();

        const user = userEvent.setup();
        renderPage();

        const card = await findCard("Ordinateur HP");
        await user.click(within(card).getByRole("button", { name: /Donner une note/ }));
        await user.click(within(card).getByRole("button", { name: "Annuler" }));

        expect(within(card).queryByLabelText("Commentaire")).not.toBeInTheDocument();
        expect(within(card).getByRole("button", { name: /Donner une note/ })).toBeInTheDocument();
    });
});
