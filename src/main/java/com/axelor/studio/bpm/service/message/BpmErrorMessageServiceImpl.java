package com.axelor.studio.bpm.service.message;

import com.axelor.auth.AuthUtils;
import com.axelor.message.service.MailMessageService;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfProcessConfigRepository;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import org.camunda.bpm.engine.impl.pvm.runtime.PvmExecutionImpl;

@Singleton
public class BpmErrorMessageServiceImpl implements BpmErrorMessageService {

  protected WkfInstanceRepository wkfInstanceRepository;
  protected WkfProcessConfigRepository wkfProcessConfigRepository;
  protected MailMessageService mailMessageService;

  @Inject
  public BpmErrorMessageServiceImpl(
      MailMessageService mailMessageService,
      WkfInstanceRepository wkfInstanceRepository,
      WkfProcessConfigRepository wkfProcessConfigRepository) {
    this.mailMessageService = mailMessageService;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.wkfProcessConfigRepository = wkfProcessConfigRepository;
  }

  @Override
  public void sendBpmErrorMessage(PvmExecutionImpl execution, String errorMessage) {

    WkfProcess process =
        wkfInstanceRepository.findByInstnaceId(execution.getProcessInstanceId()).getWkfProcess();

    WkfProcessConfig processConfig =
        wkfProcessConfigRepository.all().filter("self.wkfProcess = ?1", process).fetchOne();
    boolean isJson = processConfig.getMetaModel() == null;
    String body =
        "BPM model : "
            + process.getWkfModel().getId()
            + "</br> Process instance id : "
            + execution.getProcessInstanceId()
            + "</br> Node ids : "
            + execution.getActivityId()
            + "("
            + execution.getCurrentActivityName()
            + ") </br></br> "
            + errorMessage;

    mailMessageService.sendNotification(
        AuthUtils.getUser(),
        "BPM error",
        body,
        isJson ? processConfig.getMetaJsonModel().getId() : processConfig.getMetaModel().getId(),
        isJson
            ? processConfig.getMetaJsonModel().getClass()
            : processConfig.getMetaModel().getClass());
  }
}
