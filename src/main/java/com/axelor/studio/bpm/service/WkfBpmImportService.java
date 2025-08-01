package com.axelor.studio.bpm.service;

import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.WkfModel;
import jakarta.transaction.Transactional;
import java.io.File;
import java.io.IOException;

public interface WkfBpmImportService {

  void importDmn() throws IOException;

  @Transactional
  WkfModel importWkfModel(String code) throws IOException;

  @Transactional
  WkfDmnModel importDmnModel(File dmnDiagFile) throws IOException;
}
