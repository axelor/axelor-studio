package com.axelor.studio.service.builder;

import com.axelor.meta.db.MetaAction;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionLine;
import com.axelor.studio.db.StudioActionView;
import java.util.List;

public interface StudioActionViewService {

  MetaAction build(StudioAction studioAction);

  void appendParams(List<StudioActionLine> params, StringBuilder xml);

  void appendContext(StudioAction studioAction, StringBuilder xml);

  void appendDomain(String domain, Boolean isJson, StringBuilder xml);

  void appendViews(List<StudioActionView> views, StringBuilder xml);

  String appendBasic(StudioAction studioAction, StringBuilder xml);
}
