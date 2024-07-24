package com.axelor.studio.service.constructor.components.actions;

import com.axelor.meta.db.MetaAction;
import com.axelor.studio.db.StudioAction;
import java.util.Map;

public interface StudioActionViewService {

  MetaAction build(StudioAction studioAction);

  void bindContext(StudioAction studioAction, Map<String, Object> binding);

  void bindDomain(String domain, Boolean isJson, Map<String, Object> binding);
}
