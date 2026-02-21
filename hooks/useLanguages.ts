import { useEffect, useState } from 'react';

const LANGUAGES_URL = 'https://restcountries.com/v3.1/all?fields=languages';

type LanguageObj = { languages: Record<string, string> };

const useLanguages = (): string[] => {
  const [languages, setLanguages] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(LANGUAGES_URL);
        const data: LanguageObj[] = await res.json();
        const langs: string[] = [];
        data.forEach((d) => {
          const langsObj = Object.values(d.languages);
          langs.push(...langsObj);
        });
        setLanguages([...new Set(langs)].sort());
      } catch {
        setLanguages([]);
      }
    })();
  }, []);

  return languages;
};

export default useLanguages;
