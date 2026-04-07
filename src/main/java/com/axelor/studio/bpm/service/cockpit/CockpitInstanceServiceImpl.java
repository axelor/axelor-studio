/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.db.JPA;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.studio.bpm.dto.ActivityDataDto;
import com.axelor.studio.bpm.dto.BranchDistributionDto;
import com.axelor.studio.bpm.dto.InstanceCountsDto;
import com.axelor.studio.bpm.dto.InstanceSummaryDto;
import com.axelor.studio.bpm.dto.LinkedObjectDto;
import com.axelor.studio.bpm.dto.NodeDetailDto;
import com.axelor.studio.bpm.dto.NodeDurationDto;
import com.axelor.studio.bpm.dto.NodeDurationStatsDto;
import com.axelor.studio.bpm.dto.PassageDto;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import jakarta.inject.Inject;
import jakarta.persistence.Query;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Assembles instance-level DTOs by orchestrating {@link CockpitCamundaQueryService} for Camunda
 * data and JPA queries for WkfInstance/WkfProcess/WkfProcessConfig resolution.
 */
public class CockpitInstanceServiceImpl implements CockpitInstanceService {

  protected final CockpitCamundaQueryService queryService;
  protected final WkfModelRepository wkfModelRepository;
  protected final WkfInstanceRepository wkfInstanceRepository;
  protected final MetaModelRepository metaModelRepository;

  @Inject
  public CockpitInstanceServiceImpl(
      CockpitCamundaQueryService queryService,
      WkfModelRepository wkfModelRepository,
      WkfInstanceRepository wkfInstanceRepository,
      MetaModelRepository metaModelRepository) {
    this.queryService = queryService;
    this.wkfModelRepository = wkfModelRepository;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.metaModelRepository = metaModelRepository;
  }

  @Override
  public List<InstanceSummaryDto> getInstances(
      long processId, String status, int offset, int limit, String search) {
    String processDefinitionKey = resolveProcessDefinitionKey(processId);
    if (processDefinitionKey == null) {
      return Collections.emptyList();
    }

    int totalFlowNodes = queryService.countFlowNodes(processDefinitionKey);

    List<Object[]> rows =
        queryService.findHistoricInstances(processDefinitionKey, status, offset, limit, null);

    List<InstanceSummaryDto> result = new ArrayList<>();
    for (Object[] row : rows) {
      String instanceId = (String) row[0];
      String state = (String) row[2];
      Timestamp startTs = (Timestamp) row[3];
      Timestamp endTs = (Timestamp) row[4];
      long durationMs = toLong(row[5]);

      WkfInstance wkfInstance = wkfInstanceRepository.findByInstanceId(instanceId);

      List<LinkedObjectDto> linkedObjects = resolveLinkedObjects(wkfInstance);

      boolean hasError = wkfInstance != null && Boolean.TRUE.equals(wkfInstance.getInstanceError());
      String errorMessage = wkfInstance != null ? wkfInstance.getCurrentError() : null;
      String currentNode = wkfInstance != null ? wkfInstance.getNode() : null;

      // Progress: distinct visited activities / total flow nodes
      double progress = 0.0;
      if (totalFlowNodes > 0) {
        Map<String, Integer> passCounts = queryService.getActivityPassCounts(instanceId);
        progress = (double) passCounts.size() / totalFlowNodes;
        if (progress > 1.0) {
          progress = 1.0;
        }
      }

      // Apply search filter client-side if provided (on instanceId, currentNode, linked objects)
      if (search != null && !search.isEmpty()) {
        String searchLower = search.toLowerCase();
        boolean matches = instanceId.toLowerCase().contains(searchLower);
        if (!matches && currentNode != null) {
          matches = currentNode.toLowerCase().contains(searchLower);
        }
        if (!matches) {
          for (LinkedObjectDto obj : linkedObjects) {
            if (obj.displayName() != null
                && obj.displayName().toLowerCase().contains(searchLower)) {
              matches = true;
              break;
            }
          }
        }
        if (!matches) {
          continue;
        }
      }

      result.add(
          new InstanceSummaryDto(
              instanceId,
              processDefinitionKey,
              state,
              startTs != null ? startTs.toInstant().toString() : null,
              endTs != null ? endTs.toInstant().toString() : null,
              durationMs,
              progress,
              linkedObjects,
              hasError,
              errorMessage,
              currentNode));
    }
    return result;
  }

  @Override
  public long getInstanceCount(long processId, String status, String search) {
    String processDefinitionKey = resolveProcessDefinitionKey(processId);
    if (processDefinitionKey == null) {
      return 0;
    }
    return queryService.countHistoricInstances(processDefinitionKey, status, search);
  }

  @Override
  public InstanceCountsDto getInstanceCounts(long processId) {
    String processDefinitionKey = resolveProcessDefinitionKey(processId);
    if (processDefinitionKey == null) {
      return new InstanceCountsDto(0, 0, 0, 0);
    }
    return queryService.getInstanceCounts(processDefinitionKey);
  }

  @Override
  public List<ActivityDataDto> getInstanceActivities(String processInstanceId) {
    List<String> activeIds = queryService.getActiveActivityIds(processInstanceId);
    Set<String> activeSet = new HashSet<>(activeIds);
    Map<String, Integer> passCounts = queryService.getActivityPassCounts(processInstanceId);
    List<Object[]> activities = queryService.getHistoricActivities(processInstanceId);

    // Deduplicate by activity ID, keeping the latest entry
    Map<String, ActivityDataDto> activityMap = new HashMap<>();
    for (Object[] row : activities) {
      String activityId = (String) row[0];
      String activityName = (String) row[1];
      String activityType = (String) row[2];
      Long durationMs = row[5] != null ? toLong(row[5]) : null;

      activityMap.put(
          activityId,
          new ActivityDataDto(
              activityId,
              activityName,
              activityType,
              activeSet.contains(activityId),
              passCounts.getOrDefault(activityId, 0),
              durationMs));
    }

    return new ArrayList<>(activityMap.values());
  }

  @Override
  public NodeDetailDto getNodeDetail(
      String processInstanceId, String activityId, String processDefinitionKey) {
    List<Object[]> activities = queryService.getHistoricActivities(processInstanceId);

    String activityName = null;
    String activityType = null;
    long totalDuration = 0;
    long workDuration = 0;
    String assignee = null;
    String assignmentDate = null;
    List<PassageDto> passages = new ArrayList<>();

    for (Object[] row : activities) {
      if (!activityId.equals(row[0])) {
        continue;
      }
      if (activityName == null) {
        activityName = (String) row[1];
        activityType = (String) row[2];
      }
      Timestamp startTs = (Timestamp) row[3];
      Timestamp endTs = (Timestamp) row[4];
      long dur = row[5] != null ? toLong(row[5]) : 0;
      String passAssignee = (String) row[6];

      workDuration += dur;

      if (assignee == null && passAssignee != null) {
        assignee = passAssignee;
        assignmentDate = startTs != null ? startTs.toInstant().toString() : null;
      }

      passages.add(
          new PassageDto(
              startTs != null ? startTs.toInstant().toString() : null,
              endTs != null ? endTs.toInstant().toString() : null,
              dur,
              passAssignee));
    }

    // Total duration = time from first start to last end (or now)
    if (!passages.isEmpty()) {
      // Use the work duration sum as total; idle = 0 for simplicity
      // A more precise calculation would track first-start to last-end
      totalDuration = workDuration;
    }
    long idleDuration = Math.max(0, totalDuration - workDuration);

    NodeDurationDto duration = new NodeDurationDto(totalDuration, workDuration, idleDuration);

    // Duration stats across all instances (if processDefinitionKey is available)
    NodeDurationStatsDto durationStats = null;
    if (processDefinitionKey != null) {
      Map<String, NodeDurationStatsDto> statsMap =
          queryService.getNodeDurationStats(processDefinitionKey);
      durationStats = statsMap.get(activityId);
    }

    // Candidate groups: query task identity links
    List<String> candidateGroups = getCandidateGroups(processInstanceId, activityId);

    // Branch distribution: only for gateways
    List<BranchDistributionDto> branches = Collections.emptyList();
    if (activityType != null && activityType.toLowerCase().contains("gateway")) {
      branches = getBranchDistributionInternal(processInstanceId, activityId);
    }

    return new NodeDetailDto(
        activityId,
        activityName,
        activityType,
        duration,
        durationStats,
        assignee,
        candidateGroups,
        assignmentDate,
        passages,
        branches);
  }

  @Override
  public List<BranchDistributionDto> getBranchDistribution(
      String processDefinitionKey, String gatewayId) {
    return getBranchDistributionForProcess(processDefinitionKey, gatewayId);
  }

  @Override
  public String getInstanceXml(long processId) {
    WkfModel model = wkfModelRepository.find(processId);
    if (model == null) {
      return null;
    }
    // The diagram XML stored on the model is the authoritative BPMN source and is identical
    // for all instances; no instance lookup is needed.
    return model.getDiagramXml();
  }

  // ---- Private helpers ----

  /**
   * Resolves the process definition key for a WkfModel ID. The key is the name of the first
   * WkfProcess in the model, sorted alphabetically for deterministic selection. For multi-process
   * models this is a best-effort heuristic — the primary process is not formally identified in the
   * data model.
   */
  private String resolveProcessDefinitionKey(long processId) {
    WkfModel model = wkfModelRepository.find(processId);
    if (model == null) {
      return null;
    }
    List<WkfProcess> processes = model.getWkfProcessList();
    if (processes == null || processes.isEmpty()) {
      return null;
    }
    return processes.stream()
        .map(WkfProcess::getName)
        .sorted()
        .findFirst()
        .orElse(null);
  }

  /** Resolves linked business objects from a WkfInstance. */
  private List<LinkedObjectDto> resolveLinkedObjects(WkfInstance wkfInstance) {
    if (wkfInstance == null) {
      return Collections.emptyList();
    }
    String modelName = wkfInstance.getModelName();
    Long modelId = wkfInstance.getModelId();
    if (modelName == null || modelId == null || modelId == 0) {
      return Collections.emptyList();
    }

    List<LinkedObjectDto> result = new ArrayList<>();
    MetaModel metaModel =
        metaModelRepository.all().filter("self.name = :name").bind("name", modelName).fetchOne();
    if (metaModel != null) {
      String fullName = metaModel.getFullName();
      String displayName = resolveRecordDisplayName(fullName, modelId);
      result.add(new LinkedObjectDto(modelName, fullName, modelId, displayName));
    }
    return result;
  }

  /**
   * Resolves the display name for a business record. Uses JPA.all() with a Model subclass to query
   * by ID and calls toString() on the result.
   */
  @SuppressWarnings("unchecked")
  private String resolveRecordDisplayName(String fullName, long recordId) {
    try {
      Class<?> klass = Class.forName(fullName);
      if (!com.axelor.db.Model.class.isAssignableFrom(klass)) {
        return null;
      }
      Class<? extends com.axelor.db.Model> modelClass =
          (Class<? extends com.axelor.db.Model>) klass;
      com.axelor.db.Model record =
          JPA.all(modelClass).filter("self.id = :id").bind("id", recordId).fetchOne();
      if (record != null) {
        return record.toString();
      }
    } catch (ClassNotFoundException e) {
      // Model class not found — return null
    }
    return null;
  }

  /** Gets candidate groups for a task activity from identity links. */
  @SuppressWarnings("unchecked")
  private List<String> getCandidateGroups(String processInstanceId, String activityId) {
    try {
      Query query =
          JPA.em()
              .createNativeQuery(
                  "SELECT DISTINCT il.group_id_ FROM act_hi_identitylink il"
                      + " JOIN act_hi_taskinst t ON il.task_id_ = t.id_"
                      + " WHERE t.proc_inst_id_ = :pid AND t.task_def_key_ = :actId"
                      + " AND il.type_ = 'candidate' AND il.group_id_ IS NOT NULL");
      query.setParameter("pid", processInstanceId);
      query.setParameter("actId", activityId);
      return query.getResultList();
    } catch (Exception e) {
      return Collections.emptyList();
    }
  }

  /** Gets branch distribution for a gateway within a specific instance. */
  @SuppressWarnings("unchecked")
  private List<BranchDistributionDto> getBranchDistributionInternal(
      String processInstanceId, String gatewayId) {
    // Only consider activities that started within 1 second of the gateway ending,
    // to approximate immediate successors rather than all post-gateway activities.
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT act_id_, act_name_, COUNT(*) FROM act_hi_actinst"
                    + " WHERE proc_inst_id_ = :pid"
                    + " AND act_type_ NOT IN ('multiInstanceBody', 'sequenceFlow')"
                    + " AND start_time_ > (SELECT MAX(end_time_) FROM act_hi_actinst"
                    + "   WHERE proc_inst_id_ = :pid AND act_id_ = :gid)"
                    + " AND start_time_ <= (SELECT MAX(end_time_) + INTERVAL '1 second'"
                    + "   FROM act_hi_actinst"
                    + "   WHERE proc_inst_id_ = :pid AND act_id_ = :gid)"
                    + " GROUP BY act_id_, act_name_"
                    + " ORDER BY COUNT(*) DESC");
    query.setParameter("pid", processInstanceId);
    query.setParameter("gid", gatewayId);

    List<Object[]> rows = query.getResultList();
    return buildBranchDistribution(rows);
  }

  /** Gets branch distribution for a gateway across all instances of a process. */
  @SuppressWarnings("unchecked")
  private List<BranchDistributionDto> getBranchDistributionForProcess(
      String processDefinitionKey, String gatewayId) {
    // Only consider activities that started within 1 second of the gateway ending,
    // to approximate immediate successors rather than all post-gateway activities.
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT a2.act_id_, a2.act_name_, COUNT(*)"
                    + " FROM act_hi_actinst a2"
                    + " WHERE a2.proc_inst_id_ IN"
                    + "   (SELECT proc_inst_id_ FROM act_hi_procinst"
                    + "    WHERE proc_def_key_ = :key)"
                    + " AND a2.act_type_ NOT IN ('multiInstanceBody', 'sequenceFlow')"
                    + " AND a2.start_time_ > ("
                    + "   SELECT MAX(a1.end_time_) FROM act_hi_actinst a1"
                    + "   WHERE a1.proc_inst_id_ = a2.proc_inst_id_"
                    + "     AND a1.act_id_ = :gid)"
                    + " AND a2.start_time_ <= ("
                    + "   SELECT MAX(a1.end_time_) + INTERVAL '1 second' FROM act_hi_actinst a1"
                    + "   WHERE a1.proc_inst_id_ = a2.proc_inst_id_"
                    + "     AND a1.act_id_ = :gid)"
                    + " GROUP BY a2.act_id_, a2.act_name_"
                    + " ORDER BY COUNT(*) DESC"
                    + " LIMIT 10");
    query.setParameter("key", processDefinitionKey);
    query.setParameter("gid", gatewayId);

    List<Object[]> rows = query.getResultList();
    return buildBranchDistribution(rows);
  }

  private List<BranchDistributionDto> buildBranchDistribution(List<Object[]> rows) {
    int total = 0;
    for (Object[] row : rows) {
      total += ((Number) row[2]).intValue();
    }
    List<BranchDistributionDto> result = new ArrayList<>();
    for (Object[] row : rows) {
      int count = ((Number) row[2]).intValue();
      double percentage = total > 0 ? (count * 100.0) / total : 0.0;
      result.add(new BranchDistributionDto((String) row[0], (String) row[1], count, percentage));
    }
    return result;
  }

  private static long toLong(Object value) {
    if (value == null) {
      return 0L;
    }
    if (value instanceof Number number) {
      return number.longValue();
    }
    return Long.parseLong(value.toString());
  }
}
