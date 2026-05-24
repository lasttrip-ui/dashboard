"use client";

import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/lib/store";
import { Sun, Moon, Save } from "lucide-react";
import { useState } from "react";

const TIMEZONES = [
  { value: "America/New_York", label: "America/New_York (ET)" },
  { value: "America/Chicago", label: "America/Chicago (CT)" },
  { value: "America/Denver", label: "America/Denver (MT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <Header title="Settings" />
      <div className="flex-1 p-6 max-w-2xl space-y-6 overflow-auto">
        {/* Appearance */}
        <Card title="Appearance">
          <div className="p-5 space-y-5">
            {/* Theme */}
            <div>
              <label className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider block mb-3">
                Theme
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => updateSettings({ theme: "dark" })}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded border text-sm font-medium transition-all ${
                    settings.theme === "dark"
                      ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <Moon size={15} />
                  Dark
                </button>
                <button
                  onClick={() => updateSettings({ theme: "light" })}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded border text-sm font-medium transition-all ${
                    settings.theme === "light"
                      ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <Sun size={15} />
                  Light
                </button>
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider block mb-3">
                Font Size
              </label>
              <div className="flex gap-3">
                {(["sm", "md", "lg"] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateSettings({ fontSize: sz })}
                    className={`px-4 py-2 rounded border text-sm font-medium transition-all ${
                      settings.fontSize === sz
                        ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {sz === "sm" ? "Small" : sz === "md" ? "Medium" : "Large"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Regional */}
        <Card title="Regional">
          <div className="p-5 space-y-5">
            <Select
              label="Currency Display"
              value={settings.currency}
              onChange={(e) =>
                updateSettings({
                  currency: e.target.value as "USD" | "EUR" | "GBP",
                })
              }
              options={[
                { value: "USD", label: "USD — US Dollar ($)" },
                { value: "EUR", label: "EUR — Euro (€)" },
                { value: "GBP", label: "GBP — British Pound (£)" },
              ]}
            />

            <Select
              label="Timezone"
              value={settings.timezone}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
              options={TIMEZONES}
            />
          </div>
        </Card>

        {/* Data */}
        <Card title="Data Management">
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              All data is stored locally in your browser&apos;s localStorage. No data
              is sent to any server.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      "Reset all data to defaults? This cannot be undone."
                    )
                  ) {
                    localStorage.removeItem("tt_trades");
                    localStorage.removeItem("tt_positions");
                    localStorage.removeItem("tt_settings");
                    window.location.reload();
                  }
                }}
              >
                Reset All Data
              </Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card title="About">
          <div className="p-5 space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Application</span>
              <span className="text-[var(--text-primary)] font-medium">
                Tortuga Trades
              </span>
            </div>
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-[var(--text-primary)] font-medium">
                0.1.0
              </span>
            </div>
            <div className="flex justify-between">
              <span>Broker</span>
              <span className="text-[var(--text-primary)] font-medium">
                Interactive Brokers
              </span>
            </div>
            <div className="flex justify-between">
              <span>Assets</span>
              <span className="text-[var(--text-primary)] font-medium">
                Forex · Crypto · Stocks · Futures
              </span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave}>
            <Save size={14} />
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>
    </>
  );
}
