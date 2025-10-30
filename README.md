# Generator analiz urbanistycznych (WZ)

Aplikacja webowa (FastAPI) do wprowadzania danych z wniosku i wyników analizy, porównywania rozbieżności oraz generowania dokumentów analizy i decyzji w formacie DOCX/PDF.

## Uruchomienie (Windows)

1. Zainstaluj Python 3.11+.
2. Kliknij dwukrotnie `start_app.bat` – uruchomi serwer i otworzy przeglądarkę na http://localhost:8000/.

### Alternatywnie w PowerShell (w katalogu projektu):

```powershell
py -3 -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Funkcje

### Formularz
- **Dwukolumnowy formularz**: lewa kolumna - dane z wniosku, prawa kolumna - wyniki analizy
- **Pola "tylko wniosek"**: automatycznie kopiowane do analizy (np. dane wnioskodawcy, teren)
- **Automatyczne oznaczanie rozbieżności**: czerwone obramowanie i etykieta przy polach różniących się
- **Sekcje formularza**: "Dane wnioskodawcy/pełnomocnika", "Teren Objęty wnioskiem"
- **Dynamiczne dodawanie działek**: przycisk "Dodaj kolejną działkę" umożliwia dodawanie wielu numerów działek

### Generowanie dokumentów
- **Analiza urbanistyczna**: DOCX i PDF
- **Decyzja o warunkach zabudowy**: DOCX i PDF (projekt)
- **Wybór gminy**: lista rozwijana z gminami zdefiniowanymi w `app/municipalities.json`
- **Automatyczne wypełnianie pól**: gmina z wyboru dropdowna automatycznie wypełnia pole gmina

### Zapisywanie i wczytywanie
- **Zapisz sprawę**: zapis do pliku JSON (nazwa: numer sprawy z kropek zastąpionych podkreślnikami)
- **Wczytaj sprawę**: wczytanie zapisanej sprawy z pliku JSON
- **Zapisz w pamięci**: automatyczne zapisywanie do sessionStorage przeglądarki
- **Wczytaj z pamięci**: automatyczne wczytanie przy starcie

### Walidacja
- **Pola wymagane**: oznaczona czerwonym gwiazdką
- **Walidacja radio buttonów**: wymagany wybór tytułu dla wnioskodawcy (Pan/Pani/Państwo/Podmiot)
- **Walidacja przy generowaniu**: błędy walidacji blokują generowanie dokumentów (nie blokują zapisu/wczytywania)

## Struktura projektu

```
warunki_zabudowy/
├── app/
│   ├── templates/           # Szablony XML dla poszczególnych gmin
│   │   ├── konopnica_analysis.xml
│   │   ├── konopnica_decision.xml
│   │   ├── domyslna_analysis.xml
│   │   └── domyslna_decision.xml
│   ├── municipalities.json  # Konfiguracja gmin (nazwa, ścieżki do szablonów)
│   ├── fields.json         # Definicja pól formularza
│   └── main.py             # Główna logika aplikacji
├── static/
│   ├── app.js              # Klient JavaScript (zapisywanie, wczytywanie, generowanie formularzy)
│   └── style.css           # Style CSS
├── templates/
│   └── index.html          # Główny szablon HTML
└── README.md
```

## Konfiguracja

### Pola formularza (`app/fields.json`)

Pola są zdefiniowane w formacie JSON: `"klucz": "Etykieta"`. Zmiana pól w tym pliku automatycznie aktualizuje formularz.

### Szablony gmin (`app/municipalities.json`)

```json
{
  "konopnica": {
    "name": "Konopnica",
    "templates": {
      "analysis": "templates/konopnica_analysis.xml",
      "decision": "templates/konopnica_decision.xml"
    },
    "header": "Analiza urbanistyczna - Gmina Konopnica",
    "intro": "...",
    "footer": "Urząd Gminy Konopnica"
  }
}
```

### Szablony XML (`app/templates/*.xml`)

Szablony XML używają składni Jinja2 do wstrzykiwania danych:
- `{{wniosek_wnioskodawca_mianownik}}` - dane z wniosku (z prefixem `wniosek_`)
- `{{wniosek_dzialki}}` - numery działek (połączone przecinkami)
- `{{wniosek_dzialki_multiple}}` - flaga: true/false
- `{{wniosek_dzialki_count}}` - liczba działek

## Specjalne pola

### Wnioskodawca
- **Mianownik**: radio button (Pan/Pani/Państwo/Podmiot) + pole tekstowe (np. "Jan Kowalski")
- **Dopełniacz**: automatycznie generowany z przekształceniem tytułu (Pan → Pana, itd.)
- **Adres**: jedno pole z pełnym adresem

### Działki
- **Pierwsze pole**: bez indeksu, zawsze widoczne
- **Dodatkowe pola**: przycisk "Dodaj kolejną działkę" dodaje kolejne pola
- **Usuwanie**: przycisk "×" obok każdej dodanej działki
- **Automatyczne łączenie**: wszystkie wypełnione numery są łączone przecinkami
- **Flagi**: `dzialki_multiple` (true/false), `dzialki_count` (liczba działek)

## PDF – wymagania

Eksport PDF wykorzystuje `docx2pdf`, które na Windows korzysta z Microsoft Word. Jeśli Word nie jest zainstalowany:
1. Generuj tylko DOCX
2. Lub zainstaluj MS Word

## Przykłady użycia

### 1. Nowa sprawa
1. Wybierz gminę z dropdowna
2. Wypełnij dane wnioskodawcy
3. Wypełnij teren objęty wnioskiem
4. Wypełnij pozostałe pola
5. Kliknij "Porównaj" lub generuj dokumenty

### 2. Wiele działek
1. Wypełnij pierwsze pole "Numery działek" (np. "123/4")
2. Kliknij "Dodaj kolejną działkę"
3. Wypełnij kolejne pole (np. "123/5")
4. W dokumencie pojawi się: "123/4, 123/5"

### 3. Zapisywanie i wczytywanie
1. Wypełnij formularz
2. Podaj numer sprawy (np. "BK.6730.1.1.2025")
3. Kliknij "Zapisz sprawę"
4. Kliknij "Wczytaj sprawę" i wybierz plik JSON

## Uwagi techniczne

- **Pola "tylko wniosek"**: mają przedrostek `wniosek_` w JSON i XML (np. `wniosek_wnioskodawca_mianownik`)
- **SessionStorage**: dane są automatycznie zapisywane i wczytywane z pamięci przeglądarki
- **Walidacja**: walidacja nie blokuje zapisu/wczytywania, ale blokuje generowanie dokumentów
- **Fallback**: jeśli szablon XML nie istnieje, używany jest standardowy szablon DOCX

## Skrót na pulpicie

- Utwórz skrót do pliku `start_app.bat` na pulpicie
- Możesz też utworzyć skrót w przeglądarce do adresu http://localhost:8000/


