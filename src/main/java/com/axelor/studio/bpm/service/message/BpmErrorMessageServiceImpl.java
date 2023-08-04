package com.axelor.studio.bpm.service.message;

import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.db.EntityHelper;
import com.axelor.message.service.MailMessageService;
import com.axelor.meta.db.MetaModel;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfProcessConfigRepository;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.util.HashSet;
import java.util.Set;
import org.apache.commons.collections.CollectionUtils;
import org.camunda.bpm.engine.impl.pvm.runtime.PvmExecutionImpl;

@Singleton
public class BpmErrorMessageServiceImpl implements BpmErrorMessageService {

  protected WkfInstanceRepository wkfInstanceRepository;
  protected WkfProcessConfigRepository wkfProcessConfigRepository;
  protected MailMessageService mailMessageService;
  protected UserRepository userRepo;

  @Inject
  public BpmErrorMessageServiceImpl(
      MailMessageService mailMessageService,
      WkfInstanceRepository wkfInstanceRepository,
      WkfProcessConfigRepository wkfProcessConfigRepository,
      UserRepository userRepo) {
    this.mailMessageService = mailMessageService;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.wkfProcessConfigRepository = wkfProcessConfigRepository;
    this.userRepo = userRepo;
  }

  @Override
  public void sendBpmErrorMessage(PvmExecutionImpl execution, String errorMessage) {

    WkfProcess process =
        wkfInstanceRepository.findByInstanceId(execution.getProcessInstanceId()).getWkfProcess();

    WkfProcessConfig processConfig =
        wkfProcessConfigRepository.all().filter("self.wkfProcess = ?1", process).fetchOne();
    
    MetaModel metaModel = EntityHelper.getEntity(processConfig.getMetaModel());
    boolean isJson = metaModel == null;
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

    getRelatedUserSet(process.getWkfModel())
        .forEach(
            user ->
                mailMessageService.sendNotification(
                    user,
                    "BPM error",
                    body,
                    isJson
                        ? processConfig.getMetaJsonModel().getId()
                        : metaModel.getId(),
                    isJson
                        ? processConfig.getMetaJsonModel().getClass()
                        : metaModel.getClass()));
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
