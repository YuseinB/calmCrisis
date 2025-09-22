# CalmCrisis (PWA, офлайн)

Малко приложение за бързо записване на кризи (тригери → интервенции → резултат) и прости препоръки на база сходни ситуации.

## Защо
- Работи **офлайн**, данните са **локално** (IndexedDB).
- Бързо добавяне на епизод, филтри по период/контекст, мини анализи.

## Демо
[Live demo](https://calm-crisis.vercel.app/) • [Кратко видео/GIF](#)

## Скриншоти и демо



![New Episode](docs/screenshots/new-episode.png)
![Episodes List](docs/screenshots/episodes.png)
![Recommendations](docs/screenshots/recommend.png)
![PWA Install](docs/screenshots/qrcode_calm-crisis.vercel.app.png)
```markdown
![Insights](docs/screenshots/insights.png)
![Demo GIF](docs/demo/demo.gif)
```

**Съвет:** GIF под ~5 MB, 20–30 сек, показващ: добавяне → филтър → анализ → препоръки.

## Технологии
React + TypeScript, Dexie (IndexedDB), PWA (manifest + SW с graceful fallback).

## Стартиране локално
```bash
npm i
npm run dev
```

## Roadmap
- [ ] CRUD за плейбукове
- [ ] Експорт/импорт (JSON)
- [ ] По-добри препоръки и визуализации
