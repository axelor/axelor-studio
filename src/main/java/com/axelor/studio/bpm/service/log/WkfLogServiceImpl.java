/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.bpm.service.log;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.OutputStreamAppender;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaFile;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class WkfLogServiceImpl implements WkfLogService {

  protected WkfLoggerInitService wkfLoggerInitServiceImpl;

  protected WkfInstanceRepository wkfInstanceRepository;

  protected AppSettingsStudioService appSettingsService;

  protected MetaFiles metaFiles;

  @Inject
  public WkfLogServiceImpl(
      WkfLoggerInitService wkfLoggerInitServiceImpl,
      WkfInstanceRepository wkfInstanceRepository,
      AppSettingsStudioService appSettingsService,
      MetaFiles metaFiles) {
    this.wkfLoggerInitServiceImpl = wkfLoggerInitServiceImpl;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.appSettingsService = appSettingsService;
    this.metaFiles = metaFiles;
  }

  @Override
  public OutputStreamAppender<ILoggingEvent> createOrAttachAppender(String processInstanceId) {

    OutputStreamAppender<ILoggingEvent> appender =
        wkfLoggerInitServiceImpl.getAppender(processInstanceId);
    if (appender != null) {
      wkfLoggerInitServiceImpl.attachAppender(appender);
    } else {
      appender = new OutputStreamAppender<>();
      appender.setContext(wkfLoggerInitServiceImpl.getLoggerContext());
      ByteArrayOutputStream logStream = new ByteArrayOutputStream();
      appender.setOutputStream(logStream);
      appender.setName(processInstanceId);
      appender.setEncoder(wkfLoggerInitServiceImpl.getEncoder());
      appender.start();
      wkfLoggerInitServiceImpl.attachAppender(appender);
      wkfLoggerInitServiceImpl.addAppender(processInstanceId, appender);
    }

    return appender;
  }

  @Override
  public void writeLog(String processInstanceId) {
    OutputStreamAppender<ILoggingEvent> appender =
        wkfLoggerInitServiceImpl.getAppender(processInstanceId);
    boolean isLog = appSettingsService.isAddBpmLog();
    if (appender == null || !isLog) {
      return;
    }

    try (ByteArrayOutputStream outStream = (ByteArrayOutputStream) appender.getOutputStream()) {
      if (outStream.size() > 0) {
        updateProcessInstanceLog(processInstanceId, outStream);
      }
    } catch (IOException e) {
      ExceptionHelper.trace(e);
    }
    appender.setOutputStream(new ByteArrayOutputStream());
    wkfLoggerInitServiceImpl.detachAppender(appender);
  }

  @Transactional(rollbackOn = Exception.class)
  protected void updateProcessInstanceLog(String processInstanceId, ByteArrayOutputStream outStream)
      throws IOException {
    WkfInstance wkfInstance = wkfInstanceRepository.findByInstanceId(processInstanceId);
    if (wkfInstance != null) {
      if (wkfInstance.getLogFile() == null) {
        attachLogFile(wkfInstance);
      }
      MetaFile logFile = wkfInstance.getLogFile();
      try (BufferedWriter writer =
          Files.newBufferedWriter(MetaFiles.getPath(logFile), StandardOpenOption.APPEND)) {
        writer.write(outStream.toString());
      }
    }
  }

  protected void attachLogFile(WkfInstance wkfInstance) throws IOException {
    Path tempFilePath =
        MetaFiles.createTempFile("process_instance_log_" + wkfInstance.getInstanceId(), ".txt");
    File tempFile = tempFilePath.toFile();
    MetaFile logFile = metaFiles.upload(tempFile);
    wkfInstance.setLogFile(logFile);
    wkfInstanceRepository.save(wkfInstance);
  }

  @Transactional(rollbackOn = Exception.class)
  public void clearLog(String processInstanceId) {
    WkfInstance wkfInstance = wkfInstanceRepository.findByInstanceId(processInstanceId);
    if (wkfInstance != null) {
      wkfInstance.setLogFile(null);
      wkfLoggerInitServiceImpl.remove(processInstanceId);
      wkfInstanceRepository.save(wkfInstance);
    }
  }
}
