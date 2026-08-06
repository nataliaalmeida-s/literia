import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  FileText,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="welcome-card">
        <div className="welcome-content">
          <span className="welcome-label">
            Literatura e Inteligência Artificial
          </span>

          <h1>Explore obras e gere resumos</h1>

          <p>
            Cole um trecho literário e transforme-o em uma síntese
            clara, organizada e pronta para seus estudos.
          </p>

          <Link
            to="/resumo"
            className="primary-button"
          >
            Abrir ferramenta de resumo
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="hero-tech-visual" aria-hidden="true">
          <span className="tech-orbit tech-orbit-one" />
          <span className="tech-orbit tech-orbit-two" />

          <div className="tech-chip tech-chip-input">
            <FileText size={17} />
            Trecho literário
          </div>

          <div className="tech-chip tech-chip-output">
            <BookOpen size={17} />
            Síntese
          </div>

          <div className="tech-core-card">
            <span className="tech-core-icon">
              <BrainCircuit size={34} />
            </span>

            <span className="tech-core-label">
              LiterIA
            </span>

            <strong>Análise literária</strong>

            <p>Do trecho à síntese</p>

            <div className="tech-document">
              <FileText size={20} />

              <div className="tech-document-lines">
                <span />
                <span />
                <span />
              </div>

              <Sparkles size={18} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}