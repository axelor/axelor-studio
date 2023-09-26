package com.axelor.studio.service.builder;

import com.axelor.data.xml.XMLBind;
import com.axelor.data.xml.XMLInput;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.studio.db.StudioApp;
import com.axelor.utils.context.FullContext;
import com.google.inject.persist.Transactional;
import java.io.File;
import java.util.List;
import java.util.Map;

public interface StudioAppService {

  StudioApp build(StudioApp studioApp);

  void checkCode(StudioApp studioApp);

  @Transactional(rollbackOn = Exception.class)
  void clean(StudioApp studioApp);

  @Transactional(rollbackOn = Exception.class)
  void deleteApp(StudioApp studioApp);

  MetaFile importApp(Map<String, Object> dataFileMap);

  void extractImportZip(File dataDir, File zipFile);

  MetaFile exportApps(List<Integer> studioAppIds, boolean isExportData);

  MetaFile exportApp(StudioApp studioApp, boolean isExportData);

  void generateExportFile(File exportDir, boolean isExportData, int... studioAppIds);

  void generateMetaDataFile(File parentFile, int... studioAppIds);

  void deleteEmptyFile(File file);

  XMLInput createXMLInput(
      MetaJsonModel jsonModel, Map<String, Object> jsonFieldMap, boolean relationalInput);

  List<XMLBind> getFieldBinding(
      MetaJsonModel jsonModel, Map<String, Object> jsonFieldMap, boolean relationalInput);

  @SuppressWarnings("unchecked")
  void generateModelDataFiles(
      MetaJsonModel jsonModel,
      File parentDir,
      Map<String, Object> jsonFieldMap,
      List<FullContext> records);
}
