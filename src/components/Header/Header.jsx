import { Menu, Search } from "lucide-react";

import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <button
        type="button"
        className="mobile-menu"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      <label className="search-box">
        <Search size={19} />

        <input
          type="search"
          placeholder="Pesquise por título ou obra..."
          aria-label="Pesquisar por título ou obra"
        />
      </label>
    </header>
  );
}