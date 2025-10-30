// Funkcje dostępne globalnie
window.WZApp = window.WZApp || {};

(function () {
  function collectFormData() {
    const data = {
      gmina: '',
      wniosek: {},
      analiza: {}
    };
    const gminaSel = document.getElementById('gmina');
    if (gminaSel) data.gmina = gminaSel.value || '';

    // Lista pól "tylko wniosek" - będą miały przedrostek wniosek_ w JSONie
    const wniosekOnlyKeys = [
      'wnioskodawca_mianownik',
      'wnioskodawca_dopelniacz',
      'wnioskodawca_adres',
      'gmina',
      'obreb',
      'dzialki',
      'teren_obejmuje',
      'data_wykonania_analizy',
      'data_zlozenia_wniosku',
      'data_uzupelnienia_wniosku'
    ];

    const inputs = document.querySelectorAll('input[name], textarea[name], select[name]');
    inputs.forEach((el) => {
      const name = el.getAttribute('name');
      let val = el.value || '';
      
      // Obsługa specjalna dla działek (wiele pól: dzialki_wniosek, dzialki_wniosek_1, dzialki_wniosek_2, ...)
      if (name.startsWith('dzialki_wniosek')) {
        // Zbierz wszystkie pola działek do specjalnego pola
        if (!data.wniosek['_dzialki_array']) {
          data.wniosek['_dzialki_array'] = [];
        }
        if (val) {
          data.wniosek['_dzialki_array'].push(val);
        }
        return;
      }
      
      // Obsługa specjalna dla dat uzupełnienia (wiele pól: data_uzupelnienia_wniosku_wniosek, data_uzupelnienia_wniosku_wniosek_1, ...)
      if (name.startsWith('data_uzupelnienia_wniosku_wniosek')) {
        // Zbierz wszystkie daty uzupełnienia do specjalnego pola
        if (!data.wniosek['_data_uzupelnienia_array']) {
          data.wniosek['_data_uzupelnienia_array'] = [];
        }
        if (val) {
          // Konwertuj YYYY-MM-DD na DD.MM.YYYY
          const parts = val.split('-');
          if (parts.length === 3) {
            val = `${parts[2]}.${parts[1]}.${parts[0]}`;
          }
          data.wniosek['_data_uzupelnienia_array'].push(val);
        }
        return;
      }
      
      if (name.endsWith('_wniosek')) {
        const key = name.replace(/_wniosek$/, '');
        // Dla pól "tylko wniosek" - dodaj przedrostek wniosek_
        if (wniosekOnlyKeys.includes(key)) {
          // Specjalna obsługa dla dat - formatowanie na DD.MM.YYYY
          let processedVal = val;
          if ((key === 'data_wykonania_analizy' || key === 'data_zlozenia_wniosku') && val) {
            // Konwertuj YYYY-MM-DD na DD.MM.YYYY
            const parts = val.split('-');
            if (parts.length === 3) {
              processedVal = `${parts[2]}.${parts[1]}.${parts[0]}`;
            }
          }
          data.wniosek[`wniosek_${key}`] = processedVal;
          // Również kopiuj do analizy z przedrostkiem
          data.analiza[`wniosek_${key}`] = processedVal;
        } else {
          data.wniosek[key] = val;
        }
      } else if (name.endsWith('_analiza')) {
        const key = name.replace(/_analiza$/, '');
        // Dla pól "tylko wniosek" nie powinno być _analiza, ale na wszelki wypadek
        if (!wniosekOnlyKeys.includes(key)) {
          data.analiza[key] = val;
        }
      }
    });
    
    // Przetwórz zbierane działki
    if (data.wniosek['_dzialki_array']) {
      const dzialkiArray = data.wniosek['_dzialki_array'];
      const dzialkiCombined = dzialkiArray.join(', ');
      const isMultiple = dzialkiArray.length > 1;
      
      // Dodaj do wniosek z przedrostkiem
      data.wniosek['wniosek_dzialki'] = dzialkiCombined;
      data.wniosek['wniosek_dzialki_multiple'] = isMultiple ? 'true' : 'false';
      data.wniosek['wniosek_dzialki_count'] = dzialkiArray.length.toString();
      
      // Skopiuj do analizy
      data.analiza['wniosek_dzialki'] = dzialkiCombined;
      data.analiza['wniosek_dzialki_multiple'] = isMultiple ? 'true' : 'false';
      data.analiza['wniosek_dzialki_count'] = dzialkiArray.length.toString();
      
      // Usuń tymczasową tablicę
      delete data.wniosek['_dzialki_array'];
    }
    
    // Przetwórz zbierane daty uzupełnienia
    if (data.wniosek['_data_uzupelnienia_array']) {
      const dataArray = data.wniosek['_data_uzupelnienia_array'];
      const dataCombined = dataArray.join(', ');
      
      // Dodaj do wniosek z przedrostkiem
      data.wniosek['wniosek_data_uzupelnienia_wniosku'] = dataCombined;
      
      // Skopiuj do analizy
      data.analiza['wniosek_data_uzupelnienia_wniosku'] = dataCombined;
      
      // Usuń tymczasową tablicę
      delete data.wniosek['_data_uzupelnienia_array'];
    }

    // Handle special case for wnioskodawca_mianownik with radio buttons
    const wnioskodawcaLeftTitle = document.querySelector('input[name="wnioskodawca_title_wniosek"]:checked');
    
    if (wnioskodawcaLeftTitle) {
      const mianownikKey = 'wniosek_wnioskodawca_mianownik';
      const dopelniaczKey = 'wniosek_wnioskodawca_dopelniacz';
      
      // Dodaj tytuł do mianownika
      if (data.wniosek[mianownikKey]) {
        data.wniosek[mianownikKey] = `${wnioskodawcaLeftTitle.value} ${data.wniosek[mianownikKey]}`;
        // Kopiuj również do analizy
        data.analiza[mianownikKey] = data.wniosek[mianownikKey];
      }
      
      // Dodaj przekształcony tytuł do dopełniacza
      if (data.wniosek[dopelniaczKey] && data.wniosek[dopelniaczKey].trim()) {
        const dopelniaczTitle = transformTitleToDopelniacz(wnioskodawcaLeftTitle.value);
        data.wniosek[dopelniaczKey] = `${dopelniaczTitle} ${data.wniosek[dopelniaczKey]}`;
        // Kopiuj również do analizy
        data.analiza[dopelniaczKey] = data.wniosek[dopelniaczKey];
      }
    }

    return data;
  }

  function transformTitleToDopelniacz(title) {
    if (!title) {
      return "";
    }
    
    // Słownik przekształceń tytułów
    const titleTransformations = {
      "Pan": "Pana",
      "Pani": "Pani", 
      "Państwo": "Państwa",
      "Podmiot": "Podmiotu"
    };
    
    return titleTransformations[title] || title;
  }

  function transformDopelniaczToTitle(dopelniaczTitle) {
    if (!dopelniaczTitle) {
      return "";
    }
    
    // Słownik przekształceń tytułów (odwrotny)
    const titleTransformations = {
      "Pana": "Pan",
      "Pani": "Pani", 
      "Państwa": "Państwo",
      "Podmiotu": "Podmiot"
    };
    
    return titleTransformations[dopelniaczTitle] || dopelniaczTitle;
  }

  function transformMianownikToDopelniacz(mianownik) {
    if (!mianownik) {
      return "";
    }
    
    // Słownik przekształceń tytułów
    const titleTransformations = {
      "Pan": "Pana",
      "Pani": "Pani", 
      "Państwo": "Państwa",
      "Podmiot": "Podmiotu"
    };
    
    // Sprawdź czy wartość zaczyna się od tytułu
    for (const [title, dopelniaczTitle] of Object.entries(titleTransformations)) {
      if (mianownik.startsWith(`${title} `)) {
        // Zamień tytuł na dopełniacz i zwróć resztę bez zmian
        return mianownik.replace(`${title} `, `${dopelniaczTitle} `, 1);
      }
    }
    
    // Jeśli nie ma tytułu, zwróć bez zmian
    return mianownik;
  }

  function downloadFilename() {
    const numEl = document.getElementById('case_number');
    if (numEl && numEl.value) {
      return `${numEl.value.replaceAll('.', '_')}.json`;
    }
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `sprawa_WZ_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
  }

  // Zapisz w pamięci (sessionStorage)
  function saveToMemory() {
    const payload = collectFormData();
    const numEl = document.getElementById('case_number');
    if (numEl) payload.case_number = numEl.value || '';
    
    try {
      sessionStorage.setItem('wz_form_data', JSON.stringify(payload));
      console.log('Dane zapisane w pamięci');
      // Pokaż komunikat
      const msg = document.createElement('div');
      msg.textContent = 'Dane zapisane w pamięci';
      msg.style.cssText = 'position:fixed;top:10px;right:10px;background:#10b981;color:white;padding:8px 12px;border-radius:4px;z-index:1000;';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2000);
    } catch (e) {
      console.error('Błąd zapisu w pamięci:', e);
    }
  }

  // Wczytaj z pamięci
  function loadFromMemory() {
    try {
      const data = sessionStorage.getItem('wz_form_data');
      if (data) {
        const payload = JSON.parse(data);
        // Wypełnij formularz
        fillFormFromData(payload);
        console.log('Dane wczytane z pamięci');
      }
    } catch (e) {
      console.error('Błąd wczytywania z pamięci:', e);
    }
  }

  // Wypełnij formularz danymi
  function fillFormFromData(data) {
    // Wypełnij gminę
    const gminaSel = document.getElementById('gmina');
    if (gminaSel && data.gmina) {
      gminaSel.value = data.gmina;
    }
    
    // Wypełnij numer sprawy
    const caseNumEl = document.getElementById('case_number');
    if (caseNumEl && data.case_number) {
      caseNumEl.value = data.case_number;
    }
    
    // Wypełnij pola wniosku
    if (data.wniosek) {
      for (const [key, value] of Object.entries(data.wniosek)) {
        if (key.startsWith('wniosek_')) {
          const fieldKey = key.replace('wniosek_', '');
          const input = document.querySelector(`input[name="${fieldKey}_wniosek"]`);
          if (input) {
            // Sprawdź czy to pole z tytułem
            if (fieldKey === 'wnioskodawca_mianownik' && value) {
              const titleMatch = value.match(/^(Pan|Pani|Państwo|Podmiot)\s+(.+)$/);
              if (titleMatch) {
                const [, title, name] = titleMatch;
                const titleRadio = document.querySelector(`input[name="wnioskodawca_title_wniosek"][value="${title}"]`);
                if (titleRadio) titleRadio.checked = true;
                input.value = name;
              } else {
                input.value = value;
              }
            } else if (fieldKey === 'wnioskodawca_dopelniacz' && value) {
              // Sprawdź czy wartość zawiera tytuł w dopełniaczu
              const titleMatch = value.match(/^(Pana|Pani|Państwa|Podmiotu)\s+(.+)$/);
              if (titleMatch) {
                const [, title, name] = titleMatch;
                // Przekształć tytuł z dopełniacza na mianownik
                const mianownikTitle = transformDopelniaczToTitle(title);
                // Ustaw radio button
                const titleRadio = document.querySelector(`input[name="wnioskodawca_title_wniosek"][value="${mianownikTitle}"]`);
                if (titleRadio) titleRadio.checked = true;
                // Ustaw wartość pola tekstowego
                input.value = name;
              } else {
                input.value = value;
              }
            } else if ((fieldKey === 'data_wykonania_analizy' || fieldKey === 'data_zlozenia_wniosku') && value) {
              // Konwertuj DD.MM.YYYY na YYYY-MM-DD dla input type="date"
              const dateMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
              if (dateMatch) {
                const [, dd, mm, yyyy] = dateMatch;
                input.value = `${yyyy}-${mm}-${dd}`;
              } else {
                input.value = value;
              }
            } else {
              input.value = value;
            }
          }
        } else {
          const input = document.querySelector(`input[name="${key}_wniosek"]`);
          if (input) input.value = value;
        }
      }
      
      // Specjalna obsługa dla dat uzupełnienia - rozdziel po przecinku i wypełnij pola
      if (key === 'wniosek_data_uzupelnienia_wniosku' && value) {
        const dates = value.split(',').map(d => d.trim()).filter(d => d);
        dates.forEach((dateStr, idx) => {
          // Konwertuj DD.MM.YYYY na YYYY-MM-DD
          const dateMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
          if (dateMatch) {
            const [, dd, mm, yyyy] = dateMatch;
            const formattedDate = `${yyyy}-${mm}-${dd}`;
            
            if (idx === 0) {
              // Pierwsze pole - bez indeksu
              const firstInput = document.querySelector('input[name="data_uzupelnienia_wniosku_wniosek"]');
              if (firstInput) {
                firstInput.value = formattedDate;
              }
            } else {
              // Kolejne pola - z indeksem, musimy kliknąć przycisk
              const btn = document.querySelector('.btn-add-data-uzupelnienia');
              if (btn) {
                btn.click();
                // Poczekaj na utworzenie pola i ustaw wartość
                setTimeout(() => {
                  const newInput = document.querySelector(`input[name="data_uzupelnienia_wniosku_wniosek_${idx}"]`);
                  if (newInput) {
                    newInput.value = formattedDate;
                  }
                }, 10);
              }
            }
          }
        });
      }
    }
    
    // Wypełnij pola analizy
    if (data.analiza) {
      for (const [key, value] of Object.entries(data.analiza)) {
        if (!key.startsWith('wniosek_')) {
          const input = document.querySelector(`input[name="${key}_analiza"]`);
          if (input) input.value = value;
        }
      }
    }
  }

  // Eksportuj funkcje globalnie
  window.WZApp.collectFormData = collectFormData;
  window.WZApp.saveToMemory = saveToMemory;
  window.WZApp.loadFromMemory = loadFromMemory;
  window.WZApp.downloadFilename = downloadFilename;
  
  // Funkcja zapisu do JSON
  window.WZApp.saveToJSON = function() {
    // Sprawdź walidację wszystkich pól dat przed zapisem
    const allDateInputs = document.querySelectorAll('input[type="date"]');
    let hasErrors = false;
    
    allDateInputs.forEach(input => {
      if (input.checkValidity() === false) {
        hasErrors = true;
        console.log('Pole nie przechodzi walidacji:', input.name, input.validationMessage);
      }
    });
    
    if (hasErrors) {
      // Znajdź wszystkie niepoprawne pola i wyświetl komunikaty
      const invalidFields = [];
      allDateInputs.forEach(input => {
        if (!input.checkValidity()) {
          invalidFields.push({
            name: input.name || input.id,
            message: input.validationMessage
          });
          // Wymuś wyświetlenie komunikatu walidacji
          input.reportValidity();
        }
      });
      
      console.log('Błędy walidacji:', invalidFields);
      alert('Proszę poprawić błędy walidacji pól dat przed zapisem pliku.');
      return;
    }
    
    const payload = collectFormData();
    // include case number
    const numEl = document.getElementById('case_number');
    if (numEl) payload.case_number = numEl.value || '';
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/save-case';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'case_json';
    input.value = JSON.stringify(payload);
    const fname = document.createElement('input');
    fname.type = 'hidden';
    fname.name = 'filename';
    fname.value = downloadFilename();
    form.appendChild(input);
    form.appendChild(fname);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 2000);
  };

  // Funkcje generowania decyzji
  function generateDecisionDocx() {
    const form = createDecisionForm('/generate-decision-docx');
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 2000);
  }

  function generateDecisionPdf() {
    const form = createDecisionForm('/generate-decision-pdf');
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 2000);
  }

  function createDecisionForm(action) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    
    // Dodaj gminę i numer sprawy
    const gminaSel = document.getElementById('gmina');
    if (gminaSel) {
      const gminaInput = document.createElement('input');
      gminaInput.type = 'hidden';
      gminaInput.name = 'gmina';
      gminaInput.value = gminaSel.value;
      form.appendChild(gminaInput);
    }
    
    const caseNumEl = document.getElementById('case_number');
    if (caseNumEl) {
      const caseInput = document.createElement('input');
      caseInput.type = 'hidden';
      caseInput.name = 'case_number';
      caseInput.value = caseNumEl.value;
      form.appendChild(caseInput);
    }
    
    // Zbierz wszystkie pola z formularza
    const inputs = document.querySelectorAll('input[name], textarea[name]');
    inputs.forEach((el) => {
      const name = el.getAttribute('name');
      const val = el.value || '';
      
      if (name.endsWith('_wniosek') || name.endsWith('_analiza')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = val;
        form.appendChild(input);
      }
    });
    
    // Dodaj radio buttony - tylko _wniosek dla pól wniosek_only
    // Pobierz listę pól wniosek_only z backendu (zakładamy że zawsze są to pola z _wniosek)
    const wniosekOnlyFields = ['wnioskodawca_mianownik']; // Możemy rozszerzyć jeśli będzie więcej radio buttonów w wniosek_only
    const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
    radioButtons.forEach((radio) => {
      const radioName = radio.name;
      // Dla pól wniosek_only, używaj tylko radio buttonów _wniosek (nie _analiza)
      const isWniosekOnlyRadio = radioName === 'wnioskodawca_title_wniosek';
      const isOtherRadio = !radioName.includes('_title_');
      
      if (isWniosekOnlyRadio || isOtherRadio) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = radioName;
        input.value = radio.value;
        form.appendChild(input);
        console.log(`DEBUG: Added radio button ${radioName} = ${radio.value}`);
      } else {
        console.log(`DEBUG: Skipped radio button ${radioName} = ${radio.value}`);
      }
    });
    
    return form;
  }

  // Funkcje generowania analizy
  function generateAnalysisDocx() {
    const form = createAnalysisForm('/generate-docx');
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 2000);
  }

  function generateAnalysisPdf() {
    const form = createAnalysisForm('/generate-pdf');
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 2000);
  }

  function createAnalysisForm(action) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    
    // Dodaj gminę i numer sprawy
    const gminaSel = document.getElementById('gmina');
    if (gminaSel) {
      const gminaInput = document.createElement('input');
      gminaInput.type = 'hidden';
      gminaInput.name = 'gmina';
      gminaInput.value = gminaSel.value;
      form.appendChild(gminaInput);
    }
    
    const caseNumEl = document.getElementById('case_number');
    if (caseNumEl) {
      const caseInput = document.createElement('input');
      caseInput.type = 'hidden';
      caseInput.name = 'case_number';
      caseInput.value = caseNumEl.value;
      form.appendChild(caseInput);
    }
    
    // Zbierz wszystkie pola z formularza
    const inputs = document.querySelectorAll('input[name], textarea[name]');
    inputs.forEach((el) => {
      const name = el.getAttribute('name');
      const val = el.value || '';
      
      if (name.endsWith('_wniosek') || name.endsWith('_analiza')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = val;
        form.appendChild(input);
      }
    });
    
    // Dodaj radio buttony - tylko _wniosek dla pól wniosek_only
    const wniosekOnlyFields = ['wnioskodawca_mianownik'];
    const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
    radioButtons.forEach((radio) => {
      const radioName = radio.name;
      // Dla pól wniosek_only, używaj tylko radio buttonów _wniosek (nie _analiza)
      const isWniosekOnlyRadio = wniosekOnlyFields.some(field => radioName === `${field}_title_wniosek`);
      const isOtherRadio = !radioName.includes('_title_');
      
      if (isWniosekOnlyRadio || isOtherRadio) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = radioName;
        input.value = radio.value;
        form.appendChild(input);
      }
    });
    
    return form;
  }

  // Eksportuj funkcje globalnie
  window.WZApp.generateDecisionDocx = generateDecisionDocx;
  window.WZApp.generateDecisionPdf = generateDecisionPdf;
  window.WZApp.generateAnalysisDocx = generateAnalysisDocx;
  window.WZApp.generateAnalysisPdf = generateAnalysisPdf;
  window.generateDecisionDocx = generateDecisionDocx;
  window.generateDecisionPdf = generateDecisionPdf;
  window.generateAnalysisDocx = generateAnalysisDocx;
  window.generateAnalysisPdf = generateAnalysisPdf;
})();


