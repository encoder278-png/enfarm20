
import React, { useEffect, useState } from "react";
import { FarmSettings } from "../types";
import {
  Settings2,
  Bell,
  BrainCircuit,
  MessageCircle,
  RadioTower,
  ShieldCheck,
  Save,
  CheckCircle2,
  Info,
  LockKeyhole,
  Server,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

interface SettingsViewProps {
  settings: FarmSettings;
  onSaveSettings: (settings: FarmSettings) => void;
}

type Section = "general" | "notifications" | "integrations" | "security";

const navigation: {
  id: Section;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "general",
    label: "General",
    description: "Workspace preferences",
    icon: Settings2,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alert preferences",
    icon: Bell,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connected services",
    icon: Server,
  },
  {
    id: "security",
    label: "Security",
    description: "Access and protection",
    icon: ShieldCheck,
  },
];

const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [activeSection, setActiveSection] =
    useState<Section>("general");

  const [autoAlerts, setAutoAlerts] = useState(
    settings.autoAlertsEnabled
  );

  const [apiGrounding, setApiGrounding] = useState(
    settings.apiGroundingEnabled
  );

  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setAutoAlerts(settings.autoAlertsEnabled);
    setApiGrounding(settings.apiGroundingEnabled);
  }, [settings.autoAlertsEnabled, settings.apiGroundingEnabled]);

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      autoAlertsEnabled: autoAlerts,
      apiGroundingEnabled: apiGrounding,
    });

    setSaveMessage("Changes applied to this session.");
  };

  const integrationItems = [
    {
      name: "CEN AI",
      description:
        "AI services are managed by the EnFarm backend.",
      icon: BrainCircuit,
      status: "Backend managed",
    },
    {
      name: "WhatsApp",
      description:
        "Farmer communication and message processing.",
      icon: MessageCircle,
      status: "Status not verified here",
    },
    {
      name: "Rover and sensors",
      description:
        "Hardware connection and field data collection.",
      icon: RadioTower,
      status: "Integration pending",
    },
  ];

  return (
    <div className="h-full min-h-full overflow-y-auto bg-[#F5F6F2] text-[#193D32]">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#71867B]">
              <Settings2 size={15} />
              Workspace configuration
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[#183D32] sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#718078]">
              Manage EnFarm preferences and review the services
              connected to the agricultural monitoring workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="text-xs text-[#54806A]">
                {saveMessage}
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-[#214F3E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#183D32]"
            >
              <Save size={16} />
              Apply changes
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">

          {/* Navigation */}
          <aside className="h-fit rounded-2xl border border-[#E4E9E1] bg-white p-3">
            <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#91A097]">
              Configuration
            </p>

            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-[#EAF2EC] text-[#214F3E]"
                        : "text-[#66766D] hover:bg-[#F5F7F3]"
                    }`}
                  >
                    <Icon size={18} />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#91A097]">
                        {item.description}
                      </span>
                    </span>

                    {active && (
                      <ChevronRight
                        size={16}
                        className="text-[#54806A]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl bg-[#F5F7F3] p-4">
              <div className="mb-2 flex items-center gap-2 text-[#54806A]">
                <Info size={15} />
                <span className="text-xs font-semibold">
                  Configuration note
                </span>
              </div>
              <p className="text-xs leading-5 text-[#78877E]">
                Some settings are preferences only. Backend
                integrations and account controls are managed
                separately.
              </p>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0">

            {activeSection === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <section className="rounded-2xl border border-[#E4E9E1] bg-white p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-[#193D32]">
                      General preferences
                    </h2>
                    <p className="mt-1 text-sm text-[#7C8981]">
                      Preferences for the EnFarm workspace.
                    </p>
                  </div>

                  <div className="divide-y divide-[#EDF0EB]">
                    <div className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#294638]">
                          Workspace language
                        </p>
                        <p className="mt-1 text-xs text-[#87938B]">
                          Language selection is not configurable here yet.
                        </p>
                      </div>
                      <span className="rounded-lg bg-[#F4F6F2] px-3 py-2 text-xs font-medium text-[#66766D]">
                        Current app language
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#294638]">
                          Regional settings
                        </p>
                        <p className="mt-1 text-xs text-[#87938B]">
                          Regional formatting is managed by the application.
                        </p>
                      </div>
                      <span className="rounded-lg bg-[#F4F6F2] px-3 py-2 text-xs font-medium text-[#66766D]">
                        Tanzania
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E4E9E1] bg-white p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-[#EAF2EC] p-3 text-[#47745A]">
                      <BrainCircuit size={22} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#193D32]">
                        CEN AI preferences
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[#7C8981]">
                        AI provider configuration, model selection and
                        service credentials are managed on the backend.
                        They are not changed from this page.
                      </p>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeSection === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <section className="rounded-2xl border border-[#E4E9E1] bg-white p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-[#193D32]">
                      Notification preferences
                    </h2>
                    <p className="mt-1 text-sm text-[#7C8981]">
                      Configure the alert preference currently supported
                      by the settings model.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-5 border-b border-[#EDF0EB] py-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-[#F0F5EB] p-2.5 text-[#63834D]">
                        <Bell size={19} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#294638]">
                          Weather alert preference
                        </p>
                        <p className="mt-1 max-w-md text-xs leading-5 text-[#87938B]">
                          Stores whether weather alerts are preferred.
                          Automated delivery is not activated by this switch.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoAlerts}
                      onClick={() => setAutoAlerts((value) => !value)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        autoAlerts ? "bg-[#47745A]" : "bg-[#D8DED8]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          autoAlerts ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-5 py-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-[#F0F5EB] p-2.5 text-[#63834D]">
                        <BrainCircuit size={19} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#294638]">
                          AI web-grounding preference
                        </p>
                        <p className="mt-1 max-w-md text-xs leading-5 text-[#87938B]">
                          Preserves the existing API grounding preference.
                          Backend enforcement is not verified by this page.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={apiGrounding}
                      onClick={() => setApiGrounding((value) => !value)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        apiGrounding ? "bg-[#47745A]" : "bg-[#D8DED8]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          apiGrounding ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </section>

                <div className="flex gap-3 rounded-xl border border-[#E7EBDD] bg-[#F0F4E9] p-4">
                  <Info size={18} className="mt-0.5 shrink-0 text-[#71875B]" />
                  <p className="text-xs leading-5 text-[#687B5D]">
                    These preferences are currently held in application
                    state. They are not persistent across a page refresh,
                    and they do not independently send WhatsApp or email
                    notifications.
                  </p>
                </div>
              </motion.div>
            )}

            {activeSection === "integrations" && (
              <motion.div
                key="integrations"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <section className="rounded-2xl border border-[#E4E9E1] bg-white p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-[#193D32]">
                      Connected services
                    </h2>
                    <p className="mt-1 text-sm text-[#7C8981]">
                      Integration information. These labels do not represent
                      live connection checks.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {integrationItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.name}
                          className="flex flex-col gap-4 rounded-xl border border-[#E9EDE7] p-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="rounded-xl bg-[#EEF3ED] p-3 text-[#47745A]">
                              <Icon size={21} />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#294638]">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-[#87938B]">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <span className="w-fit rounded-lg bg-[#F3F5F1] px-3 py-2 text-[11px] font-semibold text-[#718078]">
                            {item.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E4E9E1] bg-white p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-[#F0F3ED] p-3 text-[#718078]">
                      <Server size={21} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#294638]">
                        Backend configuration
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#87938B]">
                        API keys, service credentials and provider settings
                        should remain on the server. They should never be
                        displayed as editable browser settings.
                      </p>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeSection === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <section className="rounded-2xl border border-[#E4E9E1] bg-white p-6 sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-[#F0F3ED] p-3 text-[#718078]">
                      <LockKeyhole size={21} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#193D32]">
                        Account and security
                      </h2>
                      <p className="mt-1 text-sm text-[#7C8981]">
                        Access management for the EnFarm workspace.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E9EDE7] p-5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#D5A34A]" />
                      <p className="text-sm font-semibold text-[#294638]">
                        Authentication not configured
                      </p>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#7C8981]">
                      Login and officer account management are planned
                      for a later development phase. No account controls
                      are available here yet.
                    </p>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E4E9E1] bg-white p-6 sm:p-8">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={21}
                      className="mt-0.5 text-[#47745A]"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-[#294638]">
                        Data protection
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#87938B]">
                        Production access controls and database security
                        rules must be configured before EnFarm is used
                        with real operational accounts.
                      </p>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </main>
        </div>

        {/* Footer */}
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#E2E8E0] py-5 text-xs text-[#8A978F] sm:flex-row">
          <span>EnFarm · Agricultural monitoring workspace</span>
          <span>Settings configuration</span>
        </footer>
      </div>
    </div>
  );
};

export default SettingsView;
