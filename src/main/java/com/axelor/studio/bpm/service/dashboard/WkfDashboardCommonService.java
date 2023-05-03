package com.axelor.studio.bpm.service.dashboard;

import com.axelor.auth.db.User;
import com.axelor.db.Model;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.schema.actions.ActionView.ActionViewBuilder;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.WkfTaskConfig;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface WkfDashboardCommonService {

  static final String TASK_TODAY = "taskToday";
  static final String TASK_NEXT = "taskNext";
  static final String LATE_TASK = "lateTask";
  static final String ASSIGNED_ME = "assignedToMe";
  static final String ASSIGNED_OTHER = "assignedToOther";
  static final String TASK_BY_PROCESS = "taskByProcess";
  static final String NON_LATE_TASK = "nonLateTask";
  static final String NUM_LATE_TASK = "Number of late tasks";
  static final String NUM_VALIDATE_TASK = "Number of tasks validated";

  List<WkfProcess> findProcesses(WkfModel wkfModel, String processName);

  void sortProcessConfig(List<WkfProcessConfig> processConfigs);

  Map<String, Object> computeStatus(
      boolean isMetaModel, String modelName, WkfProcess process, User user, String assignedType);

  List<WkfTaskConfig> findTaskConfigs(
      WkfProcess process, String modelName, boolean isMetaModel, User user, boolean withTask);

  Object[] computeTaskConfig(
      List<WkfTaskConfig> taskConfigs,
      String modelName,
      boolean isMetaModel,
      User user,
      boolean withTask,
      String assignedType);

  List<MetaJsonRecord> getMetaJsonRecords(
      WkfTaskConfig config,
      List<String> processInstanceIds,
      String modelName,
      User user,
      String type,
      String assignedType,
      LocalDate toDate);

  List<Model> getMetaModelRecords(
      WkfTaskConfig config,
      List<String> processInstanceIds,
      String modelName,
      User user,
      String type,
      String assignedType,
      LocalDate toDate);

  List<Long> getStatusRecordIds(
      WkfTaskConfig config,
      List<String> processInstanceIds,
      String modelName,
      boolean isMetaModel,
      User user,
      String assignedType);

  void getTasks(
      WkfTaskConfig config,
      List<String> processInstanceIds,
      String modelName,
      boolean isMetaModel,
      User user,
      Map<String, Object> taskMap,
      List<Map<String, Object>> taskCntMapList,
      String assignedType);

  boolean isAdmin(WkfModel wkfModel, User user);

  boolean isManager(WkfModel wkfModel, User user);

  boolean isUser(WkfModel wkfModel, User user);

  ActionViewBuilder computeActionView(String status, String modelName, boolean isMetaModel);

  ActionViewBuilder createActionBuilder(String status, MetaModel metaModel);

  ActionViewBuilder createActionBuilder(String status, MetaJsonModel metaJsonModel);
}
