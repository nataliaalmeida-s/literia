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
  Clock3,
  Eye,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  apiRequest,
} from "../../services/api";

import "../Library/Library.css";
import "./History.css";

import BookCover from "../BookCover/BookCover";

import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Data não informada";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function createPreview(
  text,
  maximumLength = 190,
) {
  if (!text) {
    return "Resumo sem conteúdo.";
  }

  const normalizedText = text
    .trim()
    .replace(/\s+/g, " ");

  if (
    normalizedText.length <= maximumLength
  ) {
    return normalizedText;
  }

  return `${normalizedText
    .slice(0, maximumLength)
    .trim()}…`;
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

export default function History() {
  const [
    historyItems,
    setHistoryItems,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isClearing,
    setIsClearing,
  ] = useState(false);

  const [
    deletingItemId,
    setDeletingItemId,
  ] = useState(null);

  const [loadError, setLoadError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [
    historyItemPendingDeletion,
    setHistoryItemPendingDeletion,
  ] = useState(null);

  const [
    isClearHistoryDialogOpen,
    setIsClearHistoryDialogOpen,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  async function loadHistory() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await apiRequest(
        "/api/summaries/history",
      );

      setHistoryItems(
        Array.isArray(data?.summaries)
          ? data.summaries
          : [],
      );
    } catch (requestError) {
      setLoadError(
        requestError.message ||
        "Não foi possível carregar o histórico.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("pt-BR");

    if (!normalizedSearch) {
      return historyItems;
    }

    return historyItems.filter((item) => {
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
  }, [historyItems, searchTerm]);

  function openItem(item) {
    setSelectedItem(item);
    setCopied(false);
  }

  function closeItem() {
    setSelectedItem(null);
    setCopied(false);
  }

  function requestDeleteHistoryItem(item) {
    if (!item?.id) {
      return;
    }

    setActionError("");
    setHistoryItemPendingDeletion(item);
  }

  function closeDeleteHistoryItemDialog() {
    if (deletingItemId) {
      return;
    }

    setHistoryItemPendingDeletion(null);
  }

  async function confirmDeleteHistoryItem() {
    const itemId =
      historyItemPendingDeletion?.id;

    if (!itemId) {
      return;
    }

    setDeletingItemId(itemId);
    setActionError("");

    try {
      await apiRequest(
        `/api/summaries/history/${itemId}/hide`,
        {
          method: "PATCH",
        },
      );

      setHistoryItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              item.id !== itemId,
          ),
      );

      if (
        selectedItem?.id === itemId
      ) {
        closeItem();
      }

      setHistoryItemPendingDeletion(
        null,
      );
    } catch (requestError) {
      setActionError(
        requestError.message ||
        "Não foi possível remover o registro do histórico.",
      );
    } finally {
      setDeletingItemId(null);
    }
  }

  function requestClearHistory() {
    if (
      historyItems.length === 0 ||
      isClearing
    ) {
      return;
    }

    setActionError("");
    setIsClearHistoryDialogOpen(true);
  }

  function closeClearHistoryDialog() {
    if (isClearing) {
      return;
    }

    setIsClearHistoryDialogOpen(false);
  }

  async function clearHistory() {
    if (historyItems.length === 0) {
      return;
    }

    setIsClearing(true);
    setActionError("");

    try {
      await apiRequest(
        "/api/summaries/history/clear",
        {
          method: "PATCH",
        },
      );

      setHistoryItems([]);

      closeItem();

      setIsClearHistoryDialogOpen(false);
    } catch (requestError) {
      setActionError(
        requestError.message ||
        "Não foi possível limpar o histórico.",
      );
    } finally {
      setIsClearing(false);
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
    <div className="library-page history-page">
      <section className="library-section">
        <header className="library-header history-header">
          <div>
            <span className="library-eyebrow">
              Atividades recentes
            </span>

            <h1>Histórico</h1>

            <p>
              Consulte os resumos gerados anteriormente.
            </p>
          </div>

          <span
            className="library-header-icon history-header-icon"
            aria-hidden="true"
          >
            <Clock3 size={34} />
          </span>
        </header>

        <div className="library-toolbar history-toolbar">
          <label className="library-search">
            <Search size={19} />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Pesquisar no histórico..."
              aria-label="Pesquisar no histórico"
            />
          </label>

          <div className="history-toolbar-actions">
            <div className="library-counter">
              <strong>
                {historyItems.length}
              </strong>

              <span>
                {historyItems.length === 1
                  ? "registro"
                  : "registros"}
              </span>
            </div>

            <button
              type="button"
              className="clear-history-button"
              onClick={requestClearHistory}
              disabled={
                historyItems.length === 0 ||
                isLoading ||
                isClearing
              }
            >
              <Trash2 size={17} />

              {isClearing
                ? "Limpando..."
                : "Limpar histórico"}
            </button>
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
              <Clock3 size={31} />
            </span>

            <h2>Carregando histórico...</h2>

            <p>
              Buscando seus resumos no banco de dados.
            </p>
          </div>
        ) : loadError ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Clock3 size={31} />
            </span>

            <h2>
              Não foi possível carregar
            </h2>

            <p>{loadError}</p>

            <button
              type="button"
              className="clear-history-button"
              onClick={loadHistory}
            >
              Tentar novamente
            </button>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Clock3 size={31} />
            </span>

            <h2>Seu histórico está vazio</h2>

            <p>
              Os resumos gerados aparecerão
              automaticamente nesta página.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="library-empty">
            <span className="library-empty-icon">
              <Search size={30} />
            </span>

            <h2>
              Nenhum registro encontrado
            </h2>

            <p>
              Tente pesquisar usando outras palavras.
            </p>
          </div>
        ) : (
          <div className="library-grid">
            {filteredHistory.map((item) => (
              <article
                key={item.id}
                className="library-card history-card"
              >
                <div className="library-card-top">
                  <BookCover
                    className="history-card-cover"
                    src={item.coverUrl}
                    alt={`Capa de ${item.workTitle ||
                      "obra literária"
                      }`}
                    iconSize={23}
                  />

                  <span
                    className="history-time-icon"
                    title="Registro do histórico"
                  >
                    <Clock3 size={18} />
                  </span>
                </div>

                <div className="library-card-content">
                  <span className="library-card-type">
                    Resumo gerado
                  </span>

                  <h2>
                    {item.title?.trim() ||
                      item.workTitle?.trim() ||
                      "Resumo do histórico"}
                  </h2>

                  {item.title?.trim() &&
                    item.workTitle?.trim() && (
                      <span className="history-card-work-title">
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
                    <span className="history-card-publication">
                      {getPublicationLabel(item)}
                    </span>
                  )}

                  <p>
                    {createPreview(
                      item.summary,
                    )}
                  </p>
                </div>

                <div className="library-card-date">
                  <CalendarDays size={15} />

                  <span>
                    {formatDateTime(
                      item.createdAt,
                    )}
                  </span>
                </div>

                <footer className="library-card-actions">
                  <button
                    type="button"
                    className="open-summary-button"
                    onClick={() =>
                      openItem(item)
                    }
                  >
                    <Eye size={17} />
                    Abrir
                  </button>

                  <button
                    type="button"
                    className="delete-summary-button"
                    onClick={() =>
                      requestDeleteHistoryItem(item)
                    }
                    disabled={
                      deletingItemId === item.id
                    }
                    aria-label="Remover do histórico"
                    title="Remover do histórico"
                  >
                    <Trash2 size={17} />
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedItem && (
        <div
          className="library-modal-backdrop"
          role="presentation"
          onMouseDown={closeItem}
        >
          <article
            className="library-modal history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="library-modal-scroll">
              <header className="library-modal-header">
                <div>
                  <span>
                    Registro do histórico
                  </span>

                  <h2 id="history-modal-title">
                    {selectedItem.title?.trim() ||
                      selectedItem.workTitle?.trim() ||
                      "Resumo gerado"}
                  </h2>

                  <small>
                    {formatDateTime(
                      selectedItem.createdAt,
                    )}
                  </small>
                </div>

                <button
                  type="button"
                  className="close-library-modal"
                  onClick={closeItem}
                  aria-label="Fechar"
                >
                  <X size={21} />
                </button>
              </header>

              {hasBookMetadata(selectedItem) && (
                <section className="history-modal-book">
                  <BookCover
                    className="history-modal-book-cover"
                    src={selectedItem.coverUrl}
                    alt={`Capa de ${selectedItem.workTitle ||
                      "obra literária"
                      }`}
                    iconSize={32}
                    loading="eager"
                  />

                  <div className="history-modal-book-content">
                    <span className="history-modal-book-eyebrow">
                      Sobre a obra
                    </span>

                    <h3>
                      {selectedItem.workTitle ||
                        "Título não informado"}
                    </h3>

                    {selectedItem.author && (
                      <p className="history-modal-book-author">
                        {selectedItem.author}
                      </p>
                    )}

                    <div className="history-modal-book-metadata">
                      {selectedItem.firstPublicationYear && (
                        <span>
                          Primeiro ano catalogado:{" "}
                          {
                            selectedItem.firstPublicationYear
                          }
                        </span>
                      )}

                      {selectedItem.editionPublishedDate && (
                        <span>
                          Edição consultada:{" "}
                          {
                            selectedItem.editionPublishedDate
                          }
                        </span>
                      )}

                      {selectedItem.isbn && (
                        <span>
                          ISBN: {selectedItem.isbn}
                        </span>
                      )}

                      {selectedItem.metadataSource && (
                        <span>
                          Fonte:{" "}
                          {getBookSourceLabel(
                            selectedItem.metadataSource,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <div className="library-modal-summary">
                <span>Resumo</span>

                <p>{selectedItem.summary}</p>
              </div>

              {selectedItem.originalText && (
                <details className="library-original-text">
                  <summary>
                    Ver trecho original
                  </summary>

                  <p>
                    {selectedItem.originalText}
                  </p>
                </details>
              )}

              <footer className="library-modal-actions">
                <button
                  type="button"
                  className="modal-copy-button"
                  onClick={() =>
                    copySummary(
                      selectedItem.summary,
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
          historyItemPendingDeletion,
        )}
        eyebrow="Histórico"
        title="Remover este registro?"
        message={
          <>
            “
            {historyItemPendingDeletion?.title ||
              historyItemPendingDeletion?.workTitle ||
              "Resumo gerado"}
            ” será removido somente do Histórico.
            O resumo continuará disponível na Biblioteca
            e nos Favoritos quando estiver salvo nessas
            páginas.
          </>
        }
        confirmLabel="Remover do histórico"
        cancelLabel="Cancelar"
        isProcessing={Boolean(
          deletingItemId,
        )}
        onConfirm={confirmDeleteHistoryItem}
        onClose={
          closeDeleteHistoryItemDialog
        }
      />

      <ConfirmDialog
        open={isClearHistoryDialogOpen}
        eyebrow="Histórico"
        title="Limpar todo o histórico?"
        message="Todos os registros serão removidos somente do Histórico. Os resumos salvos na Biblioteca e nos Favoritos continuarão disponíveis nessas páginas."
        confirmLabel="Limpar histórico"
        cancelLabel="Cancelar"
        isProcessing={isClearing}
        onConfirm={clearHistory}
        onClose={closeClearHistoryDialog}
      />
    </div>
  );
}