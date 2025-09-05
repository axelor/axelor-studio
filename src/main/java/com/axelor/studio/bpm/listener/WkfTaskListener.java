package com.axelor.studio.bpm.listener;

import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.team.db.TeamTask;
import com.axelor.team.db.repo.TeamTaskRepository;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.camunda.bpm.engine.delegate.DelegateTask;
import org.camunda.bpm.engine.delegate.TaskListener;

public class WkfTaskListener implements TaskListener {

  protected WkfTaskConfigRepository taskConfigRepo;
  protected TeamTaskRepository teamTaskRepository;

  private static final String EVENT_NAME_DELETE = "delete";

  @Inject
  public WkfTaskListener(
      WkfTaskConfigRepository wkfTaskConfigRepo, TeamTaskRepository teamTaskRepository) {
    this.taskConfigRepo = wkfTaskConfigRepo;
    this.teamTaskRepository = teamTaskRepository;
  }

  @Override
  @Transactional
  public void notify(DelegateTask delegateTask) {
    String eventName = delegateTask.getEventName();

    if (EVENT_NAME_DELETE.equals(eventName)) {
      // Task has been cancelled
      WkfTaskConfig wkfTaskConfig =
          taskConfigRepo
              .all()
              .autoFlush(false)
              .filter(
                  "self.name = ? and self.processId = ?",
                  delegateTask.getTaskDefinitionKey(),
                  delegateTask.getProcessDefinitionId())
              .fetchOne();
      String title = wkfTaskConfig.getTaskEmailTitle();
      if (title == null) {
        return;
      }
      TeamTask teamTask =
          teamTaskRepository
              .all()
              .filter(
                  "self.relatedProcessInstance.name = ?1 and self.name =  ?2 and status = ?3",
                  "%s : %s".formatted(wkfTaskConfig.getProcessId(), delegateTask.getProcessInstanceId()),
                  title,
                  "new")
              .fetchOne();
      if (teamTask == null) return;
      teamTask.setStatus("canceled");
      teamTask.setTaskDuration((int) (calculateDurationTask(delegateTask)));
      teamTaskRepository.save(teamTask);
    }
  }

  long calculateDurationTask(DelegateTask delegateTask) {
    LocalDateTime startTime =
        LocalDateTime.ofInstant(delegateTask.getCreateTime().toInstant(), ZoneId.systemDefault());
    LocalDateTime currentTime = LocalDateTime.now();

    Duration duration = Duration.between(startTime, currentTime);
    return duration.getSeconds();
  }
}
