package com.axelor.studio.ls;

import com.axelor.studio.ls.annotation.LinkScriptBinding;
import java.util.LinkedHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

@LinkScriptBinding("__service__")
public interface LinkScriptService {
  Future<LinkScriptResult> run(String linkScriptName, LinkedHashMap<String, Object> context)
      throws ExecutionException, InterruptedException;
}
