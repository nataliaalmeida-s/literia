const GOOGLE_BOOKS_API_URL =
  "https://www.googleapis.com/books/v1/volumes";

const OPEN_LIBRARY_API_URL =
  "https://openlibrary.org/search.json";

const DEFAULT_RESULT_LIMIT = 3;

const GOOGLE_SOURCE_SEARCH_LIMIT = 8;
const OPEN_LIBRARY_SOURCE_SEARCH_LIMIT = 20;

const REQUEST_TIMEOUT_MS = 8000;

/* =====================================================
   UTILITÁRIOS
===================================================== */

function cleanText(value, maximumLength = 200) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maximumLength);
}

function normalizeText(value) {
  return cleanText(value, 500)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCoverUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedUrl = value
    .trim()
    .replace(/^http:\/\//i, "https://");

  return normalizedUrl || null;
}

function extractYear(value) {
  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(
    /\b(1[0-9]{3}|20[0-9]{2}|2100)\b/,
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);

  return Number.isInteger(year)
    ? year
    : null;
}

function selectIsbn(identifiers) {
  if (!Array.isArray(identifiers)) {
    return null;
  }

  const isbn13 = identifiers.find(
    (identifier) =>
      identifier?.type === "ISBN_13",
  );

  const isbn10 = identifiers.find(
    (identifier) =>
      identifier?.type === "ISBN_10",
  );

  return (
    cleanText(isbn13?.identifier, 32) ||
    cleanText(isbn10?.identifier, 32) ||
    null
  );
}

async function fetchJson(url) {
  const controller =
    new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",

      headers: {
        Accept: "application/json",

        /*
          A Open Library solicita identificação
          responsável das aplicações que consomem
          seus serviços.
        */
        "User-Agent":
          "LiterIA/1.0 (book metadata search)",
      },

      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Serviço bibliográfico respondeu com status ${response.status}.`,
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/* =====================================================
   GOOGLE BOOKS
===================================================== */

function normalizeGoogleBook(item) {
  const volumeInfo =
    item?.volumeInfo ?? {};

  const workTitle =
    cleanText(volumeInfo.title, 200);

  if (!workTitle) {
    return null;
  }

  const authors = Array.isArray(
    volumeInfo.authors,
  )
    ? volumeInfo.authors
      .map((author) =>
        cleanText(author, 160),
      )
      .filter(Boolean)
    : [];

  const editionPublishedDate =
    cleanText(
      volumeInfo.publishedDate,
      40,
    ) || null;

  return {
    workTitle,

    author:
      authors.join(", ") || null,

    authors,

    coverUrl:
      normalizeCoverUrl(
        volumeInfo.imageLinks
          ?.thumbnail ||
        volumeInfo.imageLinks
          ?.smallThumbnail,
      ),

    /*
      O Google Books normalmente informa a data
      da edição encontrada, não necessariamente
      o primeiro ano da obra.
    */
    firstPublicationYear: null,

    editionPublishedDate,

    isbn:
      selectIsbn(
        volumeInfo.industryIdentifiers,
      ),

    externalBookId:
      cleanText(item?.id, 120) || null,

    metadataSource:
      "google-books",
  };
}

async function searchGoogleBooks({
  title,
  author,
}) {
  const apiKey =
    process.env.GOOGLE_BOOKS_API_KEY;

  /*
    De acordo com a documentação do Google,
    consultas de dados públicos devem identificar
    a aplicação com uma chave de API.

    Enquanto a chave não estiver configurada,
    seguimos normalmente com a Open Library.
  */
  if (!apiKey) {
    return [];
  }

  const queryParts = [];

  if (title) {
    queryParts.push(
      `intitle:"${title}"`,
    );
  }

  if (author) {
    queryParts.push(
      `inauthor:"${author}"`,
    );
  }

  const searchParameters =
    new URLSearchParams({
      q: queryParts.join(" "),
      maxResults:
        String(GOOGLE_SOURCE_SEARCH_LIMIT),
      printType: "books",
      orderBy: "relevance",
      projection: "lite",
      key: apiKey,
    });

  const data = await fetchJson(
    `${GOOGLE_BOOKS_API_URL}?${searchParameters.toString()}`,
  );

  const items = Array.isArray(data?.items)
    ? data.items
    : [];

  return items
    .map(normalizeGoogleBook)
    .filter(Boolean);
}

/* =====================================================
   OPEN LIBRARY
===================================================== */

function normalizeOpenLibraryBook(document) {
  const workTitle =
    cleanText(document?.title, 200);

  if (!workTitle) {
    return null;
  }

  const authors = Array.isArray(
    document?.author_name,
  )
    ? document.author_name
      .map((author) =>
        cleanText(author, 160),
      )
      .filter(Boolean)
    : [];

  const firstPublicationYear =
    extractYear(
      document?.first_publish_year,
    );

  const coverId =
    Number.isInteger(document?.cover_i)
      ? document.cover_i
      : null;

  const isbn = Array.isArray(
    document?.isbn,
  )
    ? cleanText(document.isbn[0], 32) ||
    null
    : null;

  const externalBookId =
    cleanText(document?.key, 120) ||
    null;

  return {
    workTitle,

    author:
      authors.join(", ") || null,

    authors,

    coverUrl: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null,

    firstPublicationYear,

    /*
      O resultado da Open Library neste ponto
      representa a obra. Não tratamos o primeiro
      ano como data de uma edição específica.
    */
    editionPublishedDate: null,

    isbn,
    externalBookId,

    metadataSource:
      "open-library",
  };
}

async function searchOpenLibrary({
  title,
  author,
}) {
  const searchParameters =
    new URLSearchParams({
      limit:
        String(OPEN_LIBRARY_SOURCE_SEARCH_LIMIT),

      fields: [
        "key",
        "title",
        "author_name",
        "first_publish_year",
        "cover_i",
        "isbn",
      ].join(","),
    });

  if (title) {
    searchParameters.set(
      "title",
      title,
    );
  }

  if (author) {
    searchParameters.set(
      "author",
      author,
    );
  }

  const data = await fetchJson(
    `${OPEN_LIBRARY_API_URL}?${searchParameters.toString()}`,
  );

  const documents = Array.isArray(
    data?.docs,
  )
    ? data.docs
    : [];

  return documents
    .map(normalizeOpenLibraryBook)
    .filter(Boolean);
}

/* =====================================================
   COMPARAÇÃO E CLASSIFICAÇÃO
===================================================== */

const IGNORED_COMPARISON_WORDS =
  new Set([
    "a",
    "o",
    "as",
    "os",
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
  ]);

function getComparableWords(value) {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return [];
  }

  return normalizedValue
    .split(" ")
    .filter(
      (word) =>
        word.length > 1 &&
        !IGNORED_COMPARISON_WORDS.has(
          word,
        ),
    );
}

function calculateWordContainment(
  firstValue,
  secondValue,
) {
  const firstWords =
    new Set(
      getComparableWords(firstValue),
    );

  const secondWords =
    new Set(
      getComparableWords(secondValue),
    );

  if (
    firstWords.size === 0 ||
    secondWords.size === 0
  ) {
    return 0;
  }

  let matchingWords = 0;

  for (const word of firstWords) {
    if (secondWords.has(word)) {
      matchingWords += 1;
    }
  }

  /*
    Dividimos pelo menor conjunto porque nomes como:

    José de Alencar
    José Martiniano de Alencar

    ainda representam o mesmo autor.
  */
  return (
    matchingWords /
    Math.min(
      firstWords.size,
      secondWords.size,
    )
  );
}

function calculateTitleSimilarity(
  firstTitle,
  secondTitle,
) {
  const normalizedFirstTitle =
    normalizeText(firstTitle);

  const normalizedSecondTitle =
    normalizeText(secondTitle);

  if (
    !normalizedFirstTitle ||
    !normalizedSecondTitle
  ) {
    return 0;
  }

  if (
    normalizedFirstTitle ===
    normalizedSecondTitle
  ) {
    return 1;
  }

  /*
    Reconhece títulos acompanhados de subtítulos,
    volumes ou outras informações adicionais.
  */
  if (
    normalizedFirstTitle.startsWith(
      `${normalizedSecondTitle} `,
    ) ||
    normalizedSecondTitle.startsWith(
      `${normalizedFirstTitle} `,
    )
  ) {
    return 0.94;
  }

  const firstWords =
    new Set(
      getComparableWords(
        normalizedFirstTitle,
      ),
    );

  const secondWords =
    new Set(
      getComparableWords(
        normalizedSecondTitle,
      ),
    );

  if (
    firstWords.size === 0 ||
    secondWords.size === 0
  ) {
    return 0;
  }

  let matchingWords = 0;

  for (const word of firstWords) {
    if (secondWords.has(word)) {
      matchingWords += 1;
    }
  }

  return (
    matchingWords /
    Math.max(
      firstWords.size,
      secondWords.size,
    )
  );
}

function getBookAuthors(book) {
  if (
    Array.isArray(book?.authors) &&
    book.authors.length > 0
  ) {
    return book.authors
      .map((author) =>
        cleanText(author, 160),
      )
      .filter(Boolean);
  }

  const author =
    cleanText(book?.author, 500);

  if (!author) {
    return [];
  }

  return author
    .split(",")
    .map((authorName) =>
      cleanText(authorName, 160),
    )
    .filter(Boolean);
}

function calculateAuthorSimilarity(
  firstBook,
  secondBook,
) {
  const firstAuthors =
    getBookAuthors(firstBook);

  const secondAuthors =
    getBookAuthors(secondBook);

  if (
    firstAuthors.length === 0 ||
    secondAuthors.length === 0
  ) {
    return 0;
  }

  let bestSimilarity = 0;

  for (
    const firstAuthor
    of firstAuthors
  ) {
    for (
      const secondAuthor
      of secondAuthors
    ) {
      const similarity =
        calculateWordContainment(
          firstAuthor,
          secondAuthor,
        );

      bestSimilarity = Math.max(
        bestSimilarity,
        similarity,
      );
    }
  }

  return bestSimilarity;
}

function authorMatches(
  firstBook,
  secondBook,
) {
  return (
    calculateAuthorSimilarity(
      firstBook,
      secondBook,
    ) >= 0.66
  );
}

function booksRepresentSameWork(
  firstBook,
  secondBook,
) {
  /*
    ISBN igual representa uma correspondência
    muito forte entre os registros.
  */
  if (
    firstBook?.isbn &&
    secondBook?.isbn &&
    firstBook.isbn === secondBook.isbn
  ) {
    return true;
  }

  const titleSimilarity =
    calculateTitleSimilarity(
      firstBook?.workTitle,
      secondBook?.workTitle,
    );

  if (titleSimilarity < 0.88) {
    return false;
  }

  const firstAuthors =
    getBookAuthors(firstBook);

  const secondAuthors =
    getBookAuthors(secondBook);

  /*
    Sem autor nos dois registros, só unificamos
    títulos totalmente iguais.
  */
  if (
    firstAuthors.length === 0 ||
    secondAuthors.length === 0
  ) {
    return titleSimilarity === 1;
  }

  return authorMatches(
    firstBook,
    secondBook,
  );
}

function chooseEarlierYear(
  ...yearValues
) {
  const maximumAllowedYear =
    new Date().getUTCFullYear() + 1;

  const validYears =
    yearValues.filter(
      (year) =>
        Number.isInteger(year) &&
        year >= 1000 &&
        year <= maximumAllowedYear,
    );

  if (validYears.length === 0) {
    return null;
  }

  return Math.min(...validYears);
}

function calculateBookScore(
  book,
  requestedTitle,
  requestedAuthor,
) {
  let score = 0;

  if (requestedTitle) {
    const titleSimilarity =
      calculateTitleSimilarity(
        book.workTitle,
        requestedTitle,
      );

    score += Math.round(
      titleSimilarity * 100,
    );
  }

  if (requestedAuthor) {
    const requestedAuthorBook = {
      author: requestedAuthor,
      authors: [requestedAuthor],
    };

    const authorSimilarity =
      calculateAuthorSimilarity(
        book,
        requestedAuthorBook,
      );

    score += Math.round(
      authorSimilarity * 70,
    );
  }

  if (book.coverUrl) {
    score += 6;
  }

  if (book.firstPublicationYear) {
    score += 5;
  }

  if (book.editionPublishedDate) {
    score += 3;
  }

  if (book.isbn) {
    score += 3;
  }

  return score;
}

function calculateSourceMatchScore(
  firstBook,
  secondBook,
) {
  let score = 0;

  if (
    firstBook?.isbn &&
    secondBook?.isbn &&
    firstBook.isbn === secondBook.isbn
  ) {
    score += 200;
  }

  score +=
    calculateTitleSimilarity(
      firstBook?.workTitle,
      secondBook?.workTitle,
    ) * 100;

  score +=
    calculateAuthorSimilarity(
      firstBook,
      secondBook,
    ) * 80;

  if (
    secondBook?.firstPublicationYear
  ) {
    score += 5;
  }

  if (secondBook?.coverUrl) {
    score += 2;
  }

  return score;
}

function findBestOpenLibraryMatch(
  googleBook,
  openLibraryBooks,
) {
  const candidates =
    openLibraryBooks
      .filter((openLibraryBook) =>
        booksRepresentSameWork(
          googleBook,
          openLibraryBook,
        ),
      )
      .map((openLibraryBook) => ({
        book: openLibraryBook,

        score:
          calculateSourceMatchScore(
            googleBook,
            openLibraryBook,
          ),
      }))
      .sort(
        (
          firstCandidate,
          secondCandidate,
        ) => {
          const scoreDifference =
            secondCandidate.score -
            firstCandidate.score;

          if (scoreDifference !== 0) {
            return scoreDifference;
          }

          const firstYear =
            firstCandidate.book
              .firstPublicationYear ??
            Number.MAX_SAFE_INTEGER;

          const secondYear =
            secondCandidate.book
              .firstPublicationYear ??
            Number.MAX_SAFE_INTEGER;

          return firstYear - secondYear;
        },
      );

  return candidates[0]?.book ?? null;
}

/* =====================================================
   UNIFICAR GOOGLE E OPEN LIBRARY
===================================================== */

function mergeBookSources(
  googleBooks,
  openLibraryBooks,
) {
  const mergedBooks =
    googleBooks.map((googleBook) => {
      const openLibraryMatch =
        findBestOpenLibraryMatch(
          googleBook,
          openLibraryBooks,
        );

      return {
        ...googleBook,

        author:
          googleBook.author ||
          openLibraryMatch?.author ||
          null,

        authors:
          googleBook.authors?.length
            ? googleBook.authors
            : openLibraryMatch?.authors ||
            [],

        coverUrl:
          googleBook.coverUrl ||
          openLibraryMatch?.coverUrl ||
          null,

        /*
          O Google fornece a edição.
          A Open Library fornece o primeiro ano
          catalogado para a obra.
        */
        firstPublicationYear:
          chooseEarlierYear(
            googleBook
              .firstPublicationYear,

            openLibraryMatch
              ?.firstPublicationYear,
          ),

        isbn:
          googleBook.isbn ||
          openLibraryMatch?.isbn ||
          null,
      };
    });

  for (
    const openLibraryBook
    of openLibraryBooks
  ) {
    const alreadyRepresented =
      mergedBooks.some(
        (mergedBook) =>
          booksRepresentSameWork(
            mergedBook,
            openLibraryBook,
          ),
      );

    if (!alreadyRepresented) {
      mergedBooks.push(
        openLibraryBook,
      );
    }
  }

  return mergedBooks;
}

function mergeDuplicateBookData(
  primaryBook,
  duplicateBook,
) {
  return {
    ...primaryBook,

    author:
      primaryBook.author ||
      duplicateBook.author ||
      null,

    authors:
      primaryBook.authors?.length
        ? primaryBook.authors
        : duplicateBook.authors || [],

    coverUrl:
      primaryBook.coverUrl ||
      duplicateBook.coverUrl ||
      null,

    /*
      Entre vários registros da mesma obra,
      preservamos o menor primeiro ano válido.
    */
    firstPublicationYear:
      chooseEarlierYear(
        primaryBook
          .firstPublicationYear,

        duplicateBook
          .firstPublicationYear,
      ),

    editionPublishedDate:
      primaryBook
        .editionPublishedDate ||
      duplicateBook
        .editionPublishedDate ||
      null,

    isbn:
      primaryBook.isbn ||
      duplicateBook.isbn ||
      null,

    externalBookId:
      primaryBook.externalBookId ||
      duplicateBook.externalBookId ||
      null,

    metadataSource:
      primaryBook.metadataSource ||
      duplicateBook.metadataSource ||
      null,
  };
}

function deduplicateBooks(books) {
  const uniqueBooks = [];

  for (const book of books) {
    const existingIndex =
      uniqueBooks.findIndex(
        (existingBook) =>
          booksRepresentSameWork(
            existingBook,
            book,
          ),
      );

    if (existingIndex === -1) {
      uniqueBooks.push(book);
      continue;
    }

    uniqueBooks[existingIndex] =
      mergeDuplicateBookData(
        uniqueBooks[existingIndex],
        book,
      );
  }

  return uniqueBooks;
}

/* =====================================================
   FUNÇÃO PÚBLICA
===================================================== */

export async function searchBookMetadata({
  title,
  author,
  limit = DEFAULT_RESULT_LIMIT,
}) {
  const safeTitle =
    cleanText(title, 200);

  const safeAuthor =
    cleanText(author, 160);

  if (!safeTitle && !safeAuthor) {
    return [];
  }

  const [
    googleResult,
    openLibraryResult,
  ] = await Promise.allSettled([
    searchGoogleBooks({
      title: safeTitle,
      author: safeAuthor,
    }),

    searchOpenLibrary({
      title: safeTitle,
      author: safeAuthor,
    }),
  ]);

  const googleBooks =
    googleResult.status === "fulfilled"
      ? googleResult.value
      : [];

  const openLibraryBooks =
    openLibraryResult.status ===
      "fulfilled"
      ? openLibraryResult.value
      : [];

  if (
    googleResult.status === "rejected"
  ) {
    console.warn(
      "Pesquisa no Google Books falhou:",
      googleResult.reason?.message,
    );
  }

  if (
    openLibraryResult.status ===
    "rejected"
  ) {
    console.warn(
      "Pesquisa na Open Library falhou:",
      openLibraryResult.reason
        ?.message,
    );
  }

  if (
    googleResult.status === "rejected" &&
    openLibraryResult.status ===
    "rejected"
  ) {
    throw new Error(
      "Os serviços bibliográficos estão temporariamente indisponíveis.",
    );
  }

  const mergedBooks =
    mergeBookSources(
      googleBooks,
      openLibraryBooks,
    );

  const safeLimit = Math.min(
    Math.max(
      Number(limit) || DEFAULT_RESULT_LIMIT,
      1,
    ),
    5,
  );

  const rankedBooks =
    mergedBooks
      .map((book) => ({
        ...book,

        score:
          calculateBookScore(
            book,
            safeTitle,
            safeAuthor,
          ),
      }))
      .sort(
        (
          firstBook,
          secondBook,
        ) =>
          secondBook.score -
          firstBook.score,
      );

  const uniqueBooks =
    deduplicateBooks(
      rankedBooks,
    );

  return uniqueBooks
    .slice(0, safeLimit)
    .map(
      ({
        score,
        ...book
      }) => ({
        ...book,

        /*
          Propriedade pronta para ser usada
          como key no React.
        */
        id: [
          book.metadataSource,
          book.externalBookId ||
          normalizeText(
            book.workTitle,
          ),
        ].join(":"),
      }),
    );
}