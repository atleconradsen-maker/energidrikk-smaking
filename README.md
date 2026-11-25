# Energidrikk Smaking

Offentlig resultatside for den ukentlige energidrikktesten. Ren statisk side – fungerer på GitHub Pages uten database.

## Filer
- `index.html` – forsiden (siste test, kåringer, toppliste, dommerpanel, alle drikker)
- `ny-test.html` – skjema for å legge inn en ny test (lager oppdatert `data/tests.json`)
- `data/tests.json` – alle testene. Er den tom, viser forsiden `data/eksempel.json` med et tydelig «Eksempeldata»-merke
- `bilder/` – bilder av boksene
- `logo.jpg`

## Publisere på GitHub Pages
1. Lag et nytt offentlig repo, f.eks. `energidrikk-smaking`, og last opp alle filene (behold mappene).
2. Settings → Pages → Source: «Deploy from a branch», branch `main`, mappe `/ (root)` → Save.
3. Siden ligger på `https://<brukernavn>.github.io/energidrikk-smaking/` etter et par minutter.
4. Eget domene (valgfritt): Settings → Pages → Custom domain, og legg inn en CNAME hos domeneleverandøren.

## Legge inn ny test
Åpne `.../ny-test.html` på mobilen, fyll inn, trykk «Lag oppdatert tests.json», og følg stegene som dukker opp.
`ny-test.html` endrer ingenting av seg selv – bare det du committer til repoet blir synlig.

## Format i tests.json
```json
{"id":"monster-ultra-white-2026-w48","drink":"Monster Ultra White","brand":"Monster","week":"2026-W48",
 "price":29.9,"ml":500,"photo":"bilder/monster-ultra-white-2026-w48.jpg","notes":"",
 "scores":[{"name":"Itrat Zishan","taste":8,"value":8}]}
```
`taste` = smak, `value` = smak vs. pris (1–10). Total = snittet av de to.
