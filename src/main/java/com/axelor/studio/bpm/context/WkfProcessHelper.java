package com.axelor.studio.bpm.context;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.history.HistoricTaskInstance;
import org.camunda.bpm.engine.task.Task;

public class WkfProcessHelper {

  public static Map<String, Object> getProcessInfo(DelegateExecution execution) {
    Map<String, Object> processInfo = new HashMap<>();
    HistoricProcessInstance historicProcessInstance =
        execution
            .getProcessEngineServices()
            .getHistoryService()
            .createHistoricProcessInstanceQuery()
            .processInstanceId(execution.getProcessInstanceId())
            .singleResult();
    if (historicProcessInstance != null) {
      processInfo.put("startTime", historicProcessInstance.getStartTime());
    }
    processInfo.put("processInstanceId", execution.getProcessInstanceId());
    processInfo.put("processDefinitionId", execution.getProcessDefinitionId());
    processInfo.put("businessKey", execution.getBusinessKey());
    processInfo.put("currentActivityName", execution.getCurrentActivityName());
    processInfo.put("currentActivityId", execution.getCurrentActivityId());

    return processInfo;
  }

  public static List<Task> getActiveTasks(DelegateExecution execution) {
    return execution
        .getProcessEngineServices()
        .getTaskService()
        .createTaskQuery()
        .processInstanceId(execution.getProcessInstanceId())
        .list();
  }

  public static HistoricTaskInstance getTaskById(DelegateExecution execution, String taskId) {
    return execution
        .getProcessEngineServices()
        .getHistoryService()
        .createHistoricTaskInstanceQuery()
        .taskDefinitionKey(taskId)
        .processInstanceId(execution.getProcessInstanceId())
        .singleResult();
  }
}
