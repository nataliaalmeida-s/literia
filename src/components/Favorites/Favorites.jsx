import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  Check,
  Clipboard,
  Eye,
  Heart,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  apiRequest,
} from "../../services/api";

import "../Library/Library.css";
import "./Favorites.css";

import BookCover from "../BookCover/BookCover";

import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Data não informada";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

function getBookSourceLabel(
  metadataSource,
) {
  if (
    metadataSource ===
    "google-books"
  ) {
    return "Google Livros";
  }

  if (
    metadataSource ===
    "open-library"
  ) {
    return "Open Library";
  }

  return "Dados informados";
}

function getPublicationLabel(item) {
  if (item?.firstPublicationYear) {
    return `Primeiro ano catalogado: ${item.firstPublicationYear}`;
  }

  if (item?.editionPublishedDate) {
    return `Edição consultada: ${item.editionPublishedDate}`;
  }

  return "";
}

function hasBookMetadata(item) {
  return Boolean(
    item?.workTitle ||
    item?.author ||
    item?.coverUrl ||
    item?.firstPublicationYear ||
    item?.editionPublishedDate ||
    item?.isbn ||
    item?.metadataSource,
  );
}

export default function Favorites() {
  const [
    favoriteItems,
    setFavoriteItems,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedSummary,
    setSelectedSummary,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    removingFavoriteId,
    setRemovingFavoriteId,
  ] = useState(null);

  const [
    deletingSummaryId,
    setDeletingSummaryId,
  ] = useState(null);

  const [
    summaryPendingDeletion,
    setSummaryPendingDeletion,
  ] = useState(null);

  const [
    actionError,
    setActionError,
  ] = useState("");

  async function loadFavorites() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await apiRequest(
        "/api/summaries/favorites",
      );

      setFavoriteItems(
        Array.isArray(data?.summaries)
          ? data.summaries
          : [],
      );
    } catch (requestError) {
      setLoadError(
        requestError.message ||
        "Não foi possível carregar os favoritos.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  const filteredFavorites = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("pt-BR");

    if (!normalizedSearch) {
      return favoriteItems;
    }

    return favoriteItems.filter((item) => {
      const searchableContent = [
        item.title,
        item.workTitle,
        item.author,
        item.isbn,
        item.editionPublishedDate,
        item.firstPublicationYear,
        item.summary,
        item.originalText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchableContent.includes(
        normalizedSearch,
      );
    });
  }, [favoriteItems, searchTerm]);

  function openSummary(item) {
    setCopied(false);
    setSelectedSummary(item);
  }

  function closeSummary() {
    setCopied(false);
    setSelectedSummary(null);
  }

  async function removeFromFavorites(
    summaryId,
  ) {
    if (!summaryId) {
      return;
    }

    setActionError("");

    setRemovingFavoriteId(summaryId);

    try {
      await apiRequest(
        `/api/summaries/${summaryId}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            favorite: false,
          }),
        },
      );

      setFavoriteItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              item.id !== summaryId,
          ),
      );

      if (
        selectedSummary?.id === summaryId
      ) {
        closeSummary();
      }
    } catch (requestError) {
      setActionError(
        requestError.message ||
        "Não foi possível remover o resumo dos favoritos.",
      );
    } finally {
      setRemovingFavoriteId(null);
    }
  }

  function requestDeleteSummary(item) {
    if (!item?.id) {
      return;
    }

    setActionError("");
    setSummaryPendingDeletion(item);
  }

  function closeDeleteSummaryDialog() {
    if (deletingSummaryId) {
      return;
    }

    setSummaryPendingDeletion(null);
  }

  async function confirmDeleteSummary() {
    const summaryId =
      summaryPendingDeletion?.id;

    if (!summaryId) {
      return;
    }

    setDeletingSummaryId(summaryId);
    setActionError("");

    try {
      await apiRequest(
        `/api/summaries/${summaryId}`,
        {
          method: "DELETE",
        },
      );

      setFavoriteItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              item.id !== summaryId,
          ),
      );

      if (
        selectedSummary?.id === summaryId
      ) {
        closeSummary();
      }

      setSummaryPendingDeletion(null);
    } catch (requestError) {
      setActionError(
        requestError.message ||
        "Não foi possível excluir o resumo.",
      );
    } finally {
      setDeletingSummaryId(null);
    }
  }

  async function copySummary(summary) {
    if (!summary) {
      return;
    }

    setActionError("");

    try {
      await navigator.clipboard.writeText(
        summary,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setActionError(
        "Não foi possível copiar o resumo.",
      );
    }
  }

  return (
    <div className="library-page favorites-page">
      <section className="library-section">
        <header className="library-header favorites-header">
          <div>
            <span className="library-eyebrow">
              Sua seleção
            </span>

            <h1>Favoritos</h1>

            <p>
              Reencontre os resumos que você marcou
              para consultar depois.
            </p>
          </div>

          <span
            className="library-header-icon favorites-header-icon"
            aria-hidden="true"
          >
            <Heart size={35} />
          </span>
        </header>

        <div className="library-toolbar">
          <label className="library-search">
            <Search size={18} />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Pesquisar nos favoritos..."
              aria-label="Pesquisar nos favoritos"
            />
          </label>

          <div className="library-counter">
            <strong>
              {filteredFavorites.length}
            </strong>

            <span>
              {filteredFavorites.length === 1
                ? "favorito"
                : "favoritos"}
            </span>
          </div>
        </div>

        {actionError && (
          <div
            className="library-action-message"
            role="alert"
          >
            <span>{actionError}</span>

            <button
              type="button"
              onClick={() =>
                setActionError("")
              }
              aria-label="Fechar mensagem"
              title="Fechar"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Heart size={31} />
            </span>

            <h2>
              Carregando favoritos...
            </h2>

            <p>
              Buscando seus resumos favoritos.
            </p>
          </div>
        ) : loadError ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Heart size={31} />
            </span>

            <h2>
              Não foi possível carregar
            </h2>

            <p>{loadError}</p>

            <button
              type="button"
              className="open-summary-button"
              onClick={loadFavorites}
            >
              Tentar novamente
            </button>
          </div>
        ) : favoriteItems.length === 0 ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Heart size={31} />
            </span>

            <h2>Nenhum favorito ainda</h2>

            <p>
              Na sua biblioteca, clique no coração
              de um resumo para adicioná-lo aqui.
            </p>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Search size={31} />
            </span>

            <h2>
              Nenhum favorito encontrado
            </h2>

            <p>
              Tente pesquisar usando outras palavras.
            </p>
          </div>
        ) : (
          <div className="library-grid">
            {filteredFavorites.map(
              (item) => (
                <article
                  key={item.id}
                  className="library-card favorites-card"
                >
                  <span
                    className="library-card-has-text"
                    aria-hidden="true"
                  />

                  <div className="library-card-top">
                    <BookCover
                      className="library-book-cover"
                      src={item.coverUrl}
                      alt={`Capa de ${item.workTitle ||
                        "obra literária"
                        }`}
                      iconSize={24}
                    />

                    <button
                      type="button"
                      className="favorite-button is-favorite"
                      onClick={() =>
                        removeFromFavorites(
                          item.id,
                        )
                      }
                      disabled={
                        removingFavoriteId ===
                        item.id
                      }
                      title="Remover dos favoritos"
                      aria-label="Remover dos favoritos"
                    >
                      <Heart
                        size={20}
                        fill="currentColor"
                      />
                    </button>
                  </div>

                  <div className="library-card-content">
                    <span className="library-card-type">
                      Resumo favorito
                    </span>

                    <h2>
                      {item.title?.trim() ||
                        item.workTitle?.trim() ||
                        "Resumo literário"}
                    </h2>

                    {item.title?.trim() &&
                      item.workTitle?.trim() && (
                        <span className="library-card-work-title">
                          <BookOpen size={14} />

                          {item.workTitle}
                        </span>
                      )}

                    {item.author?.trim() && (
                      <span className="library-card-author">
                        {item.author}
                      </span>
                    )}

                    {getPublicationLabel(item) && (
                      <span className="library-card-publication">
                        {getPublicationLabel(item)}
                      </span>
                    )}

                    <p>
                      {item.summary ||
                        "Resumo sem conteúdo."}
                    </p>
                  </div>

                  <div className="library-card-date">
                    <CalendarDays size={15} />

                    <span>
                      {formatDate(
                        item.createdAt,
                      )}
                    </span>
                  </div>

                  <footer className="library-card-actions">
                    <button
                      type="button"
                      className="open-summary-button"
                      onClick={() =>
                        openSummary(item)
                      }
                    >
                      <Eye size={18} />
                      Abrir
                    </button>

                    <button
                      type="button"
                      className="delete-summary-button"
                      onClick={() =>
                        requestDeleteSummary(item)
                      }
                      disabled={
                        deletingSummaryId ===
                        item.id
                      }
                      title="Excluir resumo"
                      aria-label="Excluir resumo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </footer>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      {selectedSummary && (
        <div
          className="library-modal-backdrop"
          role="presentation"
          onMouseDown={closeSummary}
        >
          <article
            className="library-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="favorite-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="library-modal-scroll">
              <header className="library-modal-header">
                <div>
                  <span>Resumo favorito</span>

                  <h2 id="favorite-modal-title">
                    {selectedSummary.title?.trim() ||
                      selectedSummary.workTitle?.trim() ||
                      "Resumo literário"}
                  </h2>

                  <small>
                    {formatDate(
                      selectedSummary.createdAt,
                    )}
                  </small>
                </div>

                <button
                  type="button"
                  className="close-library-modal"
                  onClick={closeSummary}
                  aria-label="Fechar"
                >
                  <X size={21} />
                </button>
              </header>

              {hasBookMetadata(selectedSummary) && (
                <section className="library-modal-book">
                  <BookCover
                    className="library-modal-book-cover"
                    src={selectedSummary.coverUrl}
                    alt={`Capa de ${selectedSummary.workTitle ||
                      "obra literária"
                      }`}
                    iconSize={33}
                    loading="eager"
                  />

                  <div className="library-modal-book-content">
                    <span className="library-modal-book-eyebrow">
                      Sobre a obra
                    </span>

                    <h3>
                      {selectedSummary.workTitle ||
                        "Título não informado"}
                    </h3>

                    {selectedSummary.author && (
                      <p className="library-modal-book-author">
                        {selectedSummary.author}
                      </p>
                    )}

                    <div className="library-modal-book-metadata">
                      {selectedSummary.firstPublicationYear && (
                        <span>
                          Primeiro ano catalogado:{" "}
                          {
                            selectedSummary.firstPublicationYear
                          }
                        </span>
                      )}

                      {selectedSummary.editionPublishedDate && (
                        <span>
                          Edição consultada:{" "}
                          {
                            selectedSummary.editionPublishedDate
                          }
                        </span>
                      )}

                      {selectedSummary.isbn && (
                        <span>
                          ISBN: {selectedSummary.isbn}
                        </span>
                      )}

                      {selectedSummary.metadataSource && (
                        <span>
                          Fonte:{" "}
                          {getBookSourceLabel(
                            selectedSummary.metadataSource,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <div className="library-modal-summary">
                <span>Resumo</span>

                <p>
                  {selectedSummary.summary}
                </p>
              </div>

              {selectedSummary.originalText && (
                <details className="library-original-text">
                  <summary>
                    Ver trecho original
                  </summary>

                  <p>
                    {selectedSummary.originalText}
                  </p>
                </details>
              )}

              <footer className="library-modal-actions">
                <button
                  type="button"
                  className="modal-favorite-button is-favorite"
                  onClick={() =>
                    removeFromFavorites(
                      selectedSummary.id,
                    )
                  }
                  disabled={
                    removingFavoriteId ===
                    selectedSummary.id
                  }
                >
                  <Heart
                    size={18}
                    fill="currentColor"
                  />

                  Remover dos favoritos
                </button>

                <button
                  type="button"
                  className="modal-copy-button"
                  onClick={() =>
                    copySummary(
                      selectedSummary.summary,
                    )
                  }
                >
                  {copied ? (
                    <Check size={18} />
                  ) : (
                    <Clipboard size={18} />
                  )}

                  {copied
                    ? "Copiado"
                    : "Copiar resumo"}
                </button>
              </footer>
            </div>
          </article>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(
          summaryPendingDeletion,
        )}
        eyebrow="Favoritos"
        title="Excluir definitivamente?"
        message={
          <>
            “
            {summaryPendingDeletion?.title ||
              summaryPendingDeletion?.workTitle ||
              "Resumo literário"}
            ” será excluído definitivamente do
            Histórico, da Biblioteca e dos Favoritos.
            Essa ação não poderá ser desfeita.
          </>
        }
        confirmLabel="Excluir definitivamente"
        cancelLabel="Cancelar"
        isProcessing={Boolean(
          deletingSummaryId,
        )}
        onConfirm={confirmDeleteSummary}
        onClose={closeDeleteSummaryDialog}
      />
    </div>
  );
}