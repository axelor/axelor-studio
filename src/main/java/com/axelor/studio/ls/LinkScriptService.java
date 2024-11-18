package com.axelor.studio.ls;

import com.axelor.studio.db.LinkScript;
import java.util.LinkedHashMap;

public interface LinkScriptService {
  LinkScriptResult run(LinkScript linkScript, LinkedHashMap<String, Object> context);
}
