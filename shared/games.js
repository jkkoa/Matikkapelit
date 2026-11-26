/* Matikkapelit — Plug-in Game Registry
 * Add a new game by creating ./games/<id>/ and adding an entry below.
 * Remember to also list the new game's files in ./sw.js and bump CACHE_NAME.
 */
window.MATIKKA_GAMES = [
  {
    id: 'pikaluku',
    title: 'Pikaluku',
    desc: 'Tunnista määrä silmäyksellä',
    href: './games/pikaluku/',
    art: './img/pikaluku-tile.webp',
    ready: true
  }
  /* Planned next games:
  {
    id: 'maaravertailu',
    title: 'Määrävertailu',
    desc: 'Kummassa on enemmän?',
    href: './games/maaravertailu/',
    art: './img/maaravertailu-tile.webp',
    ready: true
  },
  {
    id: 'lukusuora',
    title: 'Lukusuora',
    desc: 'Etsi luvun paikka suoralta',
    href: './games/lukusuora/',
    art: './img/lukusuora-tile.webp',
    ready: true
  },
  {
    id: 'laskumato',
    title: 'Laskumato',
    desc: 'Yhdistä luvut tavoitesummaksi',
    href: './games/laskumato/',
    art: './img/laskumato-tile.webp',
    ready: true
  }
  */
];
