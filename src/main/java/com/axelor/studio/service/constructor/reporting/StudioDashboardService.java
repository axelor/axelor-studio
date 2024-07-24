package com.axelor.studio.service.constructor.reporting;

import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaView;
import com.axelor.studio.db.StudioDashboard;
import com.axelor.studio.db.StudioDashlet;

public interface StudioDashboardService {

  MetaView build(StudioDashboard studioDashboard);

  MetaAction getAction(String dashboard, String name, String model, StudioDashlet studioDashlet);
}
