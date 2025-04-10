import React, { useCallback, useEffect, useState } from "react";
import Select from "./Select";
import Service from "../services/Service";
import { translate } from "../utils";

const TranslationSelect = ({
  translations,
  translateKey,
  setProperty,
  setSnackbar,
  index,
}) => {
  const [languages, setLanguages] = useState([]);

  const getLanguages = useCallback(async ({ criteria } = {}) => {
    let $languages;
    const DEFAULT_LANGUAGES = [
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

    const languagesRes = await Service.search(
      "com.axelor.meta.db.MetaSelectItem",
      {
        fields: ["title", "value"],

        data: {
          _domain: "self.select.name = 'select.language'",
          criteria: criteria && criteria.length > 0 ? criteria : [],
        },
        orderBy: ["select.priority", "order"],
      }
    );

    if (languagesRes?.status === 0 && languagesRes?.data?.length > 0) {
      $languages = languagesRes.data;
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
