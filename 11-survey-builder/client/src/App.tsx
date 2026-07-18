import { Link, Navigate, Route, Routes } from "react-router-dom";
import styles from "./App.module.css";
import { PublicSurveyPage } from "./features/surveys/PublicSurveyPage";
import { SurveyBuilderPage } from "./features/surveys/SurveyBuilderPage";
import { SurveyResultsPage } from "./features/surveys/SurveyResultsPage";
import { SurveysPage } from "./features/surveys/SurveysPage";

/** Defines the top-level survey builder routes and application frame. */
export default function App() {
  return (
    <Routes>
      <Route path="/public/:token" element={<PublicSurveyPage />} />
      <Route
        path="/*"
        element={
          <div className={styles.shell}>
            <nav className={styles.nav}>
              <Link to="/surveys">Surveys</Link>
              <span>Project 11</span>
            </nav>
            <Routes>
              <Route path="/surveys" element={<SurveysPage />} />
              <Route path="/surveys/:id/builder" element={<SurveyBuilderPage />} />
              <Route path="/surveys/:id/results" element={<SurveyResultsPage />} />
              <Route path="*" element={<Navigate to="/surveys" replace />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  );
}

