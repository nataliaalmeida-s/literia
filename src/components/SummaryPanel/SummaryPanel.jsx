import { useState } from "react";
import {
  BookOpen,
  Check,
  Clipboard,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router";

import "./SummaryPanel.css";

import {
  notifyNotificationsChanged,
} from "../../utils/notificationEvents";

import BookCover from "../BookCover/BookCover";

import { apiRequest } from "../../services/api";

export default function SummaryPanel() {
  const navigate = useNavigate();
  const [
    workTitle,
    setWorkTitle,
  ] = useState("");

  const [
    author,
    setAuthor,
  ] = useState("");
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");

  const [
    currentSummaryId,
    setCurrentSummaryId,
  ] = useState(null);

  const [generatedAt, setGeneratedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveNameError, setSaveNameError] = useState("");

  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] = useState(false);
  const [savedSummaryTitle, setSavedSummaryTitle] = useState("");

  const [
    bookResults,
    setBookResults,
  ] = useState([]);

  const [
    selectedBook,
    setSelectedBook,
  ] = useState(null);

  const [
    generatedBook,
    setGeneratedBook,
  ] = useState(null);

  const [
    isSearchingBooks,
    setIsSearchingBooks,
  ] = useState(false);

  const [
    isBookSearchModalOpen,
    setIsBookSearchModalOpen,
  ] = useState(false);

  const [
    bookSearchError,
    setBookSearchError,
  ] = useState("");

  const canGenerate =
    text.trim().length > 0 &&
    !isLoading &&
    !isSearchingBooks;

  const canSearchBooks =
    Boolean(
      workTitle.trim() ||
      author.trim(),
    ) &&
    !isSearchingBooks;

  function resetGeneratedResult() {
    setSummary("");
    setCurrentSummaryId(null);
    setGeneratedAt(null);
    setGeneratedBook(null);

    setError("");
    setCopied(false);
    setSaved(false);
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

  function getBookYearLabel(book) {
    if (book?.firstPublicationYear) {
      return `Primeiro ano catalogado: ${book.firstPublicationYear}`;
    }

    if (book?.editionPublishedDate) {
      return `Edição consultada: ${book.editionPublishedDate}`;
    }

    return "Ano não informado";
  }

  function validateGenerationText() {
    const cleanText = text.trim();

    if (!cleanText) {
      setError(
        "Cole ou digite um trecho antes de gerar o resumo.",
      );

      return null;
    }

    if (cleanText.length < 20) {
      setError(
        "O trecho precisa possuir pelo menos 20 caracteres.",
      );

      return null;
    }

    if (cleanText.length > 30000) {
      setError(
        "O trecho ultrapassa o limite de 30.000 caracteres.",
      );

      return null;
    }

    return cleanText;
  }

  function normalizeBookForGeneration(
    book,
  ) {
    if (!book) {
      return null;
    }

    const normalizedBook = {
      workTitle:
        typeof book.workTitle === "string"
          ? book.workTitle.trim()
          : "",

      author:
        typeof book.author === "string"
          ? book.author.trim()
          : "",

      coverUrl:
        book.coverUrl || null,

      firstPublicationYear:
        book.firstPublicationYear ?? null,

      editionPublishedDate:
        book.editionPublishedDate || null,

      isbn:
        book.isbn || null,

      externalBookId:
        book.externalBookId || null,

      metadataSource:
        book.metadataSource || null,
    };

    const hasBookInformation =
      Boolean(
        normalizedBook.workTitle ||
        normalizedBook.author ||
        normalizedBook.coverUrl,
      );

    return hasBookInformation
      ? normalizedBook
      : null;
  }

  async function performSummaryGeneration(
    bookData = null,
  ) {
    const cleanText =
      validateGenerationText();

    if (!cleanText) {
      return;
    }

    const normalizedBookData =
      normalizeBookForGeneration(
        bookData,
      );

    resetGeneratedResult();

    setIsLoading(true);
    setCopied(false);
    setSaved(false);

    try {
      const data = await apiRequest(
        "/api/summaries/generate",
        {
          method: "POST",

          body: JSON.stringify({
            text: cleanText,

            ...(normalizedBookData
              ? {
                book:
                  normalizedBookData,
              }
              : {}),
          }),
        },
      );

      setCurrentSummaryId(
        data.summary.id,
      );

      setSummary(
        data.summary.summary,
      );

      setGeneratedAt(
        new Date(
          data.summary.createdAt,
        ),
      );

      const generatedBookData = {
        workTitle:
          data.summary.workTitle || "",

        author:
          data.summary.author || "",

        coverUrl:
          data.summary.coverUrl || null,

        firstPublicationYear:
          data.summary
            .firstPublicationYear ??
          null,

        editionPublishedDate:
          data.summary
            .editionPublishedDate ||
          null,

        isbn:
          data.summary.isbn || null,

        externalBookId:
          data.summary.externalBookId ||
          null,

        metadataSource:
          data.summary.metadataSource ||
          null,
      };

      const hasGeneratedBookInformation =
        Boolean(
          generatedBookData.workTitle ||
          generatedBookData.author ||
          generatedBookData.coverUrl,
        );

      setGeneratedBook(
        hasGeneratedBookInformation
          ? generatedBookData
          : null,
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível gerar o resumo.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function searchBooksBeforeGeneration() {
    const cleanWorkTitle =
      workTitle.trim();

    const cleanAuthor =
      author.trim();

    setBookResults([]);
    setBookSearchError("");
    setIsSearchingBooks(true);

    try {
      const searchParameters =
        new URLSearchParams();

      if (cleanWorkTitle) {
        searchParameters.set(
          "title",
          cleanWorkTitle,
        );
      }

      if (cleanAuthor) {
        searchParameters.set(
          "author",
          cleanAuthor,
        );
      }

      const data = await apiRequest(
        `/api/books/search?${searchParameters.toString()}`,
      );

      const books = Array.isArray(
        data?.books,
      )
        ? data.books
        : [];

      setBookResults(books);

      if (books.length === 0) {
        setBookSearchError(
          "Nenhuma obra correspondente foi encontrada. Você pode voltar para corrigir os dados ou gerar o resumo usando o título e o autor digitados.",
        );
      }

      /*
        O modal também abre quando nenhum livro
        é encontrado. Nesse caso, o usuário pode
        continuar com os dados digitados.
      */
      setIsBookSearchModalOpen(true);
    } catch (requestError) {
      setBookResults([]);

      setBookSearchError(
        requestError.message ||
        "Não foi possível consultar o catálogo literário. Você ainda pode gerar o resumo usando os dados digitados.",
      );

      setIsBookSearchModalOpen(true);
    } finally {
      setIsSearchingBooks(false);
    }
  }

  async function requestSummaryGeneration() {
    const cleanText =
      validateGenerationText();

    if (!cleanText) {
      return;
    }

    setError("");
    setBookSearchError("");

    const hasTypedBookInformation =
      Boolean(
        workTitle.trim() ||
        author.trim(),
      );

    /*
      Sem título e sem autor, o resumo continua
      podendo ser gerado normalmente.
    */
    if (!hasTypedBookInformation) {
      setSelectedBook(null);

      await performSummaryGeneration(
        null,
      );

      return;
    }

    /*
      Havendo título ou autor, primeiro consultamos
      o catálogo e mostramos as opções.
    */
    await searchBooksBeforeGeneration();
  }

  async function selectBookAndGenerate(
    book,
  ) {
    const normalizedBook =
      normalizeBookForGeneration(book);

    if (!normalizedBook) {
      return;
    }

    setSelectedBook(book);

    setWorkTitle(
      normalizedBook.workTitle,
    );

    setAuthor(
      normalizedBook.author,
    );

    setBookSearchError("");
    setIsBookSearchModalOpen(false);

    await performSummaryGeneration(
      normalizedBook,
    );
  }

  async function useTypedBookDataAndGenerate() {
    const typedBookData = {
      workTitle:
        workTitle.trim(),

      author:
        author.trim(),
    };

    setSelectedBook(null);
    setBookSearchError("");
    setIsBookSearchModalOpen(false);

    await performSummaryGeneration(
      typedBookData,
    );
  }

  function closeBookSearchModal() {
    if (isLoading) {
      return;
    }

    setIsBookSearchModalOpen(false);
  }

  async function copySummary() {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError("Não foi possível copiar o resumo.");
    }
  }

  function openSaveModal() {
    if (
      !summary ||
      !currentSummaryId ||
      isLoading
    ) {
      return;
    }

    setSaveName("");
    setSaveNameError("");
    setIsSaveModalOpen(true);
  }

  function closeSaveModal() {
    setIsSaveModalOpen(false);
    setSaveName("");
    setSaveNameError("");
  }

  function stayOnSummaryPage() {
    setIsSaveSuccessModalOpen(false);
  }

  function goToLibrary() {
    setIsSaveSuccessModalOpen(false);

    navigate("/biblioteca");
  }

  async function saveSummary(event) {
    event.preventDefault();

    if (!summary || !currentSummaryId) {
      setSaveNameError(
        "Gere um resumo antes de salvá-lo.",
      );

      return;
    }

    const customTitle = saveName.trim();

    if (!customTitle) {
      setSaveNameError(
        "Digite um nome para identificar o resumo na biblioteca.",
      );

      return;
    }

    try {
      const data = await apiRequest(
        `/api/summaries/${currentSummaryId}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            title: customTitle,
            author: author.trim(),
            saved: true,
          }),
        },
      );

      setSaved(true);

      setSavedSummaryTitle(
        data.summary.title,
      );

      notifyNotificationsChanged();

      closeSaveModal();

      setIsSaveSuccessModalOpen(true);
    } catch (requestError) {
      setSaveNameError(
        requestError.message ||
        "Não foi possível salvar o resumo.",
      );
    }
  }

  function clearText() {
    setText("");
    resetGeneratedResult();
  }

  function clearEverything() {
    setWorkTitle("");
    setAuthor("");
    setText("");
    setSummary("");

    setSelectedBook(null);
    setGeneratedBook(null);
    setBookResults([]);
    setBookSearchError("");
    setIsBookSearchModalOpen(false);

    setCurrentSummaryId(null);
    setGeneratedAt(null);

    setError("");
    setCopied(false);
    setSaved(false);
  }

  function formatDate(date) {
    if (!date) return "";

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  return (
    <section id="resumo" className="summary-section">
      <header className="summary-section-header">
        <div className="summary-header-content">
          <span className="summary-eyebrow">
            Ferramenta de resumo
          </span>

          <h2>Do trecho à síntese</h2>

          <div className="literary-divider" aria-hidden="true">
            <span>✦</span>
          </div>
        </div>
      </header>

      <section className="book-identification-panel">
        <header className="book-identification-header">
          <span
            className="book-identification-icon"
            aria-hidden="true"
          >
            <BookOpen size={20} />
          </span>

          <div>
            <span>Prólogo</span>

            <h3>Identifique a obra</h3>

            <p>
              Informe o título e o autor antes
              de iniciar a síntese do trecho.
            </p>
          </div>
        </header>

        <div
          className="book-identification-divider"
          aria-hidden="true"
        >
          <span>❦</span>
        </div>

        <div className="book-identification-fields">
          <label>
            <span>Título da obra</span>

            <input
              type="text"
              value={workTitle}
              maxLength={200}
              onChange={(event) => {
                setWorkTitle(
                  event.target.value,
                );

                setSelectedBook(null);
                setBookSearchError("");

                resetGeneratedResult();
              }}
              placeholder="Ex.: Senhora"
            />
          </label>

          <label>
            <span>Nome do autor</span>

            <input
              type="text"
              value={author}
              maxLength={160}
              onChange={(event) => {
                setAuthor(
                  event.target.value,
                );

                setSelectedBook(null);
                setBookSearchError("");

                resetGeneratedResult();
              }}
              placeholder="Ex.: José de Alencar"
            />
          </label>
        </div>

        <p className="book-identification-note">
          <BookOpen
            size={14}
            aria-hidden="true"
          />

          Ao clicar em Gerar resumo, você
          escolherá a obra correspondente no
          catálogo.
        </p>
      </section>

      <div className="summary-workspace book-spread">
        {/* Página esquerda */}
        <div className="summary-input-column">
          <div className="summary-column-heading">
            <div>
              <span className="step-number">I</span>

              <div>
                <span className="chapter-label">Capítulo I</span>
                <strong>Texto de entrada</strong>
                <small>Cole o trecho literário que deseja resumir</small>
              </div>
            </div>
          </div>

          {/*
            Mantido para uso futuro com a API.
            Atualmente, este bloco está oculto pelo CSS.
          */}

          <label className="summary-field text-field">
            <textarea
              value={text}
              aria-label="Trecho literário para resumir"
              onChange={(event) => {
                setText(event.target.value);
                resetGeneratedResult();
              }}
              placeholder="Cole ou digite aqui o trecho que deseja resumir..."
            />
          </label>

          {error && (
            <p className="summary-error" role="alert">
              {error}
            </p>
          )}

          <div className="page-action-row page-action-row--double">
            <button
              type="button"
              className="clear-text-button"
              onClick={clearText}
              disabled={!text}
            >
              <Trash2 size={18} />
              Limpar texto
            </button>

            <button
              type="button"
              className="clear-summary-button"
              onClick={clearEverything}
              disabled={!text && !summary}
            >
              <RotateCcw size={18} />
              Limpar tudo
            </button>
          </div>
        </div>

        {/* Página direita */}
        <div className="summary-result-column">
          <div className="summary-column-heading">
            <div>
              <span className="step-number">II</span>

              <div>
                <span className="chapter-label">Capítulo II</span>
                <strong>Resumo gerado</strong>
                <small>Síntese organizada do trecho</small>
              </div>
            </div>

            {summary && (
              <span className="result-status">
                <Check size={14} />
                Concluído
              </span>
            )}
          </div>

          <div
            className={`summary-result-surface ${summary ? "has-summary" : ""
              }`}
            aria-live="polite"
            aria-busy={
              isLoading ||
              isSearchingBooks
            }
          >
            {isSearchingBooks || isLoading ? (
              <div className="summary-loading">
                <span className="loading-icon">
                  <Sparkles size={27} />
                </span>

                <strong>
                  {isSearchingBooks
                    ? "Consultando o catálogo..."
                    : "Organizando o conteúdo..."}
                </strong>

                <p>
                  {isSearchingBooks
                    ? "Procurando opções para a obra informada."
                    : "Seu resumo está sendo preparado."}
                </p>
              </div>
            ) : summary ? (
              <div className="generated-summary">
                <div className="generated-summary-text">
                  <p>{summary}</p>
                </div>

                <footer className="generated-summary-footer">
                  <button
                    type="button"
                    className="copy-summary-footer-button"
                    onClick={copySummary}
                    title={copied ? "Resumo copiado" : "Copiar resumo"}
                    aria-label={copied ? "Resumo copiado" : "Copiar resumo"}
                  >
                    {copied ? (
                      <Check size={16} />
                    ) : (
                      <Clipboard size={16} />
                    )}
                  </button>

                  <span>{formatDate(generatedAt)}</span>
                </footer>
              </div>
            ) : (
              <div className="empty-summary">
                <span className="empty-summary-icon">
                  <Sparkles size={30} />
                </span>

                <strong>Seu resumo aparecerá aqui</strong>
              </div>
            )}
          </div>

          <div className="page-action-row page-action-row--double">
            <button
              type="button"
              className="save-summary-button"
              onClick={openSaveModal}
              disabled={
                !summary ||
                !currentSummaryId ||
                isLoading ||
                saved
              }
            >
              {saved ? (
                <Check size={18} />
              ) : (
                <Save size={18} />
              )}

              {saved ? "Salvo" : "Salvar"}
            </button>

            <button
              type="button"
              className="generate-summary-button"
              disabled={!canGenerate}
              onClick={
                requestSummaryGeneration
              }
            >
              <Sparkles size={18} />

              {isSearchingBooks
                ? "Buscando obra..."
                : isLoading
                  ? "Gerando..."
                  : summary
                    ? "Gerar novamente"
                    : "Gerar resumo"}
            </button>
          </div>
        </div>
      </div>

      {summary && generatedBook && (
        <section
          className="generated-book-details"
          aria-label="Informações bibliográficas da obra"
        >
          <BookCover
            className="generated-book-details-cover"
            src={generatedBook.coverUrl}
            alt={`Capa de ${generatedBook.workTitle ||
              "obra literária"
              }`}
            iconSize={36}
          />

          <div className="generated-book-details-content">
            <span className="generated-book-details-eyebrow">
              Sobre a obra
            </span>

            <h3>
              {generatedBook.workTitle ||
                "Título não informado"}
            </h3>

            {generatedBook.author && (
              <p className="generated-book-details-author">
                <UserRound size={16} />

                <span>
                  {generatedBook.author}
                </span>
              </p>
            )}

            <div className="generated-book-details-metadata">
              {(
                generatedBook.firstPublicationYear ||
                generatedBook.editionPublishedDate
              ) && (
                  <span>
                    {getBookYearLabel(
                      generatedBook,
                    )}
                  </span>
                )}

              {generatedBook.editionPublishedDate &&
                generatedBook.firstPublicationYear && (
                  <span>
                    Edição consultada:{" "}
                    {
                      generatedBook.editionPublishedDate
                    }
                  </span>
                )}

              {generatedBook.isbn && (
                <span>
                  ISBN: {generatedBook.isbn}
                </span>
              )}

              {generatedBook.metadataSource && (
                <span>
                  Fonte:{" "}
                  {getBookSourceLabel(
                    generatedBook.metadataSource,
                  )}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {isBookSearchModalOpen && (
        <div
          className="book-search-modal-backdrop"
          role="presentation"
          onMouseDown={
            closeBookSearchModal
          }
        >
          <section
            className="book-search-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-search-modal-title"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="book-search-modal-header">
              <div>
                <span>
                  Catálogo literário
                </span>

                <h3 id="book-search-modal-title">
                  Qual é a obra correta?
                </h3>

                <p>
                  Selecione uma opção para
                  associar os dados bibliográficos
                  ao resumo.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeBookSearchModal
                }
                aria-label="Fechar pesquisa"
              >
                <X size={20} />
              </button>
            </header>

            {bookResults.length > 0 ? (
              <div className="book-search-results">
                {bookResults.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className="book-search-result"
                    onClick={() =>
                      selectBookAndGenerate(
                        book,
                      )
                    }
                  >
                    <BookCover
                      className="book-result-cover"
                      src={book.coverUrl}
                      alt=""
                      iconSize={24}
                    />

                    <span className="book-result-information">
                      <strong>
                        {book.workTitle}
                      </strong>

                      <span>
                        {book.author ||
                          "Autor não informado"}
                      </span>

                      <small>
                        {getBookYearLabel(
                          book,
                        )}
                      </small>

                      <small>
                        Fonte:{" "}
                        {getBookSourceLabel(
                          book.metadataSource,
                        )}
                      </small>
                    </span>

                    <span className="book-result-select">
                      Selecionar e gerar
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="book-search-empty"
                role="status"
              >
                <span className="book-search-empty-icon">
                  <BookOpen size={27} />
                </span>

                <strong>
                  Obra não localizada
                </strong>

                <p>
                  {bookSearchError ||
                    "Nenhuma obra correspondente foi encontrada no catálogo."}
                </p>
              </div>
            )}

            <footer className="book-search-modal-footer">
              <button
                type="button"
                onClick={
                  useTypedBookDataAndGenerate
                }
              >
                <Sparkles size={16} />

                Gerar com os dados digitados
              </button>
            </footer>
          </section>
        </div>
      )}

      {isSaveModalOpen && (
        <div
          className="save-summary-modal-backdrop"
          role="presentation"
          onMouseDown={closeSaveModal}
        >
          <form
            className="save-summary-modal"
            onSubmit={saveSummary}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-summary-modal-title"
          >
            <header className="save-summary-modal-header">
              <div>
                <span>Minha biblioteca</span>

                <h3 id="save-summary-modal-title">
                  Nomeie seu resumo
                </h3>

                <p>
                  Escolha um título para encontrá-lo facilmente
                  depois.
                </p>
              </div>

              <button
                type="button"
                className="close-save-summary-modal"
                onClick={closeSaveModal}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </header>

            <label className="save-summary-name-field">
              <span>Nome do resumo</span>

              <input
                type="text"
                value={saveName}
                maxLength={80}
                autoFocus
                onChange={(event) => {
                  setSaveName(event.target.value);
                  setSaveNameError("");
                }}
                placeholder="Ex.: Aurélia e o mercado matrimonial"
              />

              <small>
                {saveName.length} / 80
              </small>
            </label>

            {saveNameError && (
              <p className="save-summary-name-error" role="alert">
                {saveNameError}
              </p>
            )}

            <footer className="save-summary-modal-actions">
              <button
                type="button"
                className="cancel-save-summary-button"
                onClick={closeSaveModal}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="confirm-save-summary-button"
                disabled={!saveName.trim()}
              >
                <Save size={17} />
                Salvar na biblioteca
              </button>
            </footer>
          </form>
        </div>
      )}

      {isSaveSuccessModalOpen && (
        <div
          className="save-success-modal-backdrop"
          role="presentation"
          onMouseDown={stayOnSummaryPage}
        >
          <div
            className="save-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-success-modal-title"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            <span
              className="save-success-modal-icon"
              aria-hidden="true"
            >
              <Check size={26} />
            </span>

            <span className="save-success-modal-eyebrow">
              Resumo salvo
            </span>

            <h3 id="save-success-modal-title">
              Salvo na sua biblioteca
            </h3>

            <p>
              “{savedSummaryTitle || "Seu resumo"}” foi
              salvo com sucesso. Deseja continuar nesta
              página ou abrir sua biblioteca?
            </p>

            <div className="save-success-modal-actions">
              <button
                type="button"
                className="stay-on-summary-button"
                onClick={stayOnSummaryPage}
              >
                Permanecer aqui
              </button>

              <button
                type="button"
                className="go-to-library-button"
                onClick={goToLibrary}
              >
                <BookOpen size={17} />
                Ir para a biblioteca
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

