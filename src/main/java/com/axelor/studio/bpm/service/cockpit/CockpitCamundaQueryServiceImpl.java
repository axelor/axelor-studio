/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.db.JPA;
import com.axelor.studio.bpm.dto.AnalyticsNodeDurationDto;
import com.axelor.studio.bpm.dto.AssigneeThroughputDto;
import com.axelor.studio.bpm.dto.CalendarHeatmapDto;
import com.axelor.studio.bpm.dto.InstanceCountsDto;
import com.axelor.studio.bpm.dto.MonthlyProcessCountDto;
import com.axelor.studio.bpm.dto.NodeDurationStatsDto;
import com.axelor.studio.bpm.dto.SankeyLinkDto;
import com.axelor.studio.bpm.dto.StatusCountDto;
import com.axelor.studio.bpm.dto.StatusTrendDto;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.repo.WkfModelRepository;
import jakarta.inject.Inject;
import jakarta.persistence.Query;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Encapsulates ALL Camunda data access (native SQL on act_* tables + Axelor JPA queries on
 * WkfModel). No other cockpit service should import Camunda APIs or reference act_* tables.
 */
public class CockpitCamundaQueryServiceImpl implements CockpitCamundaQueryService {

  protected final WkfModelRepository wkfModelRepository;

  @Inject
  public CockpitCamundaQueryServiceImpl(WkfModelRepository wkfModelRepository) {
    this.wkfModelRepository = wkfModelRepository;
  }

  @Override
  public List<WkfModel> findDeployedModels() {
    return wkfModelRepository
        .all()
        .filter("self.statusSelect IN (:onGoing, :terminated)")
        .bind("onGoing", WkfModelRepository.STATUS_ON_GOING)
        .bind("terminated", WkfModelRepository.STATUS_TERMINATED)
        .fetch();
  }

  @Override
  public long countRunningInstances(String processDefinitionKey) {
    return countByState(processDefinitionKey, "ACTIVE");
  }

  @Override
  public long countFailedInstances(String processDefinitionKey) {
    return countByState(processDefinitionKey, "INTERNALLY_TERMINATED");
  }

  @Override
  public long countCompletedInstances(String processDefinitionKey) {
    return countByState(processDefinitionKey, "COMPLETED");
  }

  private long countByState(String processDefinitionKey, String state) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(*) FROM act_hi_procinst"
                    + " WHERE proc_def_key_ = :key AND state_ = :state");
    query.setParameter("key", processDefinitionKey);
    query.setParameter("state", state);
    return toLong(query.getSingleResult());
  }

  @Override
  public long countOpenIncidents(String processDefinitionKey) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(*) FROM act_ru_incident i"
                    + " JOIN act_ru_execution e ON i.proc_inst_id_ = e.proc_inst_id_"
                    + " WHERE e.proc_def_key_ = :key");
    query.setParameter("key", processDefinitionKey);
    return toLong(query.getSingleResult());
  }

  @Override
  public Double averageCycleTimeMinutes(String processDefinitionKey) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT AVG(EXTRACT(EPOCH FROM (end_time_ - start_time_)) / 60.0)"
                    + " FROM act_hi_procinst"
                    + " WHERE proc_def_key_ = :key AND state_ = 'COMPLETED'");
    query.setParameter("key", processDefinitionKey);
    Object result = query.getSingleResult();
    if (result == null) {
      return null;
    }
    return toDouble(result);
  }

  @Override
  public Double slaCompliancePercent(String processDefinitionKey, int targetMinutes) {
    Query totalQuery =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(*) FROM act_hi_procinst"
                    + " WHERE proc_def_key_ = :key AND state_ = 'COMPLETED'");
    totalQuery.setParameter("key", processDefinitionKey);
    long total = toLong(totalQuery.getSingleResult());

    if (total == 0) {
      return null;
    }

    Query withinTargetQuery =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(*) FROM act_hi_procinst"
                    + " WHERE proc_def_key_ = :key AND state_ = 'COMPLETED'"
                    + " AND EXTRACT(EPOCH FROM (end_time_ - start_time_)) / 60.0 <= :target");
    withinTargetQuery.setParameter("key", processDefinitionKey);
    withinTargetQuery.setParameter("target", (double) targetMinutes);
    long withinTarget = toLong(withinTargetQuery.getSingleResult());

    return (withinTarget * 100.0) / total;
  }

  @Override
  public long countTasksDueToday() {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(*) FROM act_ru_task"
                    + " WHERE due_date_ IS NOT NULL"
                    + " AND CAST(due_date_ AS DATE) = CURRENT_DATE");
    return toLong(query.getSingleResult());
  }

  @Override
  public long countTasksOverdue() {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(*) FROM act_ru_task"
                    + " WHERE due_date_ IS NOT NULL AND due_date_ < NOW()");
    return toLong(query.getSingleResult());
  }

  @Override
  public long countTasksUpcoming(int daysAhead) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(*) FROM act_ru_task"
                    + " WHERE due_date_ IS NOT NULL"
                    + " AND due_date_ > NOW()"
                    + " AND due_date_ <= NOW() + CAST(:interval AS INTERVAL)");
    query.setParameter("interval", daysAhead + " days");
    return toLong(query.getSingleResult());
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<StatusCountDto> countInstancesByStatus() {
    Query query =
        JPA.em().createNativeQuery("SELECT state_, COUNT(*) FROM act_hi_procinst GROUP BY state_");
    List<Object[]> rows = query.getResultList();
    List<StatusCountDto> result = new ArrayList<>();
    for (Object[] row : rows) {
      result.add(new StatusCountDto((String) row[0], toLong(row[1])));
    }
    return result;
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<MonthlyProcessCountDto> monthlyInstanceCounts(String period) {
    Timestamp since = periodToTimestamp(period);
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT TO_CHAR(start_time_, 'YYYY-MM') AS month, proc_def_key_, COUNT(*)"
                    + " FROM act_hi_procinst"
                    + " WHERE start_time_ >= :since"
                    + " GROUP BY TO_CHAR(start_time_, 'YYYY-MM'), proc_def_key_"
                    + " ORDER BY TO_CHAR(start_time_, 'YYYY-MM')");
    query.setParameter("since", since);
    List<Object[]> rows = query.getResultList();
    List<MonthlyProcessCountDto> result = new ArrayList<>();
    for (Object[] row : rows) {
      result.add(new MonthlyProcessCountDto((String) row[0], (String) row[1], toLong(row[2])));
    }
    return result;
  }

  @Override
  public long countCurrentlyRunningTotal() {
    Query query =
        JPA.em().createNativeQuery("SELECT COUNT(*) FROM act_hi_procinst WHERE state_ = 'ACTIVE'");
    return toLong(query.getSingleResult());
  }

  @Override
  public long countEndedInPeriod(String period) {
    Timestamp since = periodToTimestamp(period);
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(*) FROM act_hi_procinst"
                    + " WHERE state_ = 'COMPLETED' AND end_time_ >= :since");
    query.setParameter("since", since);
    return toLong(query.getSingleResult());
  }

  // ---- Instance-level queries (Phase 51) ----

  @SuppressWarnings("unchecked")
  @Override
  public List<Object[]> findHistoricInstances(
      String processDefinitionKey, String statusFilter, int offset, int limit, String sortOrder) {
    StringBuilder sql =
        new StringBuilder(
            "SELECT proc_inst_id_, proc_def_key_, state_, start_time_, end_time_,"
                + " EXTRACT(EPOCH FROM (COALESCE(end_time_, NOW()) - start_time_)) * 1000"
                + " AS duration_ms"
                + " FROM act_hi_procinst WHERE proc_def_key_ = :key");
    if (statusFilter != null && !statusFilter.isEmpty()) {
      sql.append(" AND state_ = :state");
    }
    sql.append(
        " ORDER BY CASE state_"
            + " WHEN 'INTERNALLY_TERMINATED' THEN 0"
            + " WHEN 'SUSPENDED' THEN 1"
            + " WHEN 'ACTIVE' THEN 2"
            + " ELSE 3 END, start_time_");
    sql.append("asc".equalsIgnoreCase(sortOrder) ? " ASC" : " DESC");

    Query query = JPA.em().createNativeQuery(sql.toString());
    query.setParameter("key", processDefinitionKey);
    if (statusFilter != null && !statusFilter.isEmpty()) {
      query.setParameter("state", statusFilter);
    }
    query.setFirstResult(offset);
    query.setMaxResults(limit);
    return query.getResultList();
  }

  @Override
  public long countHistoricInstances(
      String processDefinitionKey, String statusFilter, String search) {
    StringBuilder sql =
        new StringBuilder("SELECT COUNT(*) FROM act_hi_procinst WHERE proc_def_key_ = :key");
    if (statusFilter != null && !statusFilter.isEmpty()) {
      sql.append(" AND state_ = :state");
    }
    if (search != null && !search.isEmpty()) {
      sql.append(" AND proc_inst_id_ LIKE :search");
    }
    Query query = JPA.em().createNativeQuery(sql.toString());
    query.setParameter("key", processDefinitionKey);
    if (statusFilter != null && !statusFilter.isEmpty()) {
      query.setParameter("state", statusFilter);
    }
    if (search != null && !search.isEmpty()) {
      query.setParameter("search", "%" + search + "%");
    }
    return toLong(query.getSingleResult());
  }

  @Override
  public InstanceCountsDto getInstanceCounts(String processDefinitionKey) {
    long running = countRunningInstances(processDefinitionKey);
    long completed = countCompletedInstances(processDefinitionKey);
    long failed = countFailedInstances(processDefinitionKey);
    long suspended = countByState(processDefinitionKey, "SUSPENDED");
    return new InstanceCountsDto(running, completed, failed, suspended);
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<String> getActiveActivityIds(String processInstanceId) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT act_id_ FROM act_ru_execution"
                    + " WHERE proc_inst_id_ = :pid AND act_id_ IS NOT NULL");
    query.setParameter("pid", processInstanceId);
    try {
      return query.getResultList();
    } catch (Exception e) {
      return Collections.emptyList();
    }
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<Object[]> getHistoricActivities(String processInstanceId) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT act_id_, act_name_, act_type_,"
                    + " start_time_, end_time_, duration_, assignee_"
                    + " FROM act_hi_actinst"
                    + " WHERE proc_inst_id_ = :pid"
                    + " AND act_type_ NOT IN ('multiInstanceBody', 'sequenceFlow')"
                    + " ORDER BY start_time_ ASC");
    query.setParameter("pid", processInstanceId);
    return query.getResultList();
  }

  @SuppressWarnings("unchecked")
  @Override
  public Map<String, Integer> getActivityPassCounts(String processInstanceId) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT act_id_, COUNT(*) FROM act_hi_actinst"
                    + " WHERE proc_inst_id_ = :pid"
                    + " AND act_type_ NOT IN ('multiInstanceBody', 'sequenceFlow')"
                    + " GROUP BY act_id_");
    query.setParameter("pid", processInstanceId);
    List<Object[]> rows = query.getResultList();
    Map<String, Integer> result = new HashMap<>();
    for (Object[] row : rows) {
      result.put((String) row[0], ((Number) row[1]).intValue());
    }
    return result;
  }

  @SuppressWarnings("unchecked")
  @Override
  public Map<String, NodeDurationStatsDto> getNodeDurationStats(String processDefinitionKey) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT a.act_id_,"
                    + " AVG(a.duration_) AS avg_duration,"
                    + " MIN(a.duration_) AS min_duration,"
                    + " MAX(a.duration_) AS max_duration,"
                    + " COUNT(*) AS pass_count"
                    + " FROM act_hi_actinst a"
                    + " WHERE a.proc_inst_id_ IN"
                    + "   (SELECT proc_inst_id_ FROM act_hi_procinst WHERE proc_def_key_ = :key)"
                    + " AND a.act_type_ NOT IN ('multiInstanceBody', 'sequenceFlow')"
                    + " GROUP BY a.act_id_");
    query.setParameter("key", processDefinitionKey);
    List<Object[]> rows = query.getResultList();
    Map<String, NodeDurationStatsDto> result = new HashMap<>();
    for (Object[] row : rows) {
      String activityId = (String) row[0];
      long avg = toLong(row[1]);
      long min = toLong(row[2]);
      long max = toLong(row[3]);
      int count = ((Number) row[4]).intValue();
      result.put(activityId, new NodeDurationStatsDto(avg, min, max, count));
    }
    return result;
  }

  @Override
  public String getProcessDefinitionXml(String processDefinitionId) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT r.bytes_ FROM act_ge_bytearray r"
                    + " JOIN act_re_procdef p ON p.deployment_id_ = r.deployment_id_"
                    + " WHERE p.id_ = :defId AND r.name_ LIKE '%.bpmn'");
    query.setParameter("defId", processDefinitionId);
    try {
      Object result = query.getSingleResult();
      if (result instanceof byte[] bytes) {
        return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
      }
      return result != null ? result.toString() : null;
    } catch (Exception e) {
      return null;
    }
  }

  @Override
  public int countFlowNodes(String processDefinitionKey) {
    // Limitation (v1): counts distinct activity IDs executed across all historic instances,
    // not the total number of flow nodes defined in the BPMN model. Activities that have never
    // been reached will not be counted, making the denominator a lower bound. The caller caps
    // progress at 1.0 so overflow is not possible, but the value may be understated for
    // processes with unreachable branches.
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT COUNT(DISTINCT act_id_) FROM act_hi_actinst"
                    + " WHERE proc_inst_id_ IN"
                    + "   (SELECT proc_inst_id_ FROM act_hi_procinst WHERE proc_def_key_ = :key)"
                    + " AND act_type_ NOT IN"
                    + "   ('multiInstanceBody', 'sequenceFlow', 'compensationBoundaryCatch')");
    query.setParameter("key", processDefinitionKey);
    int count = ((Number) query.getSingleResult()).intValue();
    // Return at least 1 to avoid division-by-zero when no history exists yet
    return count > 0 ? count : 1;
  }

  // ---- Analytics queries (Phase 52) ----

  @SuppressWarnings("unchecked")
  @Override
  public List<AnalyticsNodeDurationDto> queryNodeDurationStats(
      String processDefKey, LocalDateTime since) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT a.act_id_, a.act_name_, a.act_type_,"
                    + " AVG(a.duration_) AS avg_duration,"
                    + " MIN(a.duration_) AS min_duration,"
                    + " MAX(a.duration_) AS max_duration,"
                    + " COUNT(*) AS pass_count,"
                    + " PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY a.duration_) AS p50,"
                    + " PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY a.duration_) AS p95,"
                    + " PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY a.duration_) AS p99,"
                    + " SUM(a.duration_) AS total_duration"
                    + " FROM act_hi_actinst a"
                    + " WHERE a.proc_inst_id_ IN"
                    + "   (SELECT proc_inst_id_ FROM act_hi_procinst"
                    + "    WHERE proc_def_key_ = :key AND start_time_ >= :since)"
                    + " AND a.act_type_ NOT IN ('multiInstanceBody', 'sequenceFlow')"
                    + " AND a.end_time_ IS NOT NULL"
                    + " GROUP BY a.act_id_, a.act_name_, a.act_type_");
    query.setParameter("key", processDefKey);
    query.setParameter("since", Timestamp.valueOf(since));
    List<Object[]> rows = query.getResultList();
    List<AnalyticsNodeDurationDto> result = new ArrayList<>();
    for (Object[] row : rows) {
      long totalDur = toLong(row[10]);
      // Initial approximation: workDuration = totalDuration, idleDuration = 0
      result.add(
          new AnalyticsNodeDurationDto(
              (String) row[0],
              (String) row[1],
              (String) row[2],
              toLong(row[3]),
              toLong(row[4]),
              toLong(row[5]),
              ((Number) row[6]).intValue(),
              toLong(row[7]),
              toLong(row[8]),
              toLong(row[9]),
              totalDur,
              totalDur,
              0L));
    }
    return result;
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<StatusTrendDto> queryStatusTrend(
      String processDefKey, LocalDateTime since, String granularity) {
    if (!Set.of("HOUR", "DAY", "WEEK", "MONTH").contains(granularity)) {
      throw new IllegalArgumentException("Invalid granularity: " + granularity);
    }
    String sql =
        "SELECT DATE_TRUNC('"
            + granularity
            + "', start_time_) AS time_bucket, state_, COUNT(*)"
            + " FROM act_hi_procinst"
            + " WHERE proc_def_key_ = :key AND start_time_ >= :since"
            + " GROUP BY DATE_TRUNC('"
            + granularity
            + "', start_time_), state_"
            + " ORDER BY time_bucket";
    Query query = JPA.em().createNativeQuery(sql);
    query.setParameter("key", processDefKey);
    query.setParameter("since", Timestamp.valueOf(since));
    List<Object[]> rows = query.getResultList();

    // Pivot: group by time_bucket, accumulate running/completed/failed
    Map<String, int[]> buckets = new java.util.LinkedHashMap<>();
    for (Object[] row : rows) {
      String bucket = row[0].toString();
      String state = (String) row[1];
      int count = ((Number) row[2]).intValue();
      int[] counts = buckets.computeIfAbsent(bucket, k -> new int[3]);
      switch (state) {
        case "ACTIVE":
          counts[0] += count;
          break;
        case "COMPLETED":
          counts[1] += count;
          break;
        case "INTERNALLY_TERMINATED":
          counts[2] += count;
          break;
        default:
          break;
      }
    }
    List<StatusTrendDto> result = new ArrayList<>();
    for (Map.Entry<String, int[]> entry : buckets.entrySet()) {
      int[] c = entry.getValue();
      result.add(new StatusTrendDto(entry.getKey(), c[0], c[1], c[2]));
    }
    return result;
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<AssigneeThroughputDto> queryAssigneeThroughput(
      String processDefKey, LocalDateTime since) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT COALESCE(t.assignee_, 'Unassigned') AS assignee,"
                    + " COUNT(*) AS task_count,"
                    + " AVG(t.duration_) AS avg_duration,"
                    + " SUM(t.duration_) AS total_duration"
                    + " FROM act_hi_taskinst t"
                    + " WHERE t.proc_inst_id_ IN"
                    + "   (SELECT proc_inst_id_ FROM act_hi_procinst"
                    + "    WHERE proc_def_key_ = :key AND start_time_ >= :since)"
                    + " AND t.end_time_ IS NOT NULL"
                    + " GROUP BY t.assignee_"
                    + " ORDER BY task_count DESC"
                    + " LIMIT 50");
    query.setParameter("key", processDefKey);
    query.setParameter("since", Timestamp.valueOf(since));
    List<Object[]> rows = query.getResultList();
    List<AssigneeThroughputDto> result = new ArrayList<>();
    for (Object[] row : rows) {
      result.add(
          new AssigneeThroughputDto(
              (String) row[0],
              ((Number) row[1]).intValue(),
              toLong(row[2]),
              toLong(row[3])));
    }
    return result;
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<SankeyLinkDto> querySankeyTransitions(
      String processDefKey, LocalDateTime since) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT source_node, target_node, COUNT(*) AS transition_count"
                    + " FROM ("
                    + "   SELECT act_id_ AS target_node,"
                    + "     LAG(act_id_) OVER"
                    + "       (PARTITION BY proc_inst_id_ ORDER BY start_time_, id_)"
                    + "       AS source_node"
                    + "   FROM act_hi_actinst"
                    + "   WHERE proc_inst_id_ IN"
                    + "     (SELECT proc_inst_id_ FROM act_hi_procinst"
                    + "      WHERE proc_def_key_ = :key AND start_time_ >= :since)"
                    + "   AND act_type_ NOT IN ('multiInstanceBody', 'sequenceFlow')"
                    + " ) transitions"
                    + " WHERE source_node IS NOT NULL"
                    + " GROUP BY source_node, target_node"
                    + " ORDER BY transition_count DESC"
                    + " LIMIT 100");
    query.setParameter("key", processDefKey);
    query.setParameter("since", Timestamp.valueOf(since));
    List<Object[]> rows = query.getResultList();
    List<SankeyLinkDto> result = new ArrayList<>();
    for (Object[] row : rows) {
      result.add(new SankeyLinkDto((String) row[0], (String) row[1], ((Number) row[2]).intValue()));
    }
    return result;
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<CalendarHeatmapDto> queryCalendarHeatmap(LocalDateTime since) {
    Query query =
        JPA.em()
            .createNativeQuery(
                "SELECT CAST(start_time_ AS DATE) AS day, COUNT(*)"
                    + " FROM act_hi_procinst WHERE start_time_ >= :since"
                    + " GROUP BY CAST(start_time_ AS DATE) ORDER BY day");
    query.setParameter("since", Timestamp.valueOf(since));
    List<Object[]> rows = query.getResultList();
    List<CalendarHeatmapDto> result = new ArrayList<>();
    for (Object[] row : rows) {
      result.add(new CalendarHeatmapDto(row[0].toString(), ((Number) row[1]).intValue()));
    }
    return result;
  }

  // ---- Helpers ----

  /**
   * Converts a period string (e.g. "7d", "30d", "90d", "6m") to a {@link Timestamp} representing
   * the start of that period relative to now.
   */
  @Override
  public Timestamp periodToTimestamp(String period) {
    if (period == null || period.length() < 2) {
      throw new IllegalArgumentException("Invalid period: " + period);
    }
    String numberPart = period.substring(0, period.length() - 1);
    char unit = period.charAt(period.length() - 1);
    long amount;
    try {
      amount = Long.parseLong(numberPart);
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("Invalid period number: " + period, e);
    }

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime since;
    switch (unit) {
      case 'd':
        since = now.minusDays(amount);
        break;
      case 'm':
        since = now.minusMonths(amount);
        break;
      case 'y':
        since = now.minusYears(amount);
        break;
      default:
        throw new IllegalArgumentException("Unknown period unit: " + unit + " in " + period);
    }
    return Timestamp.valueOf(since);
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

  private static double toDouble(Object value) {
    if (value instanceof BigDecimal bd) {
      return bd.doubleValue();
    }
    if (value instanceof Number number) {
      return number.doubleValue();
    }
    return Double.parseDouble(value.toString());
  }
}
