package com.axelor.studio.service.app;

import com.axelor.db.Query;
import com.axelor.studio.db.AppStudio;

public class AppStudioServiceImpl implements AppStudioService {

  @Override
  public AppStudio getAppStudio() {
    return Query.of(AppStudio.class).fetchOne();
  }
}
