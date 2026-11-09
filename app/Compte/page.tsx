"use client";
import { API_URL } from "@/lib/config";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cropper, { Area } from "react-easy-crop";
import AnimatedContainer from "@/app/components/AnimatedContainer";
import { useAuth } from "@/app/context/AuthContext";


export default function ComptePage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | UTILISATEUR GLOBAL
  |--------------------------------------------------------------------------
  |
  | L'utilisateur vient maintenant de AuthContext.
  | Toutes les pages qui utilisent useAuth() partageront automatiquement
  | les mêmes informations utilisateur.
  |
  */

  const { user, setUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [deletingPhoto, setDeletingPhoto] =
    useState(false);

  const [photoMessage, setPhotoMessage] =
    useState<string | null>(null);

  const [photoError, setPhotoError] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | MODAL PHOTO
  |--------------------------------------------------------------------------
  */

  const [showPhotoModal, setShowPhotoModal] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | ÉTATS DU RECADRAGE
  |--------------------------------------------------------------------------
  */

  const [showCropModal, setShowCropModal] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [selectedFileName, setSelectedFileName] =
    useState("profile-photo.jpg");

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Area | null>(null);

  const [processingCrop, setProcessingCrop] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /*
  |--------------------------------------------------------------------------
  | VÉRIFICATION DE SESSION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
      return;
    }

    setLoading(false);
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | PHOTO DE PROFIL
  |--------------------------------------------------------------------------
  */

  const hasPhoto = Boolean(
    user?.profile_photo ||
      user?.profile_photo_url
  );

  const handleAvatarClick = () => {
    if (
      uploadingPhoto ||
      deletingPhoto ||
      processingCrop
    ) {
      return;
    }

    if (hasPhoto) {
      setShowPhotoModal(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoClick = () => {
    if (
      uploadingPhoto ||
      deletingPhoto ||
      processingCrop
    ) {
      return;
    }

    fileInputRef.current?.click();
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE RECADRÉE
  |--------------------------------------------------------------------------
  */

  const createCroppedImage = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = new Image();

    image.src = imageSrc;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();

      image.onerror = () =>
        reject(
          new Error(
            "Impossible de charger l'image."
          )
        );
    });

    const canvas =
      document.createElement("canvas");

    const outputSize = 800;

    canvas.width = outputSize;
    canvas.height = outputSize;

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Impossible de préparer l'image."
      );
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    const blob = await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.88
        );
      }
    );

    if (!blob) {
      throw new Error(
        "Impossible de créer l'image recadrée."
      );
    }

    return blob;
  };

  /*
  |--------------------------------------------------------------------------
  | IMPORT DE LA PHOTO
  |--------------------------------------------------------------------------
  */

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoMessage(null);
    setPhotoError(null);

    /*
    |--------------------------------------------------------------------------
    | VALIDATION DU FORMAT
    |--------------------------------------------------------------------------
    */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setPhotoError(
        "Format non accepté. Utilisez JPG, PNG ou WEBP."
      );

      event.target.value = "";

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | TAILLE DE L'IMAGE ORIGINALE
    |--------------------------------------------------------------------------
    */

    if (file.size > 10 * 1024 * 1024) {
      setPhotoError(
        "La photo originale ne doit pas dépasser 10 Mo."
      );

      event.target.value = "";

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SESSION
    |--------------------------------------------------------------------------
    */

    const token =
      localStorage.getItem("token");

    if (!token) {
      setPhotoError(
        "Votre session a expiré. Veuillez vous reconnecter."
      );

      event.target.value = "";

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | OUVERTURE DU RECADRAGE
    |--------------------------------------------------------------------------
    */

    const imageUrl =
      URL.createObjectURL(file);

    setSelectedImage(imageUrl);

    setSelectedFileName(file.name);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(null);

    setShowCropModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | ZONE RECADRÉE
  |--------------------------------------------------------------------------
  */

  const handleCropComplete = (
    _croppedArea: Area,
    croppedPixels: Area
  ) => {
    setCroppedAreaPixels(
      croppedPixels
    );
  };

  /*
  |--------------------------------------------------------------------------
  | ANNULER LE RECADRAGE
  |--------------------------------------------------------------------------
  */

  const handleCancelCrop = () => {
    if (processingCrop) {
      return;
    }

    if (selectedImage) {
      URL.revokeObjectURL(
        selectedImage
      );
    }

    setSelectedImage(null);

    setSelectedFileName(
      "profile-photo.jpg"
    );

    setCroppedAreaPixels(null);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setShowCropModal(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDER LE RECADRAGE + UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleCropConfirm = async () => {
    if (
      !selectedImage ||
      !croppedAreaPixels
    ) {
      setPhotoError(
        "Veuillez sélectionner une zone de recadrage."
      );

      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setPhotoError(
        "Votre session a expiré. Veuillez vous reconnecter."
      );

      return;
    }

    if (!user) {
      setPhotoError(
        "Utilisateur introuvable."
      );

      return;
    }

    setProcessingCrop(true);
    setUploadingPhoto(true);

    setPhotoMessage(null);
    setPhotoError(null);

    /*
    |--------------------------------------------------------------------------
    | SAUVEGARDE DE L'ANCIEN UTILISATEUR
    |--------------------------------------------------------------------------
    |
    | On garde une copie pour restaurer l'affichage si l'upload échoue.
    |
    */

    const oldUser = {
      ...user,
    };

    let previewUrl: string | null = null;

    try {
      /*
      |--------------------------------------------------------------------------
      | CRÉATION DE L'IMAGE RECADRÉE
      |--------------------------------------------------------------------------
      */

      const croppedBlob =
        await createCroppedImage(
          selectedImage,
          croppedAreaPixels
        );

      /*
      |--------------------------------------------------------------------------
      | VÉRIFICATION DE LA TAILLE FINALE
      |--------------------------------------------------------------------------
      */

      if (
        croppedBlob.size >
        2 * 1024 * 1024
      ) {
        throw new Error(
          "La photo recadrée dépasse 2 Mo. Veuillez choisir une autre zone ou réduire le zoom."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | APERÇU IMMÉDIAT
      |--------------------------------------------------------------------------
      */

      previewUrl =
        URL.createObjectURL(
          croppedBlob
        );

      setUser({
        ...user,
        profile_photo_url:
          previewUrl,
      });

      /*
      |--------------------------------------------------------------------------
      | FERMER LE RECADRAGE
      |--------------------------------------------------------------------------
      */

      setShowCropModal(false);

      /*
      |--------------------------------------------------------------------------
      | UPLOAD LARAVEL
      |--------------------------------------------------------------------------
      */

      const formData =
        new FormData();

      formData.append(
        "profile_photo",
        croppedBlob,
        "profile-photo.jpg"
      );

      const response =
        await fetch(
          `${API_URL}/profile/photo`,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",

              Authorization: `Bearer ${token}`,
            },

            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de mettre à jour la photo."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | UTILISATEUR MIS À JOUR
      |--------------------------------------------------------------------------
      */

      const updatedUser = {
        ...user,
        ...(data.user || {}),

        profile_photo:
          data.profile_photo ||
          data.user?.profile_photo ||
          null,

        profile_photo_url:
          data.profile_photo_url ||
          data.user?.profile_photo_url ||
          null,
      };

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT :
      | MISE À JOUR DU CONTEXTE GLOBAL
      |--------------------------------------------------------------------------
      */

      setUser(updatedUser);

      setPhotoMessage(
        "Photo de profil mise à jour avec succès."
      );

      /*
      |--------------------------------------------------------------------------
      | LIBÉRATION DE L'APERÇU TEMPORAIRE
      |--------------------------------------------------------------------------
      */

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );

        previewUrl = null;
      }
    } catch (error) {
      console.error(
        "Erreur recadrage/upload photo :",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | RESTAURATION
      |--------------------------------------------------------------------------
      */

      setUser(oldUser);

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );

        previewUrl = null;
      }

      setPhotoError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'import de la photo."
      );
    } finally {
      if (selectedImage) {
        URL.revokeObjectURL(
          selectedImage
        );
      }

      setSelectedImage(null);

      setCroppedAreaPixels(null);

      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(1);

      setProcessingCrop(false);
      setUploadingPhoto(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SUPPRIMER LA PHOTO
  |--------------------------------------------------------------------------
  */

  const handleDeletePhoto = async () => {
    if (
      !user?.profile_photo &&
      !user?.profile_photo_url
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer votre photo de profil ?"
      );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setPhotoError(
        "Votre session a expiré. Veuillez vous reconnecter."
      );

      return;
    }

    setPhotoMessage(null);
    setPhotoError(null);

    setShowPhotoModal(false);

    setDeletingPhoto(true);

    try {
      const response =
        await fetch(
          `${API_URL}/profile/photo`,
          {
            method: "DELETE",

            headers: {
              Accept:
                "application/json",

              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de supprimer la photo."
        );
      }

      const updatedUser = {
        ...user,
        ...(data.user || {}),

        profile_photo: null,
        profile_photo_url: null,
      };

      /*
      |--------------------------------------------------------------------------
      | MISE À JOUR DU CONTEXTE GLOBAL
      |--------------------------------------------------------------------------
      */

      setUser(updatedUser);

      setPhotoMessage(
        "Photo de profil supprimée avec succès."
      );
    } catch (error) {
      console.error(
        "Erreur suppression photo :",
        error
      );

      setPhotoError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la suppression de la photo."
      );
    } finally {
      setDeletingPhoto(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DÉCONNEXION
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    const token =
      localStorage.getItem("token");

    setLoggingOut(true);

    try {
      if (token) {
        await fetch(
          `${API_URL}/logout`,
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(
        "Erreur déconnexion :",
        error
      );
    } finally {
      /*
      |--------------------------------------------------------------------------
      | DÉCONNEXION GLOBALE
      |--------------------------------------------------------------------------
      */

      logout();

      router.push("/");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CHARGEMENT
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] text-white">
        <AnimatedContainer>
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

            <p className="text-sm text-gray-500">
              Chargement de votre compte...
            </p>
          </div>
        </AnimatedContainer>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE COMPTE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#05070d] text-white">

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="fixed left-3 right-3 top-3 z-50 mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#090c13]/90 px-5 py-3 shadow-2xl backdrop-blur-xl">

        <div className="flex items-center justify-between gap-5">

          <AnimatedContainer delay={0}>
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-black shadow-lg shadow-blue-600/20 transition duration-300 hover:scale-110">
                X
              </div>

              <span className="text-xl font-black">
                Shop
                <span className="text-blue-500">
                  X
                </span>
              </span>
            </Link>
          </AnimatedContainer>

          <div className="hidden items-center gap-7 md:flex">

            <AnimatedContainer delay={0.1}>
              <Link
                href="/"
                className="text-sm text-gray-400 transition hover:text-white"
              >
                Accueil
              </Link>
            </AnimatedContainer>

            <AnimatedContainer delay={0.15}>
              <Link
                href="/Produits"
                className="text-sm text-gray-400 transition hover:text-white"
              >
                Catalogue
              </Link>
            </AnimatedContainer>

            <AnimatedContainer delay={0.2}>
              <Link
                href="/Panier"
                className="text-sm text-gray-400 transition hover:text-white"
              >
                Panier
              </Link>
            </AnimatedContainer>

            <AnimatedContainer delay={0.25}>
              <Link
                href="/Favoris"
                className="text-sm text-gray-400 transition hover:text-white"
              >
                Favoris
              </Link>
            </AnimatedContainer>

            <AnimatedContainer delay={0.3}>
              <Link
                href="/Compte"
                className="text-sm font-semibold text-blue-400"
              >
                Mon compte
              </Link>
            </AnimatedContainer>

          </div>

          <AnimatedContainer delay={0.35}>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-50"
            >
              {loggingOut
                ? "Déconnexion..."
                : "Déconnexion"}
            </button>
          </AnimatedContainer>

        </div>
      </nav>

      {/* =================================================
          CONTENU
      ================================================= */}

      <section className="relative px-5 pb-20 pt-36">

        <div className="pointer-events-none absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-5xl">

          <AnimatedContainer delay={0.15}>
            <div className="mb-10">

              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                Espace personnel
              </p>

              <h1 className="text-4xl font-black sm:text-5xl">
                Mon compte
              </h1>

              <p className="mt-3 text-gray-500">
                Gérez vos informations et
                retrouvez votre espace ShopX.
              </p>

            </div>
          </AnimatedContainer>

          {/* =================================================
              PROFIL
          ================================================= */}

          <div className="grid gap-6 lg:grid-cols-3">

            <AnimatedContainer delay={0.25}>
              <div className="rounded-3xl border border-white/10 bg-[#0b0f18] p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30">

                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                  {/* AVATAR */}

                  <div className="relative shrink-0">

                    <button
                      type="button"
                      onClick={
                        handleAvatarClick
                      }
                      disabled={
                        uploadingPhoto ||
                        deletingPhoto ||
                        processingCrop
                      }
                      className="group relative flex h-24 w-24 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black shadow-xl shadow-blue-600/20 transition duration-500 hover:scale-105 hover:rotate-3 disabled:cursor-wait disabled:opacity-70"
                      aria-label={
                        hasPhoto
                          ? "Voir la photo de profil"
                          : "Ajouter une photo de profil"
                      }
                    >

                      {user.profile_photo_url ? (
                        <img
                          src={
                            user.profile_photo_url
                          }
                          alt={`Photo de ${user.name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          {user.name
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}

                      <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold opacity-0 transition duration-300 group-hover:opacity-100">
                        {uploadingPhoto
                          ? "..."
                          : deletingPhoto
                          ? "..."
                          : hasPhoto
                          ? "🔍 Voir"
                          : "📷 Ajouter"}
                      </span>

                    </button>

                    {/* CAMÉRA */}

                    <button
                      type="button"
                      onClick={
                        handlePhotoClick
                      }
                      disabled={
                        uploadingPhoto ||
                        deletingPhoto ||
                        processingCrop
                      }
                      aria-label="Changer la photo de profil"
                      className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#0b0f18] bg-blue-600 text-sm shadow-lg transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      📷
                    </button>

                    {/* INPUT */}

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handlePhotoChange
                      }
                      className="hidden"
                    />

                  </div>

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="text-2xl font-black">
                        {user.name}
                      </h2>

                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                        En ligne
                      </span>

                    </div>

                    <p className="mt-2 break-all text-gray-500">
                      {user.email}
                    </p>

                    <span className="mt-4 inline-flex rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold capitalize text-blue-400">
                      {user.role ||
                        "Client"}
                    </span>

                  </div>

                </div>

                {/* IMPORT */}

                {uploadingPhoto && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">

                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />

                    <p className="text-sm text-blue-400">
                      {processingCrop
                        ? "Préparation de votre photo..."
                        : "Import de votre photo..."}
                    </p>

                  </div>
                )}

                {deletingPhoto && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">

                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500/20 border-t-red-500" />

                    <p className="text-sm text-red-400">
                      Suppression de votre photo...
                    </p>

                  </div>
                )}

                {photoMessage &&
                  !uploadingPhoto &&
                  !deletingPhoto && (
                    <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">

                      <p className="text-sm text-emerald-400">
                        ✓{" "}
                        {photoMessage}
                      </p>

                    </div>
                  )}

                {photoError &&
                  !uploadingPhoto &&
                  !deletingPhoto && (
                    <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">

                      <p className="text-sm text-red-400">
                        {photoError}
                      </p>

                    </div>
                  )}

                {/* BOUTONS PHOTO */}

                {hasPhoto ? (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <button
                      type="button"
                      onClick={
                        handlePhotoClick
                      }
                      disabled={
                        uploadingPhoto ||
                        deletingPhoto ||
                        processingCrop
                      }
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingPhoto
                        ? "Import..."
                        : "📷 Changer"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleDeletePhoto
                      }
                      disabled={
                        uploadingPhoto ||
                        deletingPhoto ||
                        processingCrop
                      }
                      className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingPhoto
                        ? "Suppression..."
                        : "🗑️ Supprimer"}
                    </button>

                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={
                      handlePhotoClick
                    }
                    disabled={
                      uploadingPhoto ||
                      deletingPhoto ||
                      processingCrop
                    }
                    className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingPhoto
                      ? "Import en cours..."
                      : "📷 Ajouter une photo"}
                  </button>
                )}

                <p className="mt-3 text-center text-xs text-gray-600">
                  JPG, PNG ou WEBP •
                  10 Mo maximum avant
                  recadrage
                </p>

              </div>
            </AnimatedContainer>

            {/* ID */}

            <AnimatedContainer delay={0.35}>
              <div className="rounded-3xl border border-white/10 bg-[#0b0f18] p-7 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/30">

                <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                  Identifiant
                </p>

                <p className="mt-4 text-3xl font-black">
                  #{user.id}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Identifiant de votre
                  compte ShopX.
                </p>

              </div>
            </AnimatedContainer>

          </div>

          {/* =================================================
              INFORMATIONS
          ================================================= */}

          <AnimatedContainer delay={0.45}>
            <div className="mt-6 rounded-3xl border border-white/10 bg-[#0b0f18] p-7">

              <div className="mb-7">

                <h2 className="text-xl font-bold">
                  Informations personnelles
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Informations associées à
                  votre compte.
                </p>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]">

                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    Nom
                  </p>

                  <p className="mt-2 font-semibold">
                    {user.name}
                  </p>

                </div>

                <div className="rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]">

                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    Adresse email
                  </p>

                  <p className="mt-2 break-all font-semibold">
                    {user.email}
                  </p>

                </div>

                <div className="rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]">

                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    Type de compte
                  </p>

                  <p className="mt-2 font-semibold capitalize">
                    {user.role ||
                      "Client"}
                  </p>

                </div>

                <div className="rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]">

                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    Statut
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    <span className="font-semibold text-emerald-400">
                      Connecté
                    </span>

                  </div>

                </div>

              </div>

            </div>
          </AnimatedContainer>

          {/* =================================================
              RACCOURCIS
          ================================================= */}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <AnimatedContainer delay={0.55}>
              <Link
                href="/Produits"
                className="group block rounded-2xl border border-white/10 bg-[#0b0f18] p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-500/30"
              >
                <p className="text-sm font-semibold">
                  Catalogue
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Découvrir les produits
                </p>

                <span className="mt-5 block text-blue-400 transition group-hover:translate-x-2">
                  →
                </span>
              </Link>
            </AnimatedContainer>

            <AnimatedContainer delay={0.65}>
              <Link
                href="/Panier"
                className="group block rounded-2xl border border-white/10 bg-[#0b0f18] p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-500/30"
              >
                <p className="text-sm font-semibold">
                  Mon panier
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Voir mes articles
                </p>

                <span className="mt-5 block text-blue-400 transition group-hover:translate-x-2">
                  →
                </span>
              </Link>
            </AnimatedContainer>

            <AnimatedContainer delay={0.75}>
              <Link
                href="/Commandes"
                className="group block rounded-2xl border border-white/10 bg-[#0b0f18] p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-500/30"
              >
                <p className="text-sm font-semibold">
                  Mes commandes
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Consulter mes achats
                </p>

                <span className="mt-5 block text-blue-400 transition group-hover:translate-x-2">
                  →
                </span>
              </Link>
            </AnimatedContainer>

          </div>

        </div>
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <AnimatedContainer delay={0.85}>
        <footer className="border-t border-white/5 bg-[#03050a] px-5 py-10">

          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">

            <div className="font-black text-white">
              Shop
              <span className="text-blue-500">
                X
              </span>
            </div>

            <p>
              © 2026 ShopX. Tous droits réservés.
            </p>

          </div>

        </footer>
      </AnimatedContainer>

      {/* =================================================
          MODAL : APERÇU PHOTO
      ================================================= */}

      {showPhotoModal &&
        user.profile_photo_url && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
            onClick={() =>
              setShowPhotoModal(false)
            }
          >

            <div
              className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0f18] p-6"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                type="button"
                onClick={() =>
                  setShowPhotoModal(false)
                }
                aria-label="Fermer l'aperçu"
                className="absolute right-4 top-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>

              <h3 className="mb-5 shrink-0 text-center text-lg font-bold">
                Photo de profil
              </h3>

              <div className="mx-auto aspect-square w-full max-w-[260px] shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-xl">

                <img
                  src={
                    user.profile_photo_url
                  }
                  alt={`Photo de ${user.name}`}
                  className="h-full w-full object-cover"
                />

              </div>

              <div className="mt-6 grid shrink-0 grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoModal(false);

                    fileInputRef.current?.click();
                  }}
                  disabled={
                    uploadingPhoto ||
                    deletingPhoto ||
                    processingCrop
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  📷 Changer
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeletePhoto
                  }
                  disabled={
                    uploadingPhoto ||
                    deletingPhoto ||
                    processingCrop
                  }
                  className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  🗑️ Supprimer
                </button>

              </div>

            </div>

          </div>
        )}

      {/* =================================================
          MODAL : RECADRAGE
      ================================================= */}

      {showCropModal &&
        selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">

            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f18] shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">

                <div className="min-w-0">

                  <h3 className="text-lg font-bold">
                    Recadrer votre photo
                  </h3>

                  <p className="mt-1 max-w-md truncate text-xs text-gray-500">
                    {selectedFileName}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    handleCancelCrop
                  }
                  disabled={
                    processingCrop
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  ✕
                </button>

              </div>

              {/* CORPS SCROLLABLE */}

              <div className="flex-1 overflow-y-auto">

                {/* ZONE DE RECADRAGE */}

                <div className="relative h-[38vh] min-h-[220px] max-h-[420px] w-full bg-black">

                  <Cropper
                    image={
                      selectedImage
                    }
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={true}
                    onCropChange={
                      setCrop
                    }
                    onZoomChange={
                      setZoom
                    }
                    onCropComplete={
                      handleCropComplete
                    }
                    objectFit="contain"
                    restrictPosition={
                      true
                    }
                  />

                </div>

                {/* CONTRÔLES */}

                <div className="px-6 py-5">

                  <div className="mb-5">

                    <div className="mb-2 flex items-center justify-between">

                      <label
                        htmlFor="zoom-photo"
                        className="text-sm font-semibold text-gray-300"
                      >
                        🔍 Zoom
                      </label>

                      <span className="text-xs text-gray-500">
                        {zoom.toFixed(
                          1
                        )}
                        x
                      </span>

                    </div>

                    <input
                      id="zoom-photo"
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(
                        event
                      ) =>
                        setZoom(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className="w-full accent-blue-500"
                    />

                  </div>

                  <div className="mb-5 rounded-xl border border-blue-500/10 bg-blue-500/5 px-4 py-3">

                    <p className="text-center text-xs text-gray-400">
                      Faites glisser l'image
                      pour choisir la partie
                      qui apparaîtra sur votre
                      profil.
                    </p>

                  </div>

                  {/* ACTIONS */}

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={
                        handleCancelCrop
                      }
                      disabled={
                        processingCrop
                      }
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleCropConfirm
                      }
                      disabled={
                        processingCrop ||
                        !croppedAreaPixels
                      }
                      className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingCrop
                        ? "Préparation..."
                        : "✓ Utiliser cette photo"}
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

    </main>
  );
}