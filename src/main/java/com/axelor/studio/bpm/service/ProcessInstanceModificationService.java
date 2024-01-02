package com.axelor.studio.bpm.service;

import com.axelor.studio.db.WkfProcessUpdate;
import java.io.IOException;
import java.nio.file.Path;

public interface ProcessInstanceModificationService {
  public void execute(WkfProcessUpdate wkfProcessUpdate);

  public void generateScript(WkfProcessUpdate wkfProcessUpdate, Path path) throws IOException;

  public Path export(WkfProcessUpdate wkfProcessUpdate);
}
