# Energidrikk Smaking

Energidrikktest. Alle kan legge inn en test når de drikker en. Smak og smak vs. pris, 1–10. Total = snittet av de to.

Dataene hentes fra Google-regnearket «Energidrikk Smaking – tester» (Drive-mappen «Energidrikk Smaking»).
Bildene ligger i Drive-mappen «Bilder».

## Legge inn en test
Alle kan bruke `legg-inn.html`. Velg merke først (f.eks. Monster) og så type (f.eks. Ultra White). Siden foreslår merker og typer som er testet før,
og spør «Mener du …?» når et navn ligner, så samme drikk ikke havner på lista to ganger.
Mottakeren (Apps Script i regnearket, under Utvidelser → Apps Script) bruker også skrivemåten som allerede står i arket.

Én rad per testperson i arket. Feil eller spam: slett raden i regnearket.

## Filer
- `index.html` – forsiden (siste test, kåringer, toppliste, testere, alle drikker)
- `legg-inn.html` – skjema for nye tester
- `config.js` – ID til regnearket og adressen til mottakeren
- `parse.js` – leser arket og samler vurderinger per drikk
- `data/eksempel.json` – vises når arket er tomt
