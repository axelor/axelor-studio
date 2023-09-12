package com.axelor.studio.bpm.service.message;

import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.message.service.MailMessageService;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.util.HashSet;
import java.util.Set;
import org.apache.commons.collections.CollectionUtils;
import org.camunda.bpm.engine.impl.pvm.runtime.PvmExecutionImpl;

@Singleton
public class BpmErrorMessageServiceImpl implements BpmErrorMessageService {

  protected WkfInstanceRepository wkfInstanceRepository;
  protected MailMessageService mailMessageService;
  protected UserRepository userRepo;
  protected WkfModelRepository wkfModelRepo;

  @Inject
  public BpmErrorMessageServiceImpl(
      MailMessageService mailMessageService,
      WkfInstanceRepository wkfInstanceRepository,
      UserRepository userRepo,
      WkfModelRepository wkfModelRepo) {
    this.mailMessageService = mailMessageService;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.userRepo = userRepo;
    this.wkfModelRepo = wkfModelRepo;
  }

  @Override
  public void sendBpmErrorMessage(
      PvmExecutionImpl execution, String errorMessage, WkfModel model, String processInstanceId) {
    Long relatedId = null;
    Class<? extends Model> relatedModel = WkfModel.class;
    String body = errorMessage;

    if (execution != null || !Strings.isNullOrEmpty(processInstanceId)) {
      boolean isExecution = Strings.isNullOrEmpty(processInstanceId);

      WkfInstance instance =
          wkfInstanceRepository.findByInstanceId(
              isExecution ? execution.getProcessInstanceId() : processInstanceId);

      if (instance == null) {
        return;
      }

      relatedId = instance.getId();
      relatedModel = WkfInstance.class;

      model = instance.getWkfProcess().getWkfModel();
      String activtyDetails =
          isExecution
              ? ("</br>"
                  + I18n.get(BpmExceptionMessage.NODE_IDS)
                  + " : "
                  + execution.getActivityId()
                  + "("
                  + execution.getCurrentActivityName()
                  + ")")
              : "";
      body =
          I18n.get(BpmExceptionMessage.BPM_MODEL)
              + " : "
              + model.getId()
              + "</br>"
              + I18n.get(BpmExceptionMessage.PROCESS_INSTANCE_ID)
              + " : "
              + instance.getInstanceId()
              + activtyDetails
              + "</br></br> "
              + errorMessage;
    } else if (model != null) {
      relatedId = model.getId();
    }

    for (User user : getRelatedUserSet(model)) {
      mailMessageService.sendNotification(
          user, I18n.get(BpmExceptionMessage.BPM_ERROR), body, relatedId, relatedModel);
    }
  }

  protected Set<User> getRelatedUserSet(WkfModel model) {
    Set<User> relatedUserSet = new HashSet<>();
    relatedUserSet.addAll(userRepo.all().filter("self.group.code = 'admins'").fetch());

    if (model.getSendAdminsNotification()) {
      addUsers(relatedUserSet, model.getAdminUserSet(), model.getAdminRoleSet());
    }

    if (model.getSendManagerNotification()) {
      addUsers(relatedUserSet, model.getManagerUserSet(), model.getManagerRoleSet());
    }

    if (model.getSendUserNotification()) {
      addUsers(relatedUserSet, model.getUserSet(), model.getRoleSet());
    }
    return relatedUserSet;
  }

  protected void addUsers(Set<User> relatedUserSet, Set<User> users, Set<Role> roles) {
    if (CollectionUtils.isNotEmpty(users)) {
      relatedUserSet.addAll(users);
    }

    if (CollectionUtils.isNotEmpty(roles)) {
      relatedUserSet.addAll(userRepo.all().filter("self.roles IN (?1)", roles).fetch());
    }
  }
}
