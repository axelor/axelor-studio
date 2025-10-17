/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.dashboard;

import com.axelor.auth.AuthUtils;
import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.db.JPA;
import com.axelor.db.Model;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.execution.WkfUserActionService;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.utils.helpers.context.FullContext;
import com.google.inject.Inject;
import jakarta.persistence.Query;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

public class BpmManagerDashboardUserServiceImpl implements BpmManagerDashboardUserService {

  protected WkfUserActionService wkfUserActionService;

  protected WkfInstanceService wkfInstanceService;

  protected WkfDashboardCommonService wkfDashboardCommonService;

  protected WkfModelRepository wkfModelRepo;

  protected WkfTaskConfigRepository wkfTaskConfigRepo;

  protected UserRepository userRepo;

  @Inject
  public BpmManagerDashboardUserServiceImpl(
      WkfUserActionService wkfUserActionService,
      WkfInstanceService wkfInstanceService,
      WkfDashboardCommonService wkfDashboardCommonService,
      WkfModelRepository wkfModelRepo,
      WkfTaskConfigRepository wkfTaskConfigRepo,
      UserRepository userRepo) {
    this.wkfUserActionService = wkfUserActionService;
    this.wkfInstanceService = wkfInstanceService;
    this.wkfDashboardCommonService = wkfDashboardCommonService;
    this.wkfModelRepo = wkfModelRepo;
    this.wkfTaskConfigRepo = wkfTaskConfigRepo;
    this.userRepo = userRepo;
  }

  @Override
  public List<WkfModel> getWkfModelsByUser(User user) {
    List<WkfModel> wkfModelList = wkfModelRepo.all().order("code").fetch();
    List<WkfModel> filterWkfModels = new ArrayList<>();

    wkfModelList.forEach(
        wkfModel -> {
          List<WkfProcess> processes = wkfDashboardCommonService.findProcesses(wkfModel, null);
          if (CollectionUtils.isEmpty(processes)) {
            return;
          }

          boolean isSuperAdmin = user.getCode().equals("admin");
          boolean isAdmin = wkfDashboardCommonService.isAdmin(wkfModel, user);
          boolean isManager = wkfDashboardCommonService.isManager(wkfModel, user);
          boolean isUser = wkfDashboardCommonService.isUser(wkfModel, user);

          if (!isSuperAdmin && !isAdmin && !isManager && !isUser) {
            return;
          }

          filterWkfModels.add(wkfModel);
        });
    return filterWkfModels;
  }

  @SuppressWarnings("unchecked")
  @Override
  public void getAssignedToMeTask(
      WkfProcess process,
      String modelName,
      boolean isMetaModel,
      List<Map<String, Object>> dataMapList,
      User user) {

    Object[] obj =
        this.computeAssignedTaskConfig(
            process, modelName, isMetaModel, user, true, WkfDashboardCommonService.ASSIGNED_ME);

    List<Map<String, Object>> statusList = (List<Map<String, Object>>) obj[1];

    statusList.forEach(
        statusMap -> {
          Map<String, Object> dataMap = new HashMap<>();
          String processName =
              (!StringUtils.isBlank(process.getDescription())
                  ? process.getDescription()
                  : process.getName());
          dataMap.put("status", statusMap.get("title").toString() + " (" + processName + ")");
          dataMap.put("total", statusMap.get("statusCount"));
          dataMapList.add(dataMap);
        });
  }

  @SuppressWarnings("unchecked")
  @Override
  public void getAssignedToOtherTask(
      WkfProcess process,
      String modelName,
      boolean isMetaModel,
      List<Map<String, Object>> dataMapList,
      User user) {

    Object[] obj =
        this.computeAssignedTaskConfig(
            process, modelName, isMetaModel, user, false, WkfDashboardCommonService.ASSIGNED_OTHER);

    List<Map<String, Object>> statusList = (List<Map<String, Object>>) obj[1];

    statusList.forEach(
        statusMap -> {
          Map<String, Object> dataMap = new HashMap<>();
          String processName =
              (!StringUtils.isBlank(process.getDescription())
                  ? process.getDescription()
                  : process.getName());
          dataMap.put("status", statusMap.get("title").toString() + " (" + processName + ")");
          dataMap.put("total", statusMap.get("statusCount"));
          dataMapList.add(dataMap);
        });
  }

  @Override
  public Object[] computeAssignedTaskConfig(
      WkfProcess process,
      String modelName,
      boolean isMetaModel,
      User user,
      boolean withTask,
      String assignedType) {

    List<WkfTaskConfig> taskConfigs =
        wkfDashboardCommonService.findTaskConfigs(process, modelName, isMetaModel, user, withTask);

    Object[] obj =
        wkfDashboardCommonService.computeTaskConfig(
            taskConfigs, modelName, isMetaModel, user, false, assignedType);

    return obj;
  }

  @Override
  public Map<String, Object> getStatusRecords(WkfModel wkfModel, String status, String type) {

    Map<String, Object> dataMap = new HashMap<>();
    List<WkfProcess> processList = wkfDashboardCommonService.findProcesses(wkfModel, null);

    for (WkfProcess process : processList) {

      WkfTaskConfig config =
          wkfTaskConfigRepo
              .all()
              .filter(
                  "self.description = ?1 AND self.processId = ?2 AND self.wkfModel = ?3",
                  status,
                  process.getProcessId(),
                  wkfModel)
              .fetchOne();

      if (config == null) {
        continue;
      }

      boolean isMetaModel = !StringUtils.isBlank(config.getModelName());
      String modelName = isMetaModel ? config.getModelName() : config.getJsonModelName();

      List<Long> recordIds =
          this.computeTaskConfig(status, config, isMetaModel, modelName, wkfModel, type);

      if (!CollectionUtils.isEmpty(recordIds)) {
        dataMap.put("modelName", modelName);
        dataMap.put("isMetaModel", isMetaModel);
        dataMap.put("recordIds", recordIds);
        return dataMap;
      }
    }
    return new HashMap<>();
  }

  @SuppressWarnings("unchecked")
  protected List<Long> computeTaskConfig(
      String status,
      WkfTaskConfig config,
      boolean isMetaModel,
      String modelName,
      WkfModel wkfModel,
      String type) {

    List<String> processInstanceIds =
        wkfInstanceService.findProcessInstanceByNode(
            config.getName(), config.getProcessId(), config.getType(), false);

    if (type.equals(WkfDashboardCommonService.ASSIGNED_ME)
        || type.equals(WkfDashboardCommonService.ASSIGNED_OTHER)) {
      return wkfDashboardCommonService.getStatusRecordIds(
          config, processInstanceIds, modelName, isMetaModel, AuthUtils.getUser(), type);

    } else if (type.equals(WkfDashboardCommonService.LATE_TASK)) {
      Map<String, Object> taskMap = new HashMap<>();
      wkfDashboardCommonService.getTasks(
          config, processInstanceIds, modelName, isMetaModel, null, taskMap, null, type);

      List<Long> lateTaskIds = (List<Long>) taskMap.get("lateTaskIds");
      return lateTaskIds;
    }
    return new ArrayList<>();
  }

  @Override
  public List<Map<String, Object>> getAvgTimePerUserData(WkfModel wkfModel, String unitType) {
    List<Map<String, Object>> dataMapList = new ArrayList<>();

    List<WkfProcess> processes = wkfDashboardCommonService.findProcesses(wkfModel, null);

    for (WkfProcess process : processes) {

      List<WkfTaskConfig> taskConfigs = getUserTaskConfigs(process);

      for (WkfTaskConfig config : taskConfigs) {
        List<String> processInstanceIds =
            wkfInstanceService.findProcessInstanceByNode(
                config.getName(), config.getProcessId(), config.getType(), true);

        boolean isMetaModel = StringUtils.isNotEmpty(config.getModelName());
        String modelName = isMetaModel ? config.getModelName() : config.getJsonModelName();
        String userPath = config.getUserPath();
        Map<Long, List<BigDecimal>> userTimeMap = new HashMap<>();

        String unit = this.getUnit(unitType);

        String qry =
            "SELECT CASE WHEN task.end_time_ IS NULL THEN "
                + "EXTRACT(EPOCH FROM NOW() - task.start_time_) / "
                + unit
                + " ELSE "
                + "EXTRACT(EPOCH FROM task.end_time_ - task.start_time_) / "
                + unit
                + " END AS time "
                + "FROM studio_wkf_task_config config "
                + "LEFT JOIN act_hi_taskinst task ON task.proc_def_id_ = config.process_id "
                + "WHERE "
                + "task.proc_def_id_ = :processInstanceId AND config.description = :desc "
                + "AND task.proc_inst_id_ = :instanceId";

        Query query = JPA.em().createNativeQuery(qry);
        query.setParameter("processInstanceId", config.getProcessId());
        query.setParameter("desc", config.getDescription());

        if (!isMetaModel) {
          List<MetaJsonRecord> jsonModelRecords =
              wkfDashboardCommonService.getMetaJsonRecords(
                  config, processInstanceIds, modelName, null, null, null, null);

          jsonModelRecords.forEach(
              record -> this.computeAvgTimePerUser(query, record, userPath, userTimeMap));
        } else {
          List<Model> modelRecords =
              wkfDashboardCommonService.getMetaModelRecords(
                  config, processInstanceIds, modelName, null, null, null, null);

          modelRecords.forEach(
              record -> this.computeAvgTimePerUser(query, record, userPath, userTimeMap));
        }

        userTimeMap.forEach(
            (key, value) -> {
              Map<String, Object> dataMap = new HashMap<>();
              dataMap.put("status", config.getDescription());
              dataMap.put(
                  "time",
                  value.stream()
                      .reduce(BigDecimal.ZERO, BigDecimal::add)
                      .divide(new BigDecimal(value.size()), RoundingMode.HALF_UP));
              dataMap.put("user", userRepo.find(key).getName());
              dataMapList.add(dataMap);
            });
      }
    }
    return dataMapList;
  }

  protected List<WkfTaskConfig> getUserTaskConfigs(WkfProcess wkfProcess) {
    return wkfTaskConfigRepo
        .all()
        .filter("self.processId = ? AND self.userPath IS NOT NULL", wkfProcess.getProcessId())
        .fetch();
  }

  protected String getUnit(String unitType) {
    return switch (unitType) {
      case "hours" -> "(60 * 60)";
      case "days" -> "((60 * 60) * 24)";
      default -> "60";
    };
  }

  protected void computeAvgTimePerUser(
      Query query, Model record, String userPath, Map<Long, List<BigDecimal>> userTimeMap) {

    query.setParameter("instanceId", record.getProcessInstanceId());
    FullContext wkfContext = new FullContext(record);
    User user = wkfUserActionService.getUser(userPath, wkfContext);
    BigDecimal time = BigDecimal.ZERO;
    if (!query.getResultList().isEmpty()) {
      for (Object t : query.getResultList()) {
        time = time.add((BigDecimal) t);
      }
    }

    List<BigDecimal> timeList = null;
    if (userTimeMap.containsKey(user.getId())) {
      timeList = userTimeMap.get(user.getId());
    } else {
      timeList = new ArrayList<>();
    }
    timeList.add(time);
    userTimeMap.put(user.getId(), timeList);
  }

  @Override
  public List<Map<String, Object>> getTaskDoneTodayPerUser(WkfModel wkfModel) {
    List<Map<String, Object>> dataMapList = new ArrayList<>();

    List<WkfProcess> processes = wkfDashboardCommonService.findProcesses(wkfModel, null);

    Map<Long, BigInteger> userMap = new HashMap<>();

    processes.stream()
        .map(this::getUserTaskConfigs)
        .forEach(
            taskConfigs ->
                taskConfigs.forEach(
                    config -> {
                      List<String> processInstanceIds =
                          wkfInstanceService.findProcessInstanceByNode(
                              config.getName(), config.getProcessId(), config.getType(), false);

                      boolean isMetaModel = StringUtils.isNotEmpty(config.getModelName());
                      String modelName =
                          isMetaModel ? config.getModelName() : config.getJsonModelName();
                      String userPath = config.getUserPath();

                      String qry =
                          "SELECT COUNT(task.id_) AS total "
                              + "FROM studio_wkf_task_config config "
                              + "LEFT JOIN act_hi_taskinst task ON task.proc_def_id_ = config.process_id "
                              + "WHERE "
                              + "task.proc_def_id_ = :processInstanceId AND config.description = :desc "
                              + "AND task.proc_inst_id_ = :instanceId "
                              + "AND DATE(task.end_time_) = CURRENT_DATE";

                      Query query = JPA.em().createNativeQuery(qry);
                      query.setParameter("processInstanceId", config.getProcessId());
                      query.setParameter("desc", config.getDescription());

                      if (!isMetaModel) {
                        List<MetaJsonRecord> jsonModelRecords =
                            wkfDashboardCommonService.getMetaJsonRecords(
                                config, processInstanceIds, modelName, null, null, null, null);

                        jsonModelRecords.forEach(
                            record ->
                                this.computeTaskDonePerUser(query, record, userPath, userMap));
                      } else {
                        List<Model> modelRecords =
                            wkfDashboardCommonService.getMetaModelRecords(
                                config, processInstanceIds, modelName, null, null, null, null);

                        modelRecords.forEach(
                            record ->
                                this.computeTaskDonePerUser(query, record, userPath, userMap));
                      }
                    }));

    userMap.forEach(
        (key, value) -> {
          Map<String, Object> dataMap = new HashMap<>();
          dataMap.put("user", userRepo.find(key).getName());
          dataMap.put("total", value);
          dataMapList.add(dataMap);
        });
    return dataMapList;
  }

  protected void computeTaskDonePerUser(
      Query query, Model record, String userPath, Map<Long, BigInteger> userMap) {

    query.setParameter("instanceId", record.getProcessInstanceId());
    FullContext wkfContext = new FullContext(record);
    User user = wkfUserActionService.getUser(userPath, wkfContext);
    BigInteger recCnt = (BigInteger) query.getSingleResult();

    if (userMap.containsKey(user.getId())) {
      recCnt = recCnt.add(userMap.get(user.getId()));
    }
    userMap.put(user.getId(), recCnt);
  }

  @Override
  public List<Map<String, Object>> getTaskToDoPerUser(WkfModel wkfModel) {
    List<Map<String, Object>> dataMapList = new ArrayList<>();

    List<WkfProcess> processes = wkfDashboardCommonService.findProcesses(wkfModel, null);

    int userCnt = 1;
    Map<Long, Integer> userMap = new HashMap<>();
    for (WkfProcess process : processes) {
      List<WkfTaskConfig> taskConfigs = getUserTaskConfigs(process);

      for (WkfTaskConfig config : taskConfigs) {
        List<String> processInstanceIds =
            wkfInstanceService.findProcessInstanceByNode(
                config.getName(), config.getProcessId(), config.getType(), false);

        boolean isMetaModel = StringUtils.isNotEmpty(config.getModelName());
        String modelName = isMetaModel ? config.getModelName() : config.getJsonModelName();
        String userPath = config.getUserPath();

        if (!isMetaModel) {
          List<MetaJsonRecord> jsonModelRecords =
              wkfDashboardCommonService.getMetaJsonRecords(
                  config,
                  processInstanceIds,
                  modelName,
                  null,
                  WkfDashboardCommonService.TASK_TODAY,
                  null,
                  LocalDate.now());

          for (MetaJsonRecord record : jsonModelRecords) {
            FullContext wkfContext = new FullContext(record);
            User user = wkfUserActionService.getUser(userPath, wkfContext);

            if (userMap.containsKey(user.getId())) {
              userCnt = userMap.get(user.getId()) + 1;
            }
            userMap.put(user.getId(), userCnt);
          }
        } else {
          List<Model> modelRecords =
              wkfDashboardCommonService.getMetaModelRecords(
                  config,
                  processInstanceIds,
                  modelName,
                  null,
                  WkfDashboardCommonService.TASK_TODAY,
                  null,
                  LocalDate.now());

          for (Model record : modelRecords) {
            FullContext wkfContext = new FullContext(record);
            User user = wkfUserActionService.getUser(userPath, wkfContext);

            if (userMap.containsKey(user.getId())) {
              userCnt = userMap.get(user.getId()) + 1;
            }
            userMap.put(user.getId(), userCnt);
          }
        }
      }
    }

    for (Entry<Long, Integer> entry : userMap.entrySet()) {
      if (entry.getValue() == 0) {
        continue;
      }
      Map<String, Object> dataMap = new HashMap<>();
      dataMap.put("user", userRepo.find(entry.getKey()).getName());
      dataMap.put("total", entry.getValue());
      dataMapList.add(dataMap);
    }
    return dataMapList;
  }
}
