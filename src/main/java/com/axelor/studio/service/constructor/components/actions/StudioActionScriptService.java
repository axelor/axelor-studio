/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor.components.actions;

import com.axelor.meta.db.MetaAction;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionLine;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface StudioActionScriptService {

  MetaAction build(StudioAction studioAction) throws IOException, ClassNotFoundException;

  String generateScriptCode(StudioAction studioAction);

  void addCreateCode(StudioAction studioAction, StringBuilder stb, int level);

  void addOpenRecord(boolean isJson, String targetModel);

  void addRootFunction(StudioAction studioAction, StringBuilder stb, int level);

  String format(String line, int level);

  String addFieldsBinding(String target, List<StudioActionLine> lines, int level, boolean json);

  void computeAttrsField(String target, List<StudioActionLine> lines);

  Set<String> getAttrsFields(List<StudioActionLine> lines);

  String addRelationalBinding(
      StudioActionLine line, String target, boolean json, Map<String, Object> lineMap);

  String getTargetModel(StudioActionLine line);

  String getTargetJsonModel(StudioActionLine line);

  String getRootSourceModel(StudioActionLine line);

  String getSourceModel(StudioActionLine line);

  void addObjToJson();

  String addM2OBinding(StudioActionLine line, boolean search, boolean filter, boolean json);

  String addM2MBinding(StudioActionLine line, boolean json);

  String addO2MBinding(StudioActionLine line, String target, boolean json);

  String addJsonM2OBinding(StudioActionLine line, boolean search, boolean filter, boolean json);

  String addJsonM2MBinding(StudioActionLine line);

  String addJsonO2MBinding(StudioActionLine line);

  String getQuery(String model, String filter, boolean json, boolean all);

  String getSum(String value, String filter);
}
