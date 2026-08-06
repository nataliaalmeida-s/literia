import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import SummaryPanel from "../components/SummaryPanel/SummaryPanel";

export default function SummaryPage() {
  return (
    <div className="summary-page">
      <SummaryPanel />

      <footer className="summary-page-footer">
        <Link
          to="/"
          className="back-home-link"
        >
          <ArrowLeft size={17} />
          Voltar ao início
        </Link>
      </footer>
    </div>
  );
}