import { describe, expect, it, beforeEach, vi } from "vitest";
import {
    render,
    screen,
    waitFor,
    fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductsPage from "../page";

const pushMock = vi.fn();
const mockFetch = vi.fn();

const routerMock = {
    push: pushMock,
};

vi.mock("next/navigation", () => ({
    useRouter: () => routerMock,
}));

const product = {
    id: 1,
    user_id: 1,
    name: "Ordinateur HP",
    description: "Ordinateur portable",
    price: 500000,
    stock: 10,
    created_at: "2026-09-01",
    updated_at: "2026-09-01",
};

const productsResponse = () =>
    new Response(JSON.stringify([product]), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });

const notificationsResponse = (unreadCount = 0) =>
    new Response(
        JSON.stringify({
            notifications: [],
            unread_count: unreadCount,
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

beforeEach(() => {
    vi.resetAllMocks();

    mockFetch.mockReset();

    Object.defineProperty(window, "localStorage", {
        value: {
            getItem: vi.fn((key: string) => {
                if (key === "token") {
                    return "test-token";
                }

                if (key === "user") {
                    return JSON.stringify({
                        id: 1,
                        name: "Test User",
                    });
                }

                return null;
            }),
            removeItem: vi.fn(),
            setItem: vi.fn(),
        },
        writable: true,
    });

    Object.defineProperty(window, "confirm", {
        value: vi.fn(() => true),
        writable: true,
    });

    Object.defineProperty(window, "prompt", {
        value: vi.fn(() => "1"),
        writable: true,
    });

    Object.defineProperty(window, "scrollTo", {
        value: vi.fn(),
        writable: true,
    });

    global.fetch = mockFetch;
});

describe("ProductsPage", () => {
    it("affiche les produits récupérés depuis l'API", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse());

        render(<ProductsPage />);

        expect(
            await screen.findByText("Ordinateur HP")
        ).toBeInTheDocument();

        expect(
            screen.getByText("500 000 FCFA")
        ).toBeInTheDocument();

        expect(
            screen.getByText("10")
        ).toBeInTheDocument();
    });

    it("affiche le message lorsqu'il n'y a aucun produit", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(notificationsResponse());

        render(<ProductsPage />);

        expect(
            await screen.findByText("Aucun produit")
        ).toBeInTheDocument();
    });

    it("affiche le nombre de notifications non lues", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(
                notificationsResponse(5)
            );

        render(<ProductsPage />);

        expect(
            await screen.findByText("5")
        ).toBeInTheDocument();
    });

    it("redirige vers les notifications", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(notificationsResponse());

        const user = userEvent.setup();

        render(<ProductsPage />);

        const button = await screen.findByRole("button", {
            name: /notifications/i,
        });

        await user.click(button);

        expect(pushMock).toHaveBeenCalledWith(
            "/Notifications"
        );
    });

    it("crée un produit", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(
                notificationsResponse()
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        product: {
                            ...product,
                            id: 2,
                            name: "Téléphone Samsung",
                            description: "Smartphone",
                            price: 250000,
                            stock: 5,
                        },
                    }),
                    {
                        status: 201,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        const user = userEvent.setup();

        render(<ProductsPage />);

        await user.type(
            screen.getByLabelText("Nom du produit"),
            "Téléphone Samsung"
        );

        await user.type(
            screen.getByLabelText("Prix"),
            "250000"
        );

        await user.type(
            screen.getByLabelText("Stock"),
            "5"
        );

        await user.type(
            screen.getByLabelText("Description"),
            "Smartphone"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Ajouter le produit",
            })
        );

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        expect(mockFetch).toHaveBeenLastCalledWith(
            expect.stringContaining("/products"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    name: "Téléphone Samsung",
                    description: "Smartphone",
                    price: 250000,
                    stock: 5,
                }),
            })
        );

        expect(
            await screen.findByText(
                "Produit créé et enregistré dans la base de données."
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText("Téléphone Samsung")
        ).toBeInTheDocument();
    });

    it("modifie un produit", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        product: {
                            ...product,
                            name: "Ordinateur Dell",
                        },
                    }),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Modifier",
            })
        );

        const nameInput =
            screen.getByLabelText("Nom du produit");

        await user.clear(nameInput);

        await user.type(
            nameInput,
            "Ordinateur Dell"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Modifier le produit",
            })
        );

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        expect(
            await screen.findByText(
                "Produit modifié avec succès."
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText("Ordinateur Dell")
        ).toBeInTheDocument();
    });

    it("supprime un produit", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message:
                            "Produit supprimé avec succès.",
                    }),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Supprimer",
            })
        );

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        expect(
            await screen.findByText(
                "Produit supprimé avec succès."
            )
        ).toBeInTheDocument();

        expect(
            screen.queryByText("Ordinateur HP")
        ).not.toBeInTheDocument();
    });

    it("effectue un achat et diminue le stock", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message:
                            "Achat effectué avec succès.",
                    }),
                    {
                        status: 201,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        expect(mockFetch).toHaveBeenLastCalledWith(
            expect.stringContaining("/orders"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    product_id: 1,
                    quantity: 1,
                }),
            })
        );

        expect(
            await screen.findByText(
                /Achat effectué avec succès/
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText("9")
        ).toBeInTheDocument();
    });

    it("refuse une quantité supérieure au stock", async () => {
        const lowStockProduct = {
            ...product,
            stock: 2,
        };

        mockFetch
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify([
                        lowStockProduct,
                    ]),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            )
            .mockResolvedValueOnce(
                notificationsResponse()
            );

        window.prompt = vi.fn(() => "5");

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        expect(
            await screen.findByText(
                "Stock insuffisant. Il reste seulement 2 produit(s)."
            )
        ).toBeInTheDocument();

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("redirige vers l'accueil si aucun token n'est présent au chargement", async () => {
        window.localStorage.getItem = vi.fn(
            () => null
        );

        render(<ProductsPage />);

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith("/");
        });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("redirige vers l'accueil lorsque les API retournent 401", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message: "Unauthenticated.",
                    }),
                    {
                        status: 401,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message: "Unauthenticated.",
                    }),
                    {
                        status: 401,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        render(<ProductsPage />);

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith("/");
        });
    });

    it("affiche une erreur lorsque la récupération des produits échoue", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message: "Erreur serveur.",
                    }),
                    {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            )
            .mockResolvedValueOnce(
                notificationsResponse()
            );

        render(<ProductsPage />);

        expect(
            await screen.findByText("Erreur serveur.")
        ).toBeInTheDocument();
    });

    it("annule la suppression si l'utilisateur refuse", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse());

        window.confirm = vi.fn(() => false);

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Supprimer",
            })
        );

        expect(mockFetch).toHaveBeenCalledTimes(2);

        expect(
            screen.getByText("Ordinateur HP")
        ).toBeInTheDocument();

        expect(window.confirm).toHaveBeenCalledWith(
            "Voulez-vous vraiment supprimer ce produit ?"
        );
    });

    it("affiche une erreur de validation lors d'un achat", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        errors: {
                            quantity: [
                                "La quantité demandée est invalide.",
                            ],
                        },
                    }),
                    {
                        status: 422,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        window.prompt = vi.fn(() => "5");

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        expect(
            await screen.findByText(
                "La quantité demandée est invalide."
            )
        ).toBeInTheDocument();
    });

    it("affiche l'erreur retournée par Laravel lors d'un achat", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message:
                            "Impossible d'effectuer l'achat.",
                    }),
                    {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        window.prompt = vi.fn(() => "1");

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        expect(
            await screen.findByText(
                "Impossible d'effectuer l'achat."
            )
        ).toBeInTheDocument();
    });

    it("gère une erreur réseau lors d'un achat", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockRejectedValueOnce(
                new Error("Erreur réseau.")
            );

        window.prompt = vi.fn(() => "1");

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        expect(
            await screen.findByText("Erreur réseau.")
        ).toBeInTheDocument();
    });

    it("gère un achat avec une quantité supérieure à 1", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message:
                            "Achat effectué avec succès.",
                    }),
                    {
                        status: 201,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        window.prompt = vi.fn(() => "3");

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        expect(
            await screen.findByText(
                /Vous avez acheté 3 produits/
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText("7")
        ).toBeInTheDocument();
    });

    it("annule l'achat lorsque l'utilisateur annule le prompt", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse());

        window.prompt = vi.fn(() => null);

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        expect(window.prompt).toHaveBeenCalled();

        expect(mockFetch).toHaveBeenCalledTimes(2);

        expect(
            screen.queryByText(
                /Achat effectué avec succès/
            )
        ).not.toBeInTheDocument();
    });

    it("refuse une quantité invalide lors d'un achat", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse());

        window.prompt = vi.fn(() => "abc");

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        expect(
            await screen.findByText(
                "La quantité doit être un nombre entier supérieur à 0."
            )
        ).toBeInTheDocument();

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("refuse l'achat lorsque le produit est en rupture de stock", async () => {
        const outOfStockProduct = {
            ...product,
            stock: 0,
        };

        mockFetch
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify([
                        outOfStockProduct,
                    ]),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            )
            .mockResolvedValueOnce(
                notificationsResponse()
            );

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        const button = screen.getByRole("button", {
            name: "Rupture de stock",
        });

        /*
         * Lorsque le stock vaut 0, le bouton doit être
         * désactivé. Le navigateur empêche alors le clic
         * et handleBuy() n'est pas exécuté.
         */
        expect(button).toBeDisabled();

        expect(mockFetch).toHaveBeenCalledTimes(2);

        /*
         * Aucun achat ne doit avoir été effectué.
         */
        expect(
            screen.queryByText(
                /Achat effectué avec succès/
            )
        ).not.toBeInTheDocument();

        /*
         * Le message de protection de handleBuy() n'est
         * pas attendu ici puisque le bouton est disabled.
         */
        expect(
            screen.queryByText(
                "Ce produit est en rupture de stock."
            )
        ).not.toBeInTheDocument();
    });

    it("gère l'absence de token au moment de l'achat", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse());

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        window.localStorage.getItem = vi.fn(
            (key: string) => {
                if (key === "token") {
                    return null;
                }

                return null;
            }
        );

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        expect(pushMock).toHaveBeenCalledWith("/");

        expect(
            window.localStorage.removeItem
        ).toHaveBeenCalledWith("token");

        expect(
            window.localStorage.removeItem
        ).toHaveBeenCalledWith("user");

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("redirige vers l'accueil si l'achat retourne 401", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message: "Unauthenticated.",
                    }),
                    {
                        status: 401,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        window.prompt = vi.fn(() => "1");

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Acheter",
            })
        );

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith("/");
        });

        expect(
            window.localStorage.removeItem
        ).toHaveBeenCalledWith("token");

        expect(
            window.localStorage.removeItem
        ).toHaveBeenCalledWith("user");
    });

    it("redirige vers l'accueil si la création retourne 401", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message: "Unauthenticated.",
                    }),
                    {
                        status: 401,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        const user = userEvent.setup();

        render(<ProductsPage />);

        await user.type(
            screen.getByLabelText("Nom du produit"),
            "Test"
        );

        await user.type(
            screen.getByLabelText("Prix"),
            "1000"
        );

        await user.type(
            screen.getByLabelText("Stock"),
            "5"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Ajouter le produit",
            })
        );

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith("/");
        });
    });

    it("redirige vers l'accueil si la suppression retourne 401", async () => {
        mockFetch
            .mockResolvedValueOnce(productsResponse())
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message: "Unauthenticated.",
                    }),
                    {
                        status: 401,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        const user = userEvent.setup();

        render(<ProductsPage />);

        await screen.findByText("Ordinateur HP");

        await user.click(
            screen.getByRole("button", {
                name: "Supprimer",
            })
        );

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith("/");
        });
    });

    it("affiche une erreur si Laravel ne retourne pas de produit lors de la création", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(notificationsResponse())
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        message: "Produit créé.",
                    }),
                    {
                        status: 201,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        const user = userEvent.setup();

        render(<ProductsPage />);

        await user.type(
            screen.getByLabelText("Nom du produit"),
            "Test"
        );

        await user.type(
            screen.getByLabelText("Prix"),
            "1000"
        );

        await user.type(
            screen.getByLabelText("Stock"),
            "5"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Ajouter le produit",
            })
        );

        expect(
            await screen.findByText(
                "Laravel n'a pas retourné le produit."
            )
        ).toBeInTheDocument();
    });

    it("refuse un nom de produit vide", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(notificationsResponse());

        const user = userEvent.setup();

        render(<ProductsPage />);

        await user.type(
            screen.getByLabelText("Nom du produit"),
            "   "
        );

        await user.type(
            screen.getByLabelText("Prix"),
            "1000"
        );

        await user.type(
            screen.getByLabelText("Stock"),
            "5"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Ajouter le produit",
            })
        );

        expect(
            await screen.findByText(
                "Le nom du produit est obligatoire."
            )
        ).toBeInTheDocument();

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("refuse un prix négatif", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(notificationsResponse());

        const user = userEvent.setup();

        render(<ProductsPage />);

        await user.type(
            screen.getByLabelText("Nom du produit"),
            "Produit test"
        );

        fireEvent.change(
            screen.getByLabelText("Prix"),
            {
                target: {
                    value: "-10",
                },
            }
        );

        await user.type(
            screen.getByLabelText("Stock"),
            "5"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Ajouter le produit",
            })
        );

        expect(
            await screen.findByText(
                "Le prix doit être un nombre supérieur ou égal à 0."
            )
        ).toBeInTheDocument();

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("refuse un stock négatif", async () => {
        mockFetch
            .mockResolvedValueOnce(
                new Response(JSON.stringify([]), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
            .mockResolvedValueOnce(notificationsResponse());

        const user = userEvent.setup();

        render(<ProductsPage />);

        await user.type(
            screen.getByLabelText("Nom du produit"),
            "Produit test"
        );

        await user.type(
            screen.getByLabelText("Prix"),
            "1000"
        );

        fireEvent.change(
            screen.getByLabelText("Stock"),
            {
                target: {
                    value: "-5",
                },
            }
        );

        await user.click(
            screen.getByRole("button", {
                name: "Ajouter le produit",
            })
        );

        expect(
            await screen.findByText(
                "Le stock doit être un nombre entier supérieur ou égal à 0."
            )
        ).toBeInTheDocument();

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});