package com.axelor.studio.app.service;

import com.axelor.studio.db.App;
import jakarta.inject.Inject;

/**
 * @deprecated use {@link com.axelor.meta.loader.AppVersionServiceImpl} instead.
 */
@Deprecated(forRemoval = true, since = "3.5.0")
public class AppVersionServiceImpl implements AppVersionService {

  com.axelor.meta.loader.AppVersionService appVersionService;

  @Inject
  public AppVersionServiceImpl(com.axelor.meta.loader.AppVersionService appVersionService) {
    this.appVersionService = appVersionService;
  }

  @Override
  public String getAppVersion(App app) {
    return appVersionService.getAppVersion(app);
  }
}
