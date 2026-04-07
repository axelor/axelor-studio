import React, { useCallback, useEffect, useState } from "react";
import Service from "@studio/shared/services/Service";
import type { MetaSelectItem } from "@studio/shared/types";
import { translate } from "@studio/shared/i18n";

import Select from "./Select";

interface TranslateKey {
  language?: string;
  [key: string]: unknown;
}

interface TranslationSelectProps {
  translations: TranslateKey[];
  translateKey: TranslateKey;
  setProperty: (index: number, key: string, value: unknown, updated: TranslateKey) => void;
  setSnackbar: (config: { messageType: string; message: string }) => void;
  index: number;
}

interface LanguageOption {
  value: string;
  name?: string;
  title?: string;
  id: string;
  [key: string]: unknown;
}

const TranslationSelect = ({ translations, translateKey, setProperty, setSnackbar, index }: TranslationSelectProps) => {
  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  const getLanguages = useCallback(async ({ criteria }: { criteria?: Record<string, unknown>[] } = {}) => {
    let $languages: LanguageOption[];
    const DEFAULT_LANGUAGES: LanguageOption[] = [
      {
        value: "en",
        name: "English",
        id: "en",
      },
      {
        value: "fr",
        name: "French",
        id: "fr",
      },
    ];

    const languagesRes = await Service.search<MetaSelectItem>("com.axelor.meta.db.MetaSelectItem", {
      fields: ["title", "value"],

      data: {
        _domain: "self.select.name = 'select.language'",
        criteria: criteria && criteria.length > 0 ? criteria : [],
      },
      orderBy: ["select.priority", "order"],
    });

    if (languagesRes?.status === 0 && languagesRes?.data?.length > 0) {
      $languages = languagesRes.data.map((item) => ({
        ...item,
        value: item.value ?? "",
        id: item.value ?? String(item.id),
      }));
    } else {
      $languages = DEFAULT_LANGUAGES;
    }

    setLanguages($languages);

    return $languages;
  }, []);

  useEffect(() => {
    (async () => {
      await getLanguages();
    })();
  }, []);

  return (
    <Select
      isTranslated={true}
      update={(value) => {
        if (translateKey.language === value?.value) return;
        const isLang = translations.find((t) => t.language === value?.value);
        if (isLang) {
          setSnackbar({
            messageType: "danger",
            message: translate("Duplicate languages are not allowed"),
          });
          return;
        }
        setProperty(index, "language", value?.value, {
          ...translateKey,
          language: value?.value,
        });
      }}
      name="language"
      value={languages?.find((l) => l.value === translateKey.language)}
      isLabel={false}
      fetchMethod={getLanguages}
      optionLabel="title"
    />
  );
};

export default TranslationSelect;
