/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.log;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.OutputStreamAppender;
import com.axelor.file.temp.TempFiles;
import com.axelor.i18n.I18n;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaFile;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.io.BufferedOutputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Path;

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
    WkfInstance wkfInstance = wkfInstanceRepository.findByInstanceId(processInstanceId);

    if (wkfInstance == null) {
      throw new IllegalArgumentException(
          I18n.get(BpmExceptionMessage.BPM_WKF_INSTANCE_NOT_FOUND).formatted(processInstanceId));
    }

    try {
      if (wkfInstance.getLogFile() == null) {
        attachLogFile(wkfInstance);
      }

      if (appender != null) {
        wkfLoggerInitServiceImpl.attachAppender(appender);
      } else {
        appender = createNewAppender(processInstanceId, wkfInstance);
      }

      return appender;
    } catch (IOException e) {
      throw new IllegalStateException(e);
    }
  }

  private OutputStreamAppender<ILoggingEvent> createNewAppender(
      String processInstanceId, WkfInstance wkfInstance) throws FileNotFoundException {
    MetaFile file = wkfInstance.getLogFile();
    Path logFilePath = MetaFiles.getPath(file);

    BufferedOutputStream logFileStream =
        new BufferedOutputStream(new FileOutputStream(logFilePath.toString(), true));
    OutputStreamAppender<ILoggingEvent> appender = new OutputStreamAppender<>();
    appender.setContext(wkfLoggerInitServiceImpl.getLoggerContext());
    appender.setOutputStream(logFileStream);
    appender.setName(processInstanceId);
    appender.setEncoder(wkfLoggerInitServiceImpl.getEncoder());
    appender.start();

    wkfLoggerInitServiceImpl.attachAppender(appender);
    wkfLoggerInitServiceImpl.addAppender(processInstanceId, appender);

    return appender;
  }

  protected void attachLogFile(WkfInstance wkfInstance) throws IOException {
    Path tempFilePath =
        TempFiles.createTempFile("process-instance-log-" + wkfInstance.getInstanceId(), ".txt");
    MetaFile logFile = metaFiles.upload(tempFilePath.toFile());
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

  @Override
  public void writeLog(String processInstanceId) {
    OutputStreamAppender<ILoggingEvent> appender =
        wkfLoggerInitServiceImpl.getAppender(processInstanceId);
    boolean isLog = appSettingsService.isAddBpmLog();
    if (appender == null || !isLog) {
      return;
    }
    try {
      BufferedOutputStream outStream = (BufferedOutputStream) appender.getOutputStream();
      outStream.flush();
    } catch (IOException e) {
      ExceptionHelper.error(e);
    }
  }
}
