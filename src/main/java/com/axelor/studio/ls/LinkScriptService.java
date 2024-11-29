package com.axelor.studio.ls;

import com.axelor.studio.ls.annotation.LinkScriptBinding;
import java.util.LinkedHashMap;

@LinkScriptBinding("__service__")
public interface LinkScriptService {

  LinkScriptResult run(String linkScriptName, LinkedHashMap<String, Object> context);
}
