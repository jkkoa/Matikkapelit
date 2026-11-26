# Matikkapelit

Esikoulun matematiikkapelejä iPadeille ja kosketustauluille. Staattinen offline-kelpoinen PWA ilman kirjautumisia, nimiä tai analytiikkaa.

## Pelit

- **Pikaluku** (`games/pikaluku/`) — Pikalukulautaset / subitisointi (`1–5`, `1–10`, `5–10`). Esitysmuodot: ryhmitellyt pisteet, pikalukulautaset, kymppiruudukko, sormet ja nopat. Sisältää iPad-pelaajatilan ja kosketustaulun `Taulu`-tilan.

## Suunnitellut lisäykset

- **Määrävertailu** (`games/maaravertailu/`) — Eri esitysmuotojen vertailu (hyödyntää suoraan `shared/quantities.js`-moduulia).
- **Lukusuora** (`games/lukusuora/`) — Merkitsemätön lukusuora `0–10` / `0–20` ja tarkka asteikkopaljastus.
- **Laskumato** (`games/laskumato/`) — Kosketusvedolla koottavat tavoitesummat.

## Käyttöönotto (GitHub Pages)

1. Avaa repositorion asetukset: **Settings -> Pages**.
2. Valitse **Source: Deploy from a branch**, branch `main` ja kansio `/ (root)`.
3. Tulosta sivun QR-koodi luokkaan ja lisää iPadeilla Safarissa Koti-valikkoon (*Lisää Koti-valikkoon*).
