# Spezifikation: Live Q&A Platform für Präsentationen

## Übersicht
Eine Webanwendung, die es Zuhörern ermöglicht, während einer Präsentation Fragen zu stellen und über diese abzustimmen. Die Plattform bietet separate Interfaces für Präsentierende und Zuhörer.

## System-Architektur

```mermaid
graph TD
    A[Präsentator] -->|Erstellt| B[Session]
    C[Zuhörer] -->|Zugriff via| D[QR-Code/Link]
    C -->|Stellt| E[Fragen]
    C -->|Bewertet| E
    E -->|WebSocket| F[Server]
    F -->|Live Updates| G[Alle Clients]
    A -->|Verwaltet| E
```

## Kernfunktionen

### Zugang & Authentifizierung
- Zugriff über kurzen Link oder QR-Code
- Einfache Namenseingabe ohne Verifizierung für Fragesteller
- Keine Registrierung erforderlich

### Session-Management
- Einfache Session-Erstellung mit automatisch generierter URL
- Session bleibt aktiv bis zum manuellen Beenden
- Keine automatische Archivierung

### Fragen-Management
- Maximale Länge: 500 Zeichen
- Unterstützung für Bilder und Links
- Automatische Anzeige aller Fragen (keine Vormoderation)
- Up- und Downvoting System
- Echtzeit-Aktualisierung via WebSockets

## Benutzeroberflächen

### Präsentationsmonitor-Ansicht
```mermaid
graph LR
    A[Hauptansicht] --> B[Sortierung nach Votes]
    A --> C[Sortierung nach Zeitstempel]
    A --> D[Sortierung nach Status]
    E[Fragen] --> F[Als beantwortet markieren]
    E --> G[Löschen]
```

Funktionen:
- Verschiedene Sortieroptionen
- Fragen als beantwortet markieren
- Löschfunktion für unpassende Fragen
- Optimiert für große Displays

### Mobile Ansicht (Zuhörer)
```mermaid
graph TD
    A[Hauptansicht] --> B[Fragen stellen]
    A --> C[Fragen anzeigen]
    C --> D[Voting]
    B --> E[Name eingeben]
    B --> F[Text eingeben]
    B --> G[Medien anhängen]
```

Funktionen:
- Optimiert für mobile Geräte
- Einfaches Formular für neue Fragen
- Übersichtliche Darstellung existierender Fragen
- Intuitive Voting-Funktionen

## Technische Anforderungen

### Echtzeit-Funktionalität
- WebSocket-Verbindung für Live-Updates
- Sofortige Aktualisierung bei:
  - Neuen Fragen
  - Votes
  - Statusänderungen

### Datenmodell

```mermaid
erDiagram
    SESSION ||--o{ QUESTION : contains
    QUESTION ||--o{ VOTE : has
    QUESTION {
        string id
        string text
        string authorName
        datetime timestamp
        boolean answered
        array media
    }
    VOTE {
        string id
        string questionId
        boolean isUpvote
        string voterName
    }
    SESSION {
        string id
        string url
        datetime created
        boolean active
    }
```

## Sicherheit & Einschränkungen
- Keine Benutzerauthentifizierung erforderlich
- Grundlegende Validierung der Eingaben
- Schutz vor Massenabstimmungen
- Überprüfung von Medieninhalten auf schädliche Dateien

## Skalierung & Performance
- Optimierung für gleichzeitige Nutzung durch mehrere hundert Teilnehmer
- Effiziente WebSocket-Verbindungsverwaltung
- Caching-Strategien für statische Inhalte