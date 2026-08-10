import { Search } from "lucide-react";

import "./Header.css";

export default function Header() {
  return (
    <header className="header">

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