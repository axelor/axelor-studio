package com.axelor.studio.app.service;

import com.axelor.studio.db.App;

/**
 * @deprecated use {@link com.axelor.meta.loader.AppVersionService} instead.
 */
@Deprecated(forRemoval = true, since = "3.5.0")
public interface AppVersionService {

  String getAppVersion(App app);
}
