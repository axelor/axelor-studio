package com.axelor.studio.service.builder;

import com.axelor.meta.db.MetaFile;
import com.axelor.studio.db.StudioApp;
import java.util.List;
import java.util.Map;

public interface StudioAppService {
  public static final String STUDIO_APP_CODE = "code";
  public static final String STUDIO_APP_NAME = "name";
  public static final String STUDIO_APP_DESC = "description";
  public static final String STUDIO_APP_SEQ = "sequence";
  public static final String STUDIO_APP_IMAGE = "image";
  public static final String STUDIO_APP_MODULES = "modules";
  public static final String STUDIO_APP_DEPENDS_ON = "dependsOn";

  public StudioApp build(StudioApp studioApp);

  public void clean(StudioApp studioApp);

  public void deleteApp(StudioApp studioApp);

  public MetaFile importApp(Map<String, Object> dataFileMap);

  public MetaFile exportApps(List<Integer> studioAppIds, boolean isExportData);

  public MetaFile exportApp(StudioApp studioApp, boolean isExportData);
}
