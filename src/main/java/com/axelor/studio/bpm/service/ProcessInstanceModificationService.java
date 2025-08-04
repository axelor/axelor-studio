package com.axelor.studio.bpm.service;

import com.axelor.studio.db.WkfProcessUpdate;
import java.io.IOException;
import java.nio.file.Path;

public interface ProcessInstanceModificationService {
  void execute(WkfProcessUpdate wkfProcessUpdate);

  void generateScript(WkfProcessUpdate wkfProcessUpdate, Path path) throws IOException;

  Path export(WkfProcessUpdate wkfProcessUpdate);
}
