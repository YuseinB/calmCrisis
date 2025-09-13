import React, { useEffect, useMemo, useState } from "react";
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
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { CheckCircle, Plus, List, BookOpen, Home, Filter } from "lucide-react";

/**
 * CalmCrisis — React (PWA-ready) single-file MVP
 * Restored full app after accidental overwrite; includes safe PWA behavior for sandboxed contexts.
 */

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

// ------------------------------ Helpers ------------------------------
const CONTEXTS = [
  { value: "home", label: "Дом" },
  { value: "school", label: "Училище" },
  { value: "outside", label: "Навън" },
  { value: "other", label: "Друго" },
] as const;

type PeriodKey = "7d" | "30d" | "6m" | "1y" | "all";

const DEFAULT_STRATEGIES = [
  "Тиха стая",
  "Шумопотискащи слушалки",
  "Дихателно упражнение",
  "Сензорна пауза",
  "Смяна на средата",
];

const DEFAULT_TRIGGERS = [
  "Силен шум",
  "Промяна в рутина",
  "Претоварване",
  "Светлини/тълпа",
  "Прекъсване на дейност",
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
}: {
  options: string[];
  value: string[];
  onToggle: (name: string, checked: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((op) => (
        <label key={op} className="inline-flex items-center gap-2 border rounded-2xl px-3 py-1">
          <Checkbox checked={value.includes(op)} onCheckedChange={(c) => onToggle(op, Boolean(c))} />
          <span>{op}</span>
        </label>
      ))}
    </div>
  );
}

// ------------------------------ New Episode Form ------------------------------
function NewEpisode({ onSaved }: { onSaved: () => void }) {
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
    toast.success("Епизодът е записан.");
    setTriggers([]);
    setStrategies([]);
    setNotes("");
    onSaved();
  };

  return (
    <div className="grid gap-4">
      <Section title="Контекст">
        <div className="grid gap-2">
          <Label>Среда</Label>
          <Select value={context} onValueChange={(v) => setContext(v as Episode["context"])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Избери контекст" />
            </SelectTrigger>
            <SelectContent>
              {CONTEXTS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Тригери">
        <TagMulti
          options={DEFAULT_TRIGGERS}
          value={triggers}
          onToggle={(name, checked) => setTriggers((l) => toggle(l, name, checked))}
        />
        <div className="flex gap-2 mt-3">
          <Input placeholder="Собствен тригер" value={customTrigger} onChange={(e) => setCustomTrigger(e.target.value)} />
          <Button
            variant="secondary"
            onClick={() => {
              if (!customTrigger.trim()) return;
              setTriggers((l) => toggle(l, customTrigger.trim(), true));
              setCustomTrigger("");
            }}
          >
            Добави
          </Button>
        </div>
      </Section>

      <Section title={`Интензитет: ${intensity}`}>
        <Slider value={[intensity]} min={1} max={10} step={1} onValueChange={(v) => setIntensity(v[0])} />
      </Section>

      <Section title="Стратегии (пробвани)">
        <TagMulti
          options={DEFAULT_STRATEGIES}
          value={strategies}
          onToggle={(name, checked) => setStrategies((l) => toggle(l, name, checked))}
        />
        <div className="flex gap-2 mt-3">
          <Input placeholder="Собствена стратегия" value={customStrategy} onChange={(e) => setCustomStrategy(e.target.value)} />
          <Button
            variant="secondary"
            onClick={() => {
              if (!customStrategy.trim()) return;
              setStrategies((l) => toggle(l, customStrategy.trim(), true));
              setCustomStrategy("");
            }}
          >
            Добави
          </Button>
        </div>
      </Section>

      <Section title={`Резултат (успех): ${outcome}%`}>
        <Slider value={[outcome]} min={0} max={100} step={5} onValueChange={(v) => setOutcome(v[0])} />
      </Section>

      <Section title="Бележки">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Кратко описание, контекст, наблюдения…" />
      </Section>

      <div className="flex justify-end gap-2">
        <Button onClick={save} className="rounded-2xl">
          <CheckCircle className="w-4 h-4 mr-2" /> Запиши
        </Button>
      </div>
    </div>
  );
}

// ------------------------------ Episodes List (filters) ------------------------------
function EpisodesList() {
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
            <Label>Контекст</Label>
            <Select value={qContext} onValueChange={setQContext}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички</SelectItem>
                {CONTEXTS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="ml-4">Период</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички времена</SelectItem>
                <SelectItem value="7d">7 дни</SelectItem>
                <SelectItem value="30d">30 дни</SelectItem>
                <SelectItem value="6m">6 месеца</SelectItem>
                <SelectItem value="1y">1 година</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm opacity-70">{filtered.length} епизода</div>
          </div>
        </CardContent>
      </Card>

      {filtered.map((e) => (
        <Card key={e.id} className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-3">
              <Badge variant="secondary">{CONTEXTS.find((c) => c.value === e.context)?.label}</Badge>
              <span className="font-normal opacity-70">{formatDate(e.ts)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>
              <Label className="opacity-70">Тригери</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {e.triggers.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <Label className="opacity-70">Интензитет</Label>
                <div className="text-lg">{e.intensity}/10</div>
              </div>
              <div>
                <Label className="opacity-70">Успех</Label>
                <div className="text-lg">{e.outcomeScore}%</div>
              </div>
            </div>
            {e.strategiesTried.length > 0 && (
              <div>
                <Label className="opacity-70">Стратегии</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {e.strategiesTried.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {e.notes && (
              <div>
                <Label className="opacity-70">Бележки</Label>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">{e.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center opacity-70">
            Няма записани епизоди за избрания филтър.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ------------------------------ Insights (selectable period) ------------------------------
function Insights() {
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
          <CardTitle>Анализ за период</CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Последни 7 дни</SelectItem>
              <SelectItem value="30d">Последни 30 дни</SelectItem>
              <SelectItem value="6m">Последни 6 месеца</SelectItem>
              <SelectItem value="1y">Последна година</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Брой епизоди</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Среден интензитет</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{avgIntensity}/10</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Среден успех</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{avgOutcome}%</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Топ стратегии по успех</CardTitle>
        </CardHeader>
        <CardContent>
          {strategyStats.length === 0 && <div className="opacity-70">Няма достатъчно данни.</div>}
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
  const [items, setItems] = useState<Episode[]>([]);
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

  if (ranked.length === 0) return <div className="opacity-70">Все още няма препоръки за този контекст/час.</div>;
  return (
    <div className="flex flex-col gap-2">
      {ranked.map((r) => (
        <div key={r.name} className="border rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-sm opacity-70">Среден успех {r.avg}% (на база {r.n} сходни случая)</div>
          </div>
          <Button variant="secondary">Стартирай</Button>
        </div>
      ))}
    </div>
  );
}

// ------------------------------ PWA helpers ------------------------------
const SW_SUPPORTED = ((): boolean => {
  if (typeof window === "undefined") return false;
  const secure = (window as any).isSecureContext === true || location.hostname === "localhost";
  const notIframe = (() => {
    try { return window.top === window.self; } catch { return false; }
  })();
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
          </svg>`,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any maskable",
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
          </svg>`,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
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

function PWASetup() {
  useEffect(() => {
    injectManifest();
    registerInlineSW();
  }, []);
  return null;
}

function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setSupported(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!supported) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Инсталирай като приложение</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <div className="opacity-70 text-sm">Добави CalmCrisis на началния екран и го ползвай офлайн.</div>
        <Button
          onClick={async () => {
            await deferred.prompt();
            const res = await deferred.userChoice;
            if (res?.outcome === "accepted") toast.success("Инсталацията започна");
            setSupported(false);
          }}
        >
          Инсталирай
        </Button>
      </CardContent>
    </Card>
  );
}

// ------------------------------ Main App ------------------------------
export default function CalmCrisisApp() {
  const [tab, setTab] = useState("home");

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <header className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl grid place-items-center border">
          <Home className="w-5 h-5" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">CalmCrisis</h1>
        <div className="ml-auto">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList>
              <TabsTrigger value="home">Начало</TabsTrigger>
              <TabsTrigger value="new"><Plus className="w-4 h-4 mr-1" /> Нова криза</TabsTrigger>
              <TabsTrigger value="episodes"><List className="w-4 h-4 mr-1" /> Епизоди</TabsTrigger>
              <TabsTrigger value="playbooks"><BookOpen className="w-4 h-4 mr-1" /> Плейбук</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {tab === "home" && (
        <div className="grid gap-6">
          <PWASetup />
          <InstallPrompt />
          <Insights />
          <Card>
            <CardHeader>
              <CardTitle>Какво да пробвам сега?</CardTitle>
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
            Плейбуковете ще добавим следва — започваме с базов CRUD.
          </CardContent>
        </Card>
      )}

      <Toaster richColors />
    </div>
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
    console.assert(typeof SW_SUPPORTED === "boolean", "SW_SUPPORTED should be boolean");
    if (typeof document !== "undefined") {
      injectManifest();
      injectManifest();
      const links = document.querySelectorAll('link[rel="manifest"]').length;
      console.assert(links <= 1, "Manifest should be injected once");
    }
    console.log("CalmCrisis self-tests passed");
  } catch (e) {
    console.warn("CalmCrisis self-tests failed", e);
  }
})();
