import { NavLink, Route, Routes } from "react-router-dom";
import styles from "./App.module.css";
import { BookingPage } from "./pages/BookingPage";
import { BrowseProvidersPage } from "./pages/BrowseProvidersPage";
import { CustomerDashboardPage } from "./pages/CustomerDashboardPage";
import { ProviderDashboardPage } from "./pages/ProviderDashboardPage";
import { ProviderPage } from "./pages/ProviderPage";
import { ProviderSettingsPage } from "./pages/ProviderSettingsPage";

/** Defines the appointment booking frontend shell and routes. */
export default function App(): JSX.Element {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>Project 14 - Appointment Booking</div>
        <nav className={styles.nav}>
          <NavLink to="/">Browse</NavLink>
          <NavLink to="/my">Customer</NavLink>
          <NavLink to="/provider">Provider</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<BrowseProvidersPage />} />
          <Route path="/providers/:id" element={<ProviderPage />} />
          <Route path="/book/:providerId/:serviceId" element={<BookingPage />} />
          <Route path="/my" element={<CustomerDashboardPage />} />
          <Route path="/provider" element={<ProviderDashboardPage />} />
          <Route path="/settings" element={<ProviderSettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
