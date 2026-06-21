# MBST – Mikro- & Biosystemtechnik – Lernkarten

Interaktive Lernkarten (Flashcards) zur Vorbereitung auf die Klausur **APL-SLK „Mikro- und
Biosystemtechnik“** (Modul **M651/M519**, HTW Dresden, Fak. Maschinenbau – Professur
Fertigungssysteme/Urformtechnik, Prof. Dr.-techn. Udo Klotzbach).

Die Karten basieren **1:1 auf einer Altklausur** (60 min, ohne Unterlagen). Laut Hinweis ist die
kommende Prüfung voraussichtlich identisch – daher ist praktisch der gesamte Stoff **A-Wissen**.

Jede Karte lässt sich mit **✓ Sicher** oder **✗ Nicht gewusst** bewerten. Der Fortschritt wird im
Browser gespeichert (`localStorage`), sodass du gezielt die noch nicht sitzenden Karten
wiederholen kannst.

## Inhalt

Drei Prüfungsbereiche der Altklausur:

| Thema | Klausurfragen |
|---|---|
| Bio-Mikrosysteme | 1–6 (Größenordnungen, MPS, Herstellungskette, Lab-on-a-Chip) |
| Laser | 10–17 (Akronym, Eigenschaften, Anregung, Vier-Niveau-Laser, Spektrum, Aufbau, Optik) |
| Laserschutz | 18–20 (Wirkung, biologische Wirkung, Gefährdung) |
| KI / Maschinelles Lernen | 21 (Was ist Lernen?) |

> **Lücke:** Die Fragen **7–9** (Seite 5 von 12) liegen nicht als Foto vor und fehlen daher.
> Sobald die Seite verfügbar ist, können sie als weitere Karten ergänzt werden (siehe unten).

## Benutzung

### Lokal
`index.html` im Browser öffnen – oder, damit die Kartendaten (`fetch`) sauber geladen werden,
einen kleinen lokalen Server starten:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

### Bedienung
- **Antwort zeigen** / `Leertaste` – Antwort aufdecken
- `→` – **Sicher** · `←` – **Nicht gewusst**
- `n` / `p` – nächste / vorherige Karte
- Filter nach **Thema**, **Priorität (A/B)** und **Typ**
- **„Nur nicht gewusst wiederholen“** – drillt nur die offenen/schwachen Karten
- **Mischen** und **Fortschritt zurücksetzen**

## Eigene Karten hinzufügen

Karten liegen als JSON unter [`data/`](data/) – eine Datei pro Prüfungsbereich. Aufbau einer Karte:

```json
{
  "id": "laser-099",
  "topic": "Laser",
  "subtopic": "Aufbau",
  "priority": "A",
  "type": "open",
  "question": "Frage …",
  "answer": "Antwort … (unterstützt **fett**, - Listen, 1. nummerierte Listen)",
  "options": ["…"],
  "answerIndex": 0,
  "image": "img/dateiname.png"
}
```

- `type`: `open` (offene Frage), `mc` (Multiple Choice, dann `options` + `answerIndex` nötig)
  oder `flashcard` (kurze Karteikarte).
- `priority`: `A` oder `B`.
- `image` ist optional und wird auf der Antwortseite angezeigt – ideal, um eigene Skizzen der
  Klausur-Abbildungen (Vier-Niveau-Termschema, Laser-Aufbau, optische Skizze, Spektrum,
  Lab-on-a-Chip) nachzutragen. Bilder in den Ordner [`img/`](img/) legen.

## Hinweise

- Die Klausur-Abbildungen sind handgezeichnet; sie sind hier **textuell beschrieben** statt als
  Bild beigelegt. Der Ordner `img/` ist für eigene, später ergänzte Skizzen vorgesehen.
- Inhaltliche Fehler? Gerne korrigieren.

*Kein offizielles Material der HTW Dresden – privates Lernprojekt.*
