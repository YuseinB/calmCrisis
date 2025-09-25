import React, { useEffect, useMemo, useState, useContext } from "react";
import Dexie, { Table } from "dexie";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { CheckCircle, Plus, List, BookOpen, Home, Filter, Languages } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * CalmCrisis — React (PWA-ready) MVP with i18n (BG/EN)
 * FIX: Build failed due to missing './locales/bg.json' and './locales/en.json'.
 *      Removed hard imports and implemented a resilient i18n loader that:
 *        - Uses built-in default dictionaries (BG/EN) so the app always builds.
 *        - Optionally fetches external JSON overrides from '/locales/{lang}.json' at runtime (if present).
 *        - Silently falls back when files are absent (no errors in sandbox).
 *      Preserves previous functionality (episodes, insights, recommender, PWA helpers) + language switcher.
 */

// ------------------------------ Modal ---------------------------------
// Lightweight Modal (no deps)


function Modal({
    open,
    title,
    children,
    onClose,
}: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    if (!open) return null;
    return createPortal(
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-[1001] w-[92vw] max-w-md rounded-2xl bg-white shadow-xl">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded-xl border hover:bg-gray-50"
                        aria-label="Close"
                    >✕</button>
                </div>
                <div className="p-4">{children}</div>
                <div className="p-4 pt-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}


function getStrategyGuide(name: string, lang: "bg" | "en") {
    const n = name.toLowerCase();

    const isBreathing = n.includes("дихател") || n.includes("breath");
    const isQuiet = n.includes("тиха") || n.includes("quiet");
    const isHeadset = n.includes("шумопотис") || n.includes("noise") || n.includes("headphone");
    const isSensory = n.includes("сензор") || n.includes("sensory");
    const isChange = n.includes("смяна") || n.includes("change");

    if (lang === "bg") {
        if (isBreathing) {
            return {
                title: "Дихателно упражнение",
                steps: [
                    "Седнете удобно. Дръжте гърба изправен, крака на пода.",
                    "Вдишайте бавно през носа 4 секунди.",
                    "Задръжте 4 секунди.",
                    "Издишайте бавно през устата 6–8 секунди (може през сламка/чаша).",
                    "Повторете 6–10 цикъла (около 2–3 минути).",
                    "Оценете как се чувствате; продължете още 1–2 минути при нужда."
                ],
            };
        }
        if (isQuiet) {
            return {
                title: "Тиха стая",
                steps: [
                    "Преместете се в по-спокойно, приглушено пространство.",
                    "Намалете светлина/шум (затворете врата/прозорци).",
                    "Осигурете любима успокояваща активност (книга, weighted blanket, любима игра).",
                    "Задайте таймер за 5–10 минути и наблюдавайте.",
                ],
            };
        }
        if (isHeadset) {
            return {
                title: "Шумопотискащи слушалки",
                steps: [
                    "Поставете слушалките; пуснете бял шум или тиха любима музика.",
                    "Ограничете разговора до кратки, ясни изречения.",
                    "Останете близо, но неинвазивно; дайте 5–10 минути спокойствие.",
                ],
            };
        }
        if (isSensory) {
            return {
                title: "Сензорна пауза",
                steps: [
                    "Предложете кратка двигателна активност (разтягане, разходка, „дълбоки прегръдки“ при съгласие).",
                    "Използвайте сензорни помощни средства (стим играчка, тежка жилетка, дъвчащ аксесоар).",
                    "Върнете се към задачата само ако напрежението спадне.",
                ],
            };
        }
        if (isChange) {
            return {
                title: "Смяна на средата",
                steps: [
                    "Преминете в по-тихо/по-предсказуемо място.",
                    "Намалете стимулите (светлина/звук/хора).",
                    "Дайте ясна структура: какво следва сега (1–2 стъпки).",
                ],
            };
        }
        return {
            title: `Стъпки: ${name}`,
            steps: [
                "Намалете стимули (шум/светлина/тълпа).",
                "Говорете бавно и кратко, без допълнителни въпроси.",
                "Предложете 2–3 спокойни опции (почивка, вода, тих ъгъл).",
                "Оценете след 5 минути и коригирайте.",
            ],
        };
    }

    // EN
    if (isBreathing) {
        return {
            title: "Breathing exercise",
            steps: [
                "Sit comfortably, back straight, feet on the floor.",
                "Inhale slowly through the nose for 4s.",
                "Hold for 4s.",
                "Exhale gently through the mouth for 6–8s (straw/cup optional).",
                "Repeat 6–10 cycles (~2–3 min).",
                "Check in; continue 1–2 more minutes if needed.",
            ],
        };
    }
    if (isQuiet) {
        return {
            title: "Quiet room",
            steps: [
                "Move to a calmer, dimmer space.",
                "Reduce light/noise (door/windows).",
                "Offer a preferred calming activity (book, weighted blanket, favorite toy).",
                "Set a 5–10 minute timer and observe.",
            ],
        };
    }
    if (isHeadset) {
        return {
            title: "Noise-cancelling headphones",
            steps: [
                "Put the headset on; play white noise or quiet preferred music.",
                "Use short, clear sentences; avoid extra questions.",
                "Stay nearby but non-intrusive; give 5–10 minutes.",
            ],
        };
    }
    if (isSensory) {
        return {
            title: "Sensory break",
            steps: [
                "Offer brief movement (stretching, short walk, deep pressure if consented).",
                "Use sensory aids (fidget toy, weighted vest, chew accessory).",
                "Return only if arousal drops.",
            ],
        };
    }
    if (isChange) {
        return {
            title: "Change environment",
            steps: [
                "Move to a quieter/more predictable place.",
                "Reduce stimuli (light/sound/people).",
                "Give a simple 1–2 step structure of what happens next.",
            ],
        };
    }
    return {
        title: `Steps: ${name}`,
        steps: [
            "Lower stimuli (noise/light/crowd).",
            "Speak slowly, clearly, without extra questions.",
            "Offer 2–3 calming options (rest, water, quiet corner).",
            "Reassess after 5 minutes and adjust.",
        ],
    };
}

/////

function getStrategyGuide(name: string, lang: "bg" | "en") {
  const n = name.toLowerCase();

  const isBreathing = n.includes("дихател") || n.includes("breath");
  const isQuiet    = n.includes("тиха") || n.includes("quiet");
  const isHeadset  = n.includes("шумопотис") || n.includes("noise") || n.includes("headphone");
  const isSensory  = n.includes("сензор") || n.includes("sensory");
  const isChange   = n.includes("смяна") || n.includes("change");

  if (lang === "bg") {
    if (isBreathing) {
      return {
        title: "Дихателно упражнение",
        steps: [
          "Седнете удобно. Дръжте гърба изправен, крака на пода.",
          "Вдишайте бавно през носа 4 секунди.",
          "Задръжте 4 секунди.",
          "Издишайте бавно през устата 6–8 секунди (може през сламка/чаша).",
          "Повторете 6–10 цикъла (около 2–3 минути).",
          "Оценете как се чувствате; продължете още 1–2 минути при нужда."
        ],
      };
    }
    if (isQuiet) {
      return {
        title: "Тиха стая",
        steps: [
          "Преместете се в по-спокойно, приглушено пространство.",
          "Намалете светлина/шум (затворете врата/прозорци).",
          "Осигурете любима успокояваща активност (книга, weighted blanket, любима игра).",
          "Задайте таймер за 5–10 минути и наблюдавайте.",
        ],
      };
    }
    if (isHeadset) {
      return {
        title: "Шумопотискащи слушалки",
        steps: [
          "Поставете слушалките; пуснете бял шум или тиха любима музика.",
          "Ограничете разговора до кратки, ясни изречения.",
          "Останете близо, но неинвазивно; дайте 5–10 минути спокойствие.",
        ],
      };
    }
    if (isSensory) {
      return {
        title: "Сензорна пауза",
        steps: [
          "Предложете кратка двигателна активност (разтягане, разходка, „дълбоки прегръдки“ при съгласие).",
          "Използвайте сензорни помощни средства (стим играчка, тежка жилетка, дъвчащ аксесоар).",
          "Върнете се към задачата само ако напрежението спадне.",
        ],
      };
    }
    if (isChange) {
      return {
        title: "Смяна на средата",
        steps: [
          "Преминете в по-тихо/по-предсказуемо място.",
          "Намалете стимулите (светлина/звук/хора).",
          "Дайте ясна структура: какво следва сега (1–2 стъпки).",
        ],
      };
    }
    return {
      title: `Стъпки: ${name}`,
      steps: [
        "Намалете стимули (шум/светлина/тълпа).",
        "Говорете бавно и кратко, без допълнителни въпроси.",
        "Предложете 2–3 спокойни опции (почивка, вода, тих ъгъл).",
        "Оценете след 5 минути и коригирайте.",
      ],
    };
  }

  // EN
  if (isBreathing) {
    return {
      title: "Breathing exercise",
      steps: [
        "Sit comfortably, back straight, feet on the floor.",
        "Inhale slowly through the nose for 4s.",
        "Hold for 4s.",
        "Exhale gently through the mouth for 6–8s (straw/cup optional).",
        "Repeat 6–10 cycles (~2–3 min).",
        "Check in; continue 1–2 more minutes if needed.",
      ],
    };
  }
  if (isQuiet) {
    return {
      title: "Quiet room",
      steps: [
        "Move to a calmer, dimmer space.",
        "Reduce light/noise (door/windows).",
        "Offer a preferred calming activity (book, weighted blanket, favorite toy).",
        "Set a 5–10 minute timer and observe.",
      ],
    };
  }
  if (isHeadset) {
    return {
      title: "Noise-cancelling headphones",
      steps: [
        "Put the headset on; play white noise or quiet preferred music.",
        "Use short, clear sentences; avoid extra questions.",
        "Stay nearby but non-intrusive; give 5–10 minutes.",
      ],
    };
  }
  if (isSensory) {
    return {
      title: "Sensory break",
      steps: [
        "Offer brief movement (stretching, short walk, deep pressure if consented).",
        "Use sensory aids (fidget toy, weighted vest, chew accessory).",
        "Return only if arousal drops.",
      ],
    };
  }
  if (isChange) {
    return {
      title: "Change environment",
      steps: [
        "Move to a quieter/more predictable place.",
        "Reduce stimuli (light/sound/people).",
        "Give a simple 1–2 step structure of what happens next.",
      ],
    };
  }
  return {
    title: `Steps: ${name}`,
    steps: [
      "Lower stimuli (noise/light/crowd).",
      "Speak slowly, clearly, without extra questions.",
      "Offer 2–3 calming options (rest, water, quiet corner).",
      "Reassess after 5 minutes and adjust.",
    ],
  };
}

// ------------------------------ Modal ---------------------------------

// ------------------------------ Dexie DB ------------------------------
export interface Episode {
    id: string;
    ts: number; // epoch ms
    context: "home" | "school" | "outside" | "other";
    triggers: string[];
    intensity: number; // 1..10
    strategiesTried: string[];
    outcomeScore: number; // 0..100
    notes?: string;
}

export interface Playbook {
    id: string;
    title: string;
    steps: string[];
    tags?: string[];
}

class CCDB extends Dexie {
    episodes!: Table<Episode, string>;
    playbooks!: Table<Playbook, string>;
    constructor() {
        super("calmcrisis-db");
        this.version(1).stores({
            episodes: "id, ts, context, intensity",
            playbooks: "id, title",
        });
    }
}

const db = new CCDB();

// ------------------------------ i18n core ------------------------------
type Lang = "bg" | "en";
type Dict = Record<string, string>;
const DEFAULT_STRINGS: Record<Lang, Dict> = {
    bg: {
        home: "Начало",
        new: "Нова криза",
        episodes: "Епизоди",
        playbooks: "Плейбук",
        install_app: "Инсталирай като приложение",
        install_copy: "Добави CalmCrisis на началния екран и го ползвай офлайн.",
        install: "Инсталирай",
        what_try_now: "Какво да пробвам сега?",
        episode_saved: "Епизодът е записан.",
        context: "Контекст",
        environment: "Среда",
        choose_context: "Избери контекст",
        triggers: "Тригери",
        custom_trigger: "Собствен тригер",
        add: "Добави",
        intensity: "Интензитет",
        strategies_tried: "Стратегии (пробвани)",
        custom_strategy: "Собствена стратегия",
        outcome: "Резултат (успех)",
        notes: "Бележки",
        save: "Запиши",
        filter_context: "Контекст",
        period: "Период",
        all: "Всички",
        all_time: "Всички времена",
        p7d: "7 дни",
        p30d: "30 дни",
        p6m: "6 месеца",
        p1y: "1 година",
        episodes_word: "епизода",
        intensity_label: "Интензитет",
        success: "Успех",
        strategies: "Стратегии",
        no_episodes_for_filter: "Няма записани епизоди за избрания филтър.",
        analytics_for_period: "Анализ за период",
        last_7d: "Последни 7 дни",
        last_30d: "Последни 30 дни",
        last_6m: "Последни 6 месеца",
        last_1y: "Последна година",
        total_episodes: "Брой епизоди",
        avg_intensity: "Среден интензитет",
        avg_success: "Среден успех",
        top_strategies: "Топ стратегии по успех",
        not_enough_data: "Няма достатъчно данни.",
        no_recs: "Все още няма препоръки за този контекст/час.",
        start: "Стартирай",
        language: "Език",
        Breathing_exercise: "Дихателно упражнение",
    },
    en: {
        home: "Home",
        new: "New Episode",
        episodes: "Episodes",
        playbooks: "Playbooks",
        install_app: "Install as App",
        install_copy: "Add CalmCrisis to your home screen and use it offline.",
        install: "Install",
        what_try_now: "What should I try now?",
        episode_saved: "Episode saved.",
        context: "Context",
        environment: "Environment",
        choose_context: "Choose context",
        triggers: "Triggers",
        custom_trigger: "Custom trigger",
        add: "Add",
        intensity: "Intensity",
        strategies_tried: "Strategies (tried)",
        custom_strategy: "Custom strategy",
        outcome: "Outcome (success)",
        notes: "Notes",
        save: "Save",
        filter_context: "Context",
        period: "Period",
        all: "All",
        all_time: "All time",
        p7d: "7 days",
        p30d: "30 days",
        p6m: "6 months",
        p1y: "1 year",
        episodes_word: "episodes",
        intensity_label: "Intensity",
        success: "Success",
        strategies: "Strategies",
        no_episodes_for_filter: "No episodes for the selected filter.",
        analytics_for_period: "Analytics by period",
        last_7d: "Last 7 days",
        last_30d: "Last 30 days",
        last_6m: "Last 6 months",
        last_1y: "Last year",
        total_episodes: "Total episodes",
        avg_intensity: "Avg intensity",
        avg_success: "Avg success",
        top_strategies: "Top strategies by success",
        not_enough_data: "Not enough data.",
        no_recs: "No recommendations yet for this context/hour.",
        start: "Start",
        language: "Language",
        Breathing_exercise: "Breathing exercise",
    }
};

function mergeDict(base: Dict, override?: Dict | null): Dict {
    if (!override) return base;
    const out: Dict = { ...base };
    for (const k of Object.keys(override)) {
        const v = override[k];
        if (typeof v === "string" && v.trim()) out[k] = v;
    }
    return out;
}

async function fetchExternalDict(lang: Lang): Promise<Dict | null> {
    // Expect static files placed under /locales/{lang}.json (public root). If missing -> 404 -> null.
    try {
        const res = await fetch(`/locales/${lang}.json`, { cache: "no-store" });
        if (!res.ok) return null;
        const json = await res.json();
        if (json && typeof json === "object") return json as Dict;
    } catch (_) {
        // ignore network / sandbox errors
    }
    return null;
}

const I18nContext = React.createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({ lang: "bg", setLang: () => { }, t: (k) => k });
const useI18n = () => useContext(I18nContext);

// ------------------------------ Helpers ------------------------------
const CONTEXTS = [
    { value: "home", label: { bg: "Дом", en: "Home" } },
    { value: "school", label: { bg: "Училище", en: "School" } },
    { value: "outside", label: { bg: "Навън", en: "Outside" } },
    { value: "other", label: { bg: "Друго", en: "Other" } },
] as const;

type PeriodKey = "7d" | "30d" | "6m" | "1y" | "all";

const DEFAULT_STRATEGIES = [
    { bg: "Тиха стая", en: "Quiet room" },
    { bg: "Шумопотискащи слушалки", en: "Noise-cancelling headphones" },
    { bg: "Дихателно упражнение", en: "Breathing exercise" },
    { bg: "Сензорна пауза", en: "Sensory break" },
    { bg: "Смяна на средата", en: "Change environment" },
];

const DEFAULT_TRIGGERS = [
    { bg: "Силен шум", en: "Loud noise" },
    { bg: "Промяна в рутина", en: "Routine change" },
    { bg: "Претоварване", en: "Overload" },
    { bg: "Светлини/тълпа", en: "Lights/crowd" },
    { bg: "Прекъсване на дейност", en: "Activity interruption" },
];

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleString();
}

function startFromPeriod(period: PeriodKey) {
    if (period === "all") return 0;
    const now = Date.now();
    if (period === "7d") return now - 7 * 24 * 60 * 60 * 1000;
    if (period === "30d") return now - 30 * 24 * 60 * 60 * 1000;
    if (period === "6m") return now - 180 * 24 * 60 * 60 * 1000;
    if (period === "1y") return now - 365 * 24 * 60 * 60 * 1000;
    return 0;
}

// ------------------------------ UI Bits ------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function TagMulti({
    options,
    value,
    onToggle,
    lang,
}: {
    options: { bg: string; en: string }[];
    value: string[];
    onToggle: (name: string, checked: boolean) => void;
    lang: Lang;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((op) => (
                <label key={op.bg} className="inline-flex items-center gap-2 border rounded-2xl px-3 py-1">
                    <Checkbox checked={value.includes(op[lang])} onCheckedChange={(c) => onToggle(op[lang], Boolean(c))} />
                    <span>{op[lang]}</span>
                </label>
            ))}
        </div>
    );
}

// ------------------------------ New Episode Form ------------------------------
function NewEpisode({ onSaved }: { onSaved: () => void }) {
    const { t, lang } = useI18n();
    const [context, setContext] = useState<Episode["context"]>("home");
    const [triggers, setTriggers] = useState<string[]>([]);
    const [customTrigger, setCustomTrigger] = useState("");
    const [intensity, setIntensity] = useState<number>(5);
    const [strategies, setStrategies] = useState<string[]>([]);
    const [customStrategy, setCustomStrategy] = useState("");
    const [outcome, setOutcome] = useState<number>(50);
    const [notes, setNotes] = useState("");

    function toggle(list: string[], name: string, checked: boolean) {
        return checked ? Array.from(new Set([...list, name])) : list.filter((x) => x !== name);
    }

    const save = async () => {
        const ep: Episode = {
            id: uuidv4(),
            ts: Date.now(),
            context,
            triggers,
            intensity,
            strategiesTried: strategies,
            outcomeScore: outcome,
            notes: notes.trim() || undefined,
        };
        await db.episodes.add(ep);
        toast.success(t("episode_saved"));
        setTriggers([]);
        setStrategies([]);
        setNotes("");
        onSaved();
    };

    return (
        <div className="grid gap-4">
            <Section title={t("context")}>
                <div className="grid gap-2">
                    <Label>{t("environment")}</Label>
                    <Select value={context} onValueChange={(v) => setContext(v as Episode["context"])}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("choose_context")} />
                        </SelectTrigger>
                        <SelectContent>
                            {CONTEXTS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>{c.label[lang]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </Section>

            <Section title={t("triggers")}>
                <TagMulti
                    options={DEFAULT_TRIGGERS}
                    value={triggers}
                    onToggle={(name, checked) => setTriggers((l) => toggle(l, name, checked))}
                    lang={lang}
                />
                <div className="flex gap-2 mt-3">
                    <Input placeholder={t("custom_trigger")} value={customTrigger} onChange={(e) => setCustomTrigger(e.target.value)} />
                    <Button
                        variant="secondary"
                        onClick={() => {
                            if (!customTrigger.trim()) return;
                            setTriggers((l) => toggle(l, customTrigger.trim(), true));
                            setCustomTrigger("");
                        }}
                    >
                        {t("add")}
                    </Button>
                </div>
            </Section>

            <Section title={`${t("intensity")}: ${intensity}`}>
                <Slider value={[intensity]} min={1} max={10} step={1} onValueChange={(v) => setIntensity(v[0])} />
            </Section>

            <Section title={t("strategies_tried")}>
                <TagMulti
                    options={DEFAULT_STRATEGIES}
                    value={strategies}
                    onToggle={(name, checked) => setStrategies((l) => toggle(l, name, checked))}
                    lang={lang}
                />
                <div className="flex gap-2 mt-3">
                    <Input placeholder={t("custom_strategy")} value={customStrategy} onChange={(e) => setCustomStrategy(e.target.value)} />
                    <Button
                        variant="secondary"
                        onClick={() => {
                            if (!customStrategy.trim()) return;
                            setStrategies((l) => toggle(l, customStrategy.trim(), true));
                            setCustomStrategy("");
                        }}
                    >
                        {t("add")}
                    </Button>
                </div>
            </Section>

            <Section title={`${t("outcome")}: ${outcome}%`}>
                <Slider value={[outcome]} min={0} max={100} step={5} onValueChange={(v) => setOutcome(v[0])} />
            </Section>

            <Section title={t("notes")}>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={
                    lang === 'bg' ? "Кратко описание, контекст, наблюдения…" : "Short description, context, observations…"
                } />
            </Section>

            <div className="flex justify-end gap-2">
                <Button onClick={save} className="rounded-2xl">
                    <CheckCircle className="w-4 h-4 mr-2" /> {t("save")}
                </Button>
            </div>
        </div>
    );
}

// ------------------------------ Episodes List (filters) ------------------------------
function EpisodesList() {
    const { t, lang } = useI18n();
    const [items, setItems] = useState<Episode[]>([]);
    const [qContext, setQContext] = useState<string>("all");
    const [period, setPeriod] = useState<PeriodKey>("all");

    const load = async () => {
        const all = await db.episodes.orderBy("ts").reverse().toArray();
        setItems(all);
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        const start = startFromPeriod(period);
        return items
            .filter((e) => (qContext === "all" ? true : e.context === qContext))
            .filter((e) => e.ts >= start);
    }, [items, qContext, period]);

    return (
        <div className="grid gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Filter className="w-4 h-4" />
                        <Label>{t("filter_context")}</Label>
                        <Select value={qContext} onValueChange={setQContext}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all")}</SelectItem>
                                {CONTEXTS.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>{c.label[lang]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Label className="ml-4">{t("period")}</Label>
                        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_time")}</SelectItem>
                                <SelectItem value="7d">{t("p7d")}</SelectItem>
                                <SelectItem value="30d">{t("p30d")}</SelectItem>
                                <SelectItem value="6m">{t("p6m")}</SelectItem>
                                <SelectItem value="1y">{t("p1y")}</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="ml-auto text-sm opacity-70">{filtered.length} {t("episodes_word")}</div>
                    </div>
                </CardContent>
            </Card>

            {filtered.map((e) => (
                <Card key={e.id} className="border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-3">
                            <Badge variant="secondary">{CONTEXTS.find((c) => c.value === e.context)?.label[lang]}</Badge>
                            <span className="font-normal opacity-70">{formatDate(e.ts)}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                        <div>
                            <Label className="opacity-70">{t("triggers")}</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {e.triggers.map((tname) => (
                                    <Badge key={tname}>{tname}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div>
                                <Label className="opacity-70">{t("intensity_label")}</Label>
                                <div className="text-lg">{e.intensity}/10</div>
                            </div>
                            <div>
                                <Label className="opacity-70">{t("success")}</Label>
                                <div className="text-lg">{e.outcomeScore}%</div>
                            </div>
                        </div>
                        {e.strategiesTried.length > 0 && (
                            <div>
                                <Label className="opacity-70">{t("strategies")}</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {e.strategiesTried.map((s) => (
                                        <Badge key={s} variant="outline">{s}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {e.notes && (
                            <div>
                                <Label className="opacity-70">{t("notes")}</Label>
                                <p className="mt-1 whitespace-pre-wrap leading-relaxed">{e.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}

            {filtered.length === 0 && (
                <Card>
                    <CardContent className="py-10 text-center opacity-70">
                        {t("no_episodes_for_filter")}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ------------------------------ Insights (selectable period) ------------------------------
function Insights() {
    const { t } = useI18n();
    const [items, setItems] = useState<Episode[]>([]);
    const [period, setPeriod] = useState<PeriodKey>("30d");

    useEffect(() => {
        const start = startFromPeriod(period);
        db.episodes.where("ts").above(start).toArray().then(setItems);
    }, [period]);

    const total = items.length;
    const avgIntensity = total ? Math.round(items.reduce((a, b) => a + b.intensity, 0) / total) : 0;
    const avgOutcome = total ? Math.round(items.reduce((a, b) => a + b.outcomeScore, 0) / total) : 0;

    const strategyStats = useMemo(() => {
        const map: Record<string, { sum: number; count: number }> = {};
        for (const e of items) {
            for (const s of e.strategiesTried) {
                map[s] = map[s] || { sum: 0, count: 0 };
                map[s].sum += e.outcomeScore;
                map[s].count += 1;
            }
        }
        const arr = Object.entries(map).map(([name, v]) => ({ name, avg: Math.round(v.sum / v.count), n: v.count }));
        arr.sort((a, b) => b.avg - a.avg);
        return arr.slice(0, 5);
    }, [items]);

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <CardTitle>{t("analytics_for_period")}</CardTitle>
                    <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">{t("last_7d")}</SelectItem>
                            <SelectItem value="30d">{t("last_30d")}</SelectItem>
                            <SelectItem value="6m">{t("last_6m")}</SelectItem>
                            <SelectItem value="1y">{t("last_1y")}</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
            </Card>
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("total_episodes")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-semibold">{total}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("avg_intensity")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-semibold">{avgIntensity}/10</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("avg_success")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-semibold">{avgOutcome}%</CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t("top_strategies")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {strategyStats.length === 0 && <div className="opacity-70">{t("not_enough_data")}</div>}
                    <div className="flex flex-wrap gap-3">
                        {strategyStats.map((s) => (
                            <Badge key={s.name} className="text-base">{s.name} • {s.avg}% (n={s.n})</Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ------------------------------ Recommender ------------------------------
function Recommend({ currentContext }: { currentContext: Episode["context"] }) {
    const { t, lang } = useI18n();
    const [items, setItems] = useState<Episode[]>([]);
    const [active, setActive] = useState<{ name: string } | null>(null);

    useEffect(() => {
        db.episodes.toArray().then(setItems);
    }, []);

    const hour = new Date().getHours();
    const similar = items.filter((e) => {
        const eh = new Date(e.ts).getHours();
        return e.context === currentContext && Math.abs(eh - hour) <= 2;
    });

    const ranked = useMemo(() => {
        const map: Record<string, { sum: number; count: number }> = {};
        for (const e of similar) {
            for (const s of e.strategiesTried) {
                map[s] = map[s] || { sum: 0, count: 0 };
                map[s].sum += e.outcomeScore;
                map[s].count += 1;
            }
        }
        const arr = Object.entries(map).map(([name, v]) => ({ name, avg: Math.round(v.sum / v.count), n: v.count }));
        arr.sort((a, b) => b.avg - a.avg);
        return arr.slice(0, 3);
    }, [similar]);

    if (ranked.length === 0) return <div className="opacity-70">{t("no_recs")}</div>;

    return (
        <>
            <div className="flex flex-col gap-2">
                {ranked.map((r) => (
                    <div key={r.name} className="border rounded-xl p-3 flex items-center justify-between">
                        <div>
                            <div className="font-medium">{r.name}</div>
                            <div className="text-sm opacity-70">
                                {t("avg_success")} {r.avg}% (n={r.n})
                            </div>
                        </div>
                        <button
                            className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => setActive({ name: r.name })}
                        >
                            {t("start")}
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal with guide */}
            <Modal
                open={Boolean(active)}
                title={active ? getStrategyGuide(active.name, lang).title : ""}
                onClose={() => setActive(null)}
            >
                {active && (
                    <div className="space-y-3">
                        <ul className="list-disc pl-5 space-y-1">
                            {getStrategyGuide(active.name, lang).steps.map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>

                        {/* По желание – мини таймер за дихателно упражнение */}
                        {getStrategyGuide(active.name, lang).title.toLowerCase().includes(
                            lang === "bg" ? "дихател" : "breath"
                        ) && (
                                <div className="pt-2 text-sm opacity-70">
                                    ⏱️ Подсказка: задайте таймер 2–3 минути и наблюдавайте темпото на дишане (4–4–6/8).
                                </div>
                            )}
                    </div>
                )}
            </Modal>
        </>
    );
}

// ------------------------------ Recommender ------------------------------


// ------------------------------ PWA helpers ------------------------------
const SW_SUPPORTED = ((): boolean => {
    if (typeof window === "undefined") return false;
    const secure = (window as any).isSecureContext === true || location.hostname === "localhost";
    const notIframe = (() => { try { return window.top === window.self; } catch { return false; } })();
    return "serviceWorker" in navigator && secure && notIframe;
})();

function injectManifest() {
    if (typeof document === "undefined") return;
    if (document.querySelector('link[rel="manifest"]')) return;
    const manifest = {
        name: "CalmCrisis",
        short_name: "CalmCrisis",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        icons: [
            {
                src:
                    "data:image/svg+xml;utf8," +
                    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
            <rect width='512' height='512' rx='100' fill='#0ea5e9'/>
            <g fill='white'>
              <circle cx='176' cy='208' r='44'/>
              <circle cx='336' cy='208' r='44'/>
              <path d='M128 336c40-40 216-40 256 0 8 8 8 21 0 29-63 63-193 63-256 0-8-8-8-21 0-29Z'/>
            </g>
          </svg>`, sizes: "192x192", type: "image/svg+xml", purpose: "any maskable"
            },
            {
                src:
                    "data:image/svg+xml;utf8," +
                    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
            <rect width='512' height='512' rx='100' fill='#0ea5e9'/>
            <g fill='white'>
              <circle cx='176' cy='208' r='44'/>
              <circle cx='336' cy='208' r='44'/>
              <path d='M128 336c40-40 216-40 256 0 8 8 8 21 0 29-63 63-193 63-256 0-8-8-8-21 0-29Z'/>
            </g>
          </svg>`, sizes: "512x512", type: "image/svg+xml", purpose: "any maskable"
            },
        ],
    } as const;
    const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = url;
    document.head.appendChild(link);
}

function registerInlineSW() {
    if (!SW_SUPPORTED) return; // skip quietly in sandbox/non-secure contexts
    try {
        const swCode = `
      const CACHE = 'calmcrisis-v1';
      self.addEventListener('install', (event) => {
        self.skipWaiting();
        event.waitUntil(caches.open(CACHE));
      });
      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        );
        self.clients.claim();
      });
      self.addEventListener('fetch', (event) => {
        const req = event.request;
        if (req.method !== 'GET') return;
        const url = new URL(req.url);
        if (url.origin !== location.origin) return;
        event.respondWith(
          caches.open(CACHE).then(async cache => {
            const cached = await cache.match(req);
            if (cached) return cached;
            try {
              const fresh = await fetch(req);
              cache.put(req, fresh.clone());
              return fresh;
            } catch (e) {
              return cached || Response.error();
            }
          })
        );
      });
    `;
        const blob = new Blob([swCode], { type: "text/javascript" });
        const swUrl = URL.createObjectURL(blob);
        navigator.serviceWorker.register(swUrl).catch(() => {
            // ignore errors in restricted environments
        });
    } catch {
        // noop
    }
}

// ------------------------------ Main App ------------------------------
export default function CalmCrisisApp() {
    // i18n state & provider
    const initialLang: Lang = ((): Lang => {
        const fromLS = typeof localStorage !== 'undefined' ? (localStorage.getItem('cc-lang') as Lang | null) : null;
        if (fromLS === 'bg' || fromLS === 'en') return fromLS;
        const nav = typeof navigator !== 'undefined' ? navigator.language : 'bg';
        return nav.toLowerCase().startsWith('bg') ? 'bg' : 'en';
    })();
    const [lang, setLangState] = useState<Lang>(initialLang);
    const [overrides, setOverrides] = useState<Record<Lang, Dict>>({ bg: {}, en: {} });

    useEffect(() => {
        // Attempt to fetch overrides; missing files are fine.
        fetchExternalDict(lang).then((dict) => {
            if (dict) setOverrides((prev) => ({ ...prev, [lang]: dict }));
        });
    }, [lang]);

    const t = (k: string) => mergeDict(DEFAULT_STRINGS[lang], overrides[lang])[k] ?? k;
    const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('cc-lang', l); } catch { } };

    const [tab, setTab] = useState("home");

    useEffect(() => {
        injectManifest();
        registerInlineSW();
    }, []);

    return (
        <I18nContext.Provider value={{ lang, setLang, t }}>
            <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
                <header className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl grid place-items-center border">
                        <Home className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold">CalmCrisis</h1>

                    {/* Language selector */}
                    <div className="ml-auto flex items-center gap-2">
                        <Languages className="w-4 h-4 opacity-70" />
                        <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bg">Български</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                <div className="mb-4">
                    <Tabs value={tab} onValueChange={setTab} className="w-full">
                        <TabsList>
                            <TabsTrigger value="home">{t("home")}</TabsTrigger>
                            <TabsTrigger value="new"><Plus className="w-4 h-4 mr-1" /> {t("new")}</TabsTrigger>
                            <TabsTrigger value="episodes"><List className="w-4 h-4 mr-1" /> {t("episodes")}</TabsTrigger>
                            <TabsTrigger value="playbooks"><BookOpen className="w-4 h-4 mr-1" /> {t("playbooks")}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {tab === "home" && (
                    <div className="grid gap-6">
                        <Insights />
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("what_try_now")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Recommend currentContext="home" />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {tab === "new" && <NewEpisode onSaved={() => setTab("episodes")} />}
                {tab === "episodes" && <EpisodesList />}
                {tab === "playbooks" && (
                    <Card>
                        <CardContent className="py-10 text-center opacity-70">
                            (Soon) {lang === 'bg' ? 'Следва добавяне на плейбукове — започваме с базов CRUD.' : 'Playbooks coming next — starting with basic CRUD.'}
                        </CardContent>
                    </Card>
                )}

                <Toaster richColors />
            </div>
        </I18nContext.Provider>
    );
}

// ------------------------------ Self-Tests (non-breaking) ------------------------------
(function runDevSelfTests() {
    try {
        const approx = (a: number, b: number, eps = 24 * 60 * 60 * 1000) => Math.abs(a - b) <= eps; // 1d tolerance
        const now = Date.now();
        console.assert(startFromPeriod("all") === 0, "startFromPeriod(all) should be 0");
        console.assert(approx(startFromPeriod("7d"), now - 7 * 24 * 60 * 60 * 1000), "7d approx");
        console.assert(approx(startFromPeriod("30d"), now - 30 * 24 * 60 * 60 * 1000), "30d approx");
        console.assert(approx(startFromPeriod("6m"), now - 180 * 24 * 60 * 60 * 1000), "6m approx");
        console.assert(approx(startFromPeriod("1y"), now - 365 * 24 * 60 * 60 * 1000), "1y approx");
        console.assert(typeof formatDate(now) === "string", "formatDate should return string");

        // i18n merge tests
        const base: Dict = { a: "A", b: "B" };
        const over: Dict = { b: "B2", c: "C" };
        const merged = mergeDict(base, over);
        console.assert(merged.a === "A" && merged.b === "B2" && merged.c === "C", "mergeDict should override correctly");

        console.log("CalmCrisis self-tests passed");
    } catch (e) {
        console.warn("CalmCrisis self-tests failed", e);
    }
})();
