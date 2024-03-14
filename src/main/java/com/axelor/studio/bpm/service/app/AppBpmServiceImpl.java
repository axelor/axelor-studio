package com.axelor.studio.bpm.service.app;

import com.axelor.db.Query;
import com.axelor.studio.db.AppBpm;

public class AppBpmServiceImpl implements AppBpmService {

  @Override
  public AppBpm getAppBpm() {
    return Query.of(AppBpm.class).fetchOne();
  }
}
