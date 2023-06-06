/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.service;

import com.axelor.common.Inflector;
import com.axelor.common.ObjectUtils;
import com.axelor.common.StringUtils;
import com.axelor.db.JPA;
import com.axelor.db.QueryBinder;
import com.axelor.db.mapper.Mapper;
import com.axelor.db.mapper.Property;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.meta.loader.XMLViews;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.meta.schema.actions.ActionView.ActionViewBuilder;
import com.axelor.meta.schema.views.ChartView;
import com.axelor.meta.schema.views.ChartView.ChartSeries;
import com.axelor.meta.schema.views.Selection.Option;
import com.axelor.script.ScriptBindings;
import com.axelor.studio.db.Filter;
import com.axelor.studio.db.StudioChart;
import com.axelor.studio.db.repo.StudioChartRepository;
import com.axelor.studio.service.filter.FilterSqlServiceImpl;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.YearMonth;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import javax.persistence.Query;
import org.apache.commons.beanutils.ConvertUtils;

public class ChartRecordViewServiceImpl implements ChartRecordViewService {

  protected static final String PARAM_PREFIX = "param";

  protected static final String PARAM_GROUP = "param0";
  protected static final String PARAM_AGG = PARAM_PREFIX + Long.MAX_VALUE;
  protected static final List<String> AGGR_SUPPORTED_CHARTS =
      Arrays.asList("bar", "hbar", "scatter");
  protected static final List<String> TARGET_DATE_TYPES =
      Arrays.asList("DATE", "DATETIME", "LOCALDATE", "LOCALDATETIME", "ZONNEDDATETIME");
  protected StudioChartRepository studioChartRepository;
  protected MetaJsonModelRepository metaJsonModelRepository;
  protected MetaModelRepository metaModelRepository;
  protected MetaViewRepository metaViewRepository;

  @Inject
  public ChartRecordViewServiceImpl(
      StudioChartRepository studioChartRepository,
      MetaJsonModelRepository metaJsonModelRepository,
      MetaModelRepository metaModelRepository,
      MetaViewRepository metaViewRepository) {
    this.studioChartRepository = studioChartRepository;
    this.metaJsonModelRepository = metaJsonModelRepository;
    this.metaModelRepository = metaModelRepository;
    this.metaViewRepository = metaViewRepository;
  }

  @Override
  public Map<String, Object> getActionView(String chartName, Map<String, Object> context) {
    StudioChart studioChart = studioChartRepository.findByName(chartName);

    if (ObjectUtils.isEmpty(studioChart)) {
      throw new IllegalStateException(I18n.get("No chart found with given chart name"));
    }

    if (studioChart.getIsJson()) {
      return getJsonModelActionView(studioChart, context);
    }

    return getMetaModelActionView(studioChart, context);
  }

  protected Map<String, Object> getJsonModelActionView(
      StudioChart studioChart, Map<String, Object> context) {
    MetaJsonModel jsonModel = metaJsonModelRepository.findByName(studioChart.getModel());
    String title = jsonModel.getTitle();
    if (Strings.isNullOrEmpty(title)) {
      title = studioChart.getModel();
    }
    String formView = "custom-model-" + jsonModel.getName() + "-form";
    String gridView = "custom-model-" + jsonModel.getName() + "-grid";

    ActionViewBuilder builder =
        ActionView.define(I18n.get(title))
            .model(MetaJsonRecord.class.getName())
            .add("grid", gridView)
            .add("form", formView);

    String filter = "self.jsonModel = :jsonModel";
    builder.context("jsonModel", jsonModel.getName());
    filter += " AND " + getDomainFilter(studioChart, context);
    builder.domain(filter);

    return builder.map();
  }

  protected Map<String, Object> getMetaModelActionView(
      StudioChart studioChart, Map<String, Object> context) {
    String domain = getDomainFilter(studioChart, context);
    String simpleName = getModelClass(studioChart).getSimpleName();
    Inflector instance = Inflector.getInstance();
    String dasherizeModel = instance.dasherize(simpleName);
    return ActionView.define(
            I18n.get(instance.humanize(getModelClass(studioChart).getSimpleName())))
        .model(studioChart.getModel())
        .domain(domain)
        .add("grid", dasherizeModel + "-grid")
        .add("form", dasherizeModel + "-form")
        .map();
  }

  @SuppressWarnings("unchecked")
  protected String getDomainFilter(StudioChart studioChart, Map<String, Object> context) {
    ChartView chart = (ChartView) XMLViews.findView(studioChart.getName(), "chart");
    Map<String, Object> params = getQueryParams(context, chart);
    String queryString = prepareQuery(studioChart, params);
    Query query = JPA.em().createNativeQuery(queryString);
    params.forEach(query::setParameter);

    QueryBinder queryBinder = QueryBinder.of(query);
    ScriptBindings binding = new ScriptBindings(null); // handle special variables
    binding.keySet().forEach(key -> queryBinder.bind(key, binding.get(key)));

    List<BigInteger> resultList = queryBinder.getQuery().getResultList();

    resultList.add(BigInteger.ZERO);
    return resultList
        .parallelStream()
        .map(String::valueOf)
        .collect(Collectors.joining(",", "self.id in (", ")"));
  }

  protected Map<String, Object> getQueryParams(Map<String, Object> context, ChartView chart) {
    Map<String, Object> params = new HashMap<>();

    String groupByKey = chart.getCategory().getKey();
    Object groupByValue = context.get(groupByKey);
    if (groupByValue != null && !"null".equals(groupByValue)) {
      params.put(PARAM_GROUP, groupByValue);
    }

    String aggByKey =
        chart.getSeries().stream()
            .map(ChartSeries::getGroupBy)
            .filter(Objects::nonNull)
            .findFirst()
            .orElse(null);
    if (StringUtils.notBlank(aggByKey)) {
      params.put(PARAM_AGG, context.get(aggByKey));
    }

    if (ObjectUtils.notEmpty(chart.getSearchFields())) {
      chart
          .getSearchFields()
          .forEach(
              searchField -> {
                String name = searchField.getName();
                params.put(name, context.get(name));
              });
    }
    return params;
  }

  protected String prepareQuery(StudioChart studioChart, Map<String, Object> params) {
    ArrayList<String> joins = new ArrayList<>();
    List<Filter> filterList = studioChart.getFilterList();

    List<Filter> filterForGroups = getFilters(studioChart, params, true);
    filterList.addAll(filterForGroups);

    List<Filter> filterForAggregations = getFilters(studioChart, params, false);
    filterList.addAll(filterForAggregations);

    final String tableName = getTableName(studioChart);
    String sqlFilters =
        Beans.get(FilterSqlServiceImpl.class).getSqlFilters(filterList, joins, true);
    if (sqlFilters != null) {
      return String.format(
          "select self.id from %s self %s where %s",
          tableName, String.join("\n", joins), sqlFilters);
    }
    return String.format("select self.id from %s self %s", tableName, String.join("\n", joins));
  }

  protected List<Filter> getFilters(
      StudioChart studioChart, Map<String, Object> params, boolean isForGroup) {

    String paramKey = isForGroup ? PARAM_GROUP : PARAM_AGG;

    if (!isForGroup && isAggregationAllowed(studioChart)) {
      params.remove(paramKey);
      return new ArrayList<>();
    }

    String targetType =
        isForGroup ? studioChart.getGroupOnTargetType() : studioChart.getAggregateOnTargetType();
    Object paramObj = params.get(paramKey);
    boolean isNull = ObjectUtils.isEmpty(paramObj);
    Filter filter = createFilter(studioChart, isNull, isForGroup);

    if (!TARGET_DATE_TYPES.contains(targetType.toUpperCase()) || isNull) {
      if (isNull) {
        params.remove(paramKey);
      } else {
        Object value = getSelectionFieldValue(studioChart, paramObj, isForGroup);
        if (value != null) {
          params.put(paramKey, value);
        }
      }
      return Arrays.asList(filter);
    }

    List<Filter> dateFilters = getFiltersForDateType(studioChart, params, filter, isForGroup);
    return dateFilters;
  }

  protected boolean isAggregationAllowed(StudioChart studioChart) {
    return !AGGR_SUPPORTED_CHARTS.contains(studioChart.getChartType())
        || (studioChart.getAggregateOn() == null && studioChart.getAggregateOnJson() == null);
  }

  protected List<Filter> getFiltersForDateType(
      StudioChart studioChart, Map<String, Object> params, Filter filter, Boolean isForGroup) {
    String paramKey = PARAM_GROUP;
    String dateType = studioChart.getGroupDateType();
    String targetType = studioChart.getGroupOnTargetType();

    if (!isForGroup) {
      paramKey = PARAM_AGG;
      targetType = studioChart.getAggregateOnTargetType();
      dateType = studioChart.getAggregateDateType();
    }

    String paramValue = (String) params.get(paramKey);

    if ("day".equals(dateType)) {

      if (LocalDateTime.class.getSimpleName().equalsIgnoreCase(targetType)) {
        params.put(
            paramKey,
            ZonedDateTime.parse(paramValue)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm:00")));
      }
      return Arrays.asList(filter);
    }

    long startId = isForGroup ? 10000l : 10001l;
    long endId = isForGroup ? 50000l : 50001l;

    List<Filter> startEndFilter = getYearMonthFilters(filter, startId, endId);

    DateRangeConvertor dateRangeConvertor = new DateRangeConvertor(dateType, paramValue);
    params.put(PARAM_PREFIX + startId, dateRangeConvertor.getStartDateStr());
    params.put(PARAM_PREFIX + endId, dateRangeConvertor.getEndDateStr());
    params.remove(paramKey);

    return startEndFilter;
  }

  protected List<Filter> getYearMonthFilters(Filter filter, long startId, long endId) {
    List<Filter> startEndFilter = new ArrayList<>();

    Filter startDateFilter = JPA.copy(filter, false);
    startDateFilter.setId(startId);
    startDateFilter.setOperator(">=");

    Filter endDateFilter = JPA.copy(filter, false);
    endDateFilter.setId(endId);
    endDateFilter.setOperator("<=");

    startEndFilter.add(startDateFilter);
    startEndFilter.add(endDateFilter);

    return startEndFilter;
  }

  protected Filter createFilter(
      Long id,
      Boolean isTargetJson,
      Boolean isJson,
      MetaJsonField jsonField,
      MetaField metaField,
      String targetField,
      String targetType,
      boolean isNull,
      String operator) {
    Filter filter = new Filter();
    filter.setId(id);

    filter.setIsTargetJson(isTargetJson);

    if (isJson) {
      filter.setIsJson(true);
      filter.setMetaJsonField(jsonField);
    } else {
      filter.setMetaField(metaField);
    }
    filter.setTargetField(targetField);
    filter.setTargetType(targetType);
    if (isNull) {
      filter.setOperator("isNull");
    } else {
      filter.setOperator(operator);
      filter.setIsParameter(true);
    }
    return filter;
  }

  protected Filter createFilter(StudioChart studioChart, boolean isNull, Boolean isForGroup) {
    Boolean isJson = studioChart.getIsJson();
    Filter filter =
        isForGroup
            ? createFilter(
                0l,
                isJson,
                studioChart.getIsJsonGroupOn(),
                studioChart.getGroupOnJson(),
                studioChart.getGroupOn(),
                studioChart.getGroupOnTarget(),
                studioChart.getGroupOnTargetType(),
                isNull,
                "=")
            : createFilter(
                Long.MAX_VALUE,
                isJson,
                studioChart.getIsJsonAggregateOn(),
                studioChart.getAggregateOnJson(),
                studioChart.getAggregateOn(),
                studioChart.getAggregateOnTarget(),
                studioChart.getAggregateOnTargetType(),
                isNull,
                "=");
    return filter;
  }

  protected Object getSelectionFieldValue(
      StudioChart studioChart, Object titleParam, Boolean isForGroup) {
    Object value = null;
    String selection = null;
    Class<?> targetType = String.class;

    Boolean isJson =
        studioChart.getIsJson()
            || (isForGroup ? studioChart.getIsJsonGroupOn() : studioChart.getIsJsonAggregateOn());
    MetaField target = studioChart.getGroupOn();
    MetaJsonField jsonField = studioChart.getGroupOnJson();

    if (!isForGroup) {
      target = studioChart.getAggregateOn();
      jsonField = studioChart.getAggregateOnJson();
    }

    if (isJson
        && ObjectUtils.notEmpty(jsonField.getSelection())
        && (Integer.class.getSimpleName().toLowerCase().equals(jsonField.getType())
            || String.class.getSimpleName().toLowerCase().equals(jsonField.getType()))) {
      selection = jsonField.getSelection();
      if (Integer.class.getSimpleName().toLowerCase().equals(jsonField.getType())) {
        targetType = Integer.class;
      }
    } else if (!isJson) {
      try {
        Mapper mapper = Mapper.of(Class.forName(studioChart.getModel()));
        Property p = mapper.getProperty(target.getName());
        if (ObjectUtils.notEmpty(p.getSelection())) {
          selection = p.getSelection();
          targetType = p.getJavaType();
        }
      } catch (ClassNotFoundException e) {
        throw new IllegalStateException(e);
      }
    }

    if (ObjectUtils.isEmpty(selection)) {
      return value;
    }
    List<Option> selectionList = MetaStore.getSelectionList(selection);
    for (Option option : selectionList) {
      if (option.getLocalizedTitle().equals(titleParam)) {
        return ConvertUtils.convert(option.getValue(), targetType);
      }
    }
    return value;
  }

  protected String getTableName(StudioChart studioChart) {
    Class<?> modelClass = getModelClass(studioChart);
    MetaModel metaModel = metaModelRepository.findByName(modelClass.getSimpleName());
    return metaModel.getTableName();
  }

  protected Class<?> getModelClass(StudioChart studioChart) {
    Class<?> modelClass;

    if (studioChart.getIsJson()) {
      modelClass = MetaJsonRecord.class;
    } else {
      try {
        modelClass = Class.forName(studioChart.getModel());
      } catch (ClassNotFoundException e) {
        throw new IllegalStateException(e);
      }
    }
    return modelClass;
  }

  protected static class DateRangeConvertor {

    protected static final DateTimeFormatter DATE_FORMAT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd");
    protected static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");
    protected static final DateTimeFormatter YEAR_FORMAT = DateTimeFormatter.ofPattern("yyyy");

    protected final String startDateStr;
    protected final String endDateStr;

    public DateRangeConvertor(String dateGroupType, String value) {
      LocalDate startDate = null;
      LocalDate endDate = null;

      if ("month".equals(dateGroupType)) {
        YearMonth yearMonth = YearMonth.parse(value, MONTH_FORMAT);
        startDate = yearMonth.atDay(1);
        endDate = yearMonth.atEndOfMonth();
      } else {
        Year year = Year.parse(value, YEAR_FORMAT);
        startDate = year.atDay(1);
        endDate = year.atMonth(12).atEndOfMonth();
      }
      this.startDateStr = startDate.format(DATE_FORMAT);
      this.endDateStr = endDate.format(DATE_FORMAT);
    }

    public String getStartDateStr() {
      return startDateStr;
    }

    public String getEndDateStr() {
      return endDateStr;
    }
  }
}
