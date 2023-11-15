package com.axelor.studio.bpm.listener;

import com.axelor.event.Observes;
import com.axelor.events.StartupEvent;
import com.axelor.studio.bpm.service.WkfBpmImportService;
import com.axelor.utils.helpers.ExceptionHelper;
import javax.annotation.Priority;
import javax.inject.Inject;

public class WkfModelImportListener {

  protected final WkfBpmImportService wkfBpmImportService;

  @Inject
  public WkfModelImportListener(WkfBpmImportService wkfBpmImportService) {
    this.wkfBpmImportService = wkfBpmImportService;
  }

  public void onStartUp(@Observes @Priority(value = -1) StartupEvent event) {
    try {

      wkfBpmImportService.importProcesses();
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    }
  }
}
