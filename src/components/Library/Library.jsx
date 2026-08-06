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

import {
  notifyNotificationsChanged,
} from "../../utils/notificationEvents";

import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";

import BookCover from "../BookCover/BookCover";

import "./Library.css";

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

export default function Library() {
  const [
    summaries,
    setSummaries,
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
    updatingFavoriteId,
    setUpdatingFavoriteId,
  ] = useState(null);

  const [
    removingSummaryId,
    setRemovingSummaryId,
  ] = useState(null);

  const [
    summaryPendingRemoval,
    setSummaryPendingRemoval,
  ] = useState(null);

  async function loadLibrary() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await apiRequest(
        "/api/summaries/library",
      );

      setSummaries(
        Array.isArray(data?.summaries)
          ? data.summaries
          : [],
      );
    } catch (requestError) {
      setLoadError(
        requestError.message ||
        "Não foi possível carregar sua biblioteca.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLibrary();
  }, []);

  const filteredSummaries = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("pt-BR");

    if (!normalizedSearch) {
      return summaries;
    }

    return summaries.filter((item) => {
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
  }, [summaries, searchTerm]);

  function openSummary(item) {
    setCopied(false);
    setSelectedSummary(item);
  }

  function closeSummary() {
    setCopied(false);
    setSelectedSummary(null);
  }

  async function toggleFavorite(item) {
    if (!item?.id) {
      return;
    }

    const willBeFavorite =
      !item.favorite;

    setUpdatingFavoriteId(item.id);

    try {
      const data = await apiRequest(
        `/api/summaries/${item.id}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            favorite: willBeFavorite,
          }),
        },
      );

      const updatedSummary =
        data.summary;

      setSummaries((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedSummary.id
            ? updatedSummary
            : currentItem,
        ),
      );

      setSelectedSummary(
        (currentSelected) => {
          if (
            !currentSelected ||
            currentSelected.id !==
            updatedSummary.id
          ) {
            return currentSelected;
          }

          return updatedSummary;
        },
      );

      if (willBeFavorite) {
        notifyNotificationsChanged();
      }
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível atualizar o favorito.",
      );
    } finally {
      setUpdatingFavoriteId(null);
    }
  }

  function requestRemoveFromLibrary(item) {
    if (!item?.id) {
      return;
    }

    setSummaryPendingRemoval(item);
  }

  function closeRemoveLibraryDialog() {
    if (removingSummaryId) {
      return;
    }

    setSummaryPendingRemoval(null);
  }

  async function confirmRemoveFromLibrary() {
    const summaryId =
      summaryPendingRemoval?.id;

    if (!summaryId) {
      return;
    }

    setRemovingSummaryId(summaryId);

    try {
      await apiRequest(
        `/api/summaries/${summaryId}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            saved: false,
          }),
        },
      );

      setSummaries((currentItems) =>
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

      setSummaryPendingRemoval(null);
    } catch (requestError) {
      window.alert(
        requestError.message ||
        "Não foi possível remover o resumo da biblioteca.",
      );
    } finally {
      setRemovingSummaryId(null);
    }
  }

  async function copySummary(summary) {
    if (!summary) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        summary,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      window.alert(
        "Não foi possível copiar o resumo.",
      );
    }
  }

  return (
    <div className="library-page">
      <section className="library-section">
        <header className="library-header">
          <div>
            <span className="library-eyebrow">
              Sua coleção
            </span>

            <h1>Minha biblioteca</h1>

            <p>
              Consulte os resumos que você escolheu
              salvar.
            </p>
          </div>

          <span
            className="library-header-icon"
            aria-hidden="true"
          >
            <BookOpen size={35} />
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
              placeholder="Pesquisar na biblioteca..."
              aria-label="Pesquisar na biblioteca"
            />
          </label>

          <div className="library-counter">
            <strong>
              {filteredSummaries.length}
            </strong>

            <span>
              {filteredSummaries.length === 1
                ? "resumo"
                : "resumos"}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <BookOpen size={31} />
            </span>

            <h2>
              Carregando biblioteca...
            </h2>

            <p>
              Buscando seus resumos salvos.
            </p>
          </div>
        ) : loadError ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <BookOpen size={31} />
            </span>

            <h2>
              Não foi possível carregar
            </h2>

            <p>{loadError}</p>

            <button
              type="button"
              className="open-summary-button"
              onClick={loadLibrary}
            >
              Tentar novamente
            </button>
          </div>
        ) : summaries.length === 0 ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <BookOpen size={31} />
            </span>

            <h2>
              Sua biblioteca está vazia
            </h2>

            <p>
              Gere um resumo e clique em Salvar para
              adicioná-lo à sua coleção.
            </p>
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Search size={31} />
            </span>

            <h2>
              Nenhum resumo encontrado
            </h2>

            <p>
              Tente pesquisar usando outras palavras.
            </p>
          </div>
        ) : (
          <div className="library-grid">
            {filteredSummaries.map(
              (item) => (
                <article
                  key={item.id}
                  className="library-card"
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
                      className={`favorite-button ${item.favorite
                        ? "is-favorite"
                        : ""
                        }`}
                      onClick={() =>
                        toggleFavorite(item)
                      }
                      disabled={
                        updatingFavoriteId ===
                        item.id
                      }
                      title={
                        item.favorite
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                      aria-label={
                        item.favorite
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                    >
                      <Heart
                        size={20}
                        fill={
                          item.favorite
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>

                  <div className="library-card-content">
                    <span className="library-card-type">
                      Resumo literário
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
                        requestRemoveFromLibrary(item)
                      }
                      disabled={
                        removingSummaryId ===
                        item.id
                      }
                      title="Remover da biblioteca"
                      aria-label="Remover da biblioteca"
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
            aria-labelledby="library-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="library-modal-scroll">
              <header className="library-modal-header">
                <div>
                  <span>Resumo salvo</span>

                  <h2 id="library-modal-title">
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
                  className={`modal-favorite-button ${selectedSummary.favorite
                    ? "is-favorite"
                    : ""
                    }`}
                  onClick={() =>
                    toggleFavorite(
                      selectedSummary,
                    )
                  }
                  disabled={
                    updatingFavoriteId ===
                    selectedSummary.id
                  }
                >
                  <Heart
                    size={18}
                    fill={
                      selectedSummary.favorite
                        ? "currentColor"
                        : "none"
                    }
                  />

                  {selectedSummary.favorite
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"}
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
        open={Boolean(summaryPendingRemoval)}
        eyebrow="Minha biblioteca"
        title="Remover este resumo?"
        message={
          <>
            “
            {summaryPendingRemoval?.title ||
              summaryPendingRemoval?.workTitle ||
              "Resumo literário"}
            ” será removido da sua biblioteca,
            mas continuará disponível no Histórico.
          </>
        }
        confirmLabel="Remover da biblioteca"
        cancelLabel="Permanecer"
        isProcessing={Boolean(
          removingSummaryId,
        )}
        onConfirm={confirmRemoveFromLibrary}
        onClose={closeRemoveLibraryDialog}
      />
    </div>
  );
}