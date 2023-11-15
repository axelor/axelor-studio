package com.axelor.studio.bpm.service;

import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.WkfModel;
import java.io.File;
import java.io.IOException;
import javax.transaction.Transactional;

public interface WkfBpmImportService {

  void importProcesses() throws IOException;

  @Transactional
  WkfModel importWkfModel(File bpmDiagFile) throws IOException;

  @com.google.inject.persist.Transactional
  WkfDmnModel importDmnModel(File dmnDiagFile) throws IOException;
}
