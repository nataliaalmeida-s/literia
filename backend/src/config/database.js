import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "A variável DATABASE_URL não foi definida no arquivo .env.",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  /*
    Mantemos poucas conexões durante o desenvolvimento.
    O Neon já possui seu próprio pool de conexões.
  */
  max: 5,

  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (error) => {
  console.error(
    "Erro inesperado na conexão com PostgreSQL:",
    error,
  );
});