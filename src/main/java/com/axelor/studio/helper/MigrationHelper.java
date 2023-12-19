package com.axelor.studio.helper;

import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.init.ProcessEngineServiceImpl;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.runtime.ProcessInstanceModificationBuilder;

public class MigrationHelper {
    private ProcessInstanceModificationBuilder modificationBuilder;

    private MigrationHelper(ProcessInstanceModificationBuilder modificationBuilder) {
        this.modificationBuilder = modificationBuilder;
    }

    public static MigrationHelper forProcess(String processInstanceId) {
        RuntimeService runtimeService =
                Beans.get(ProcessEngineServiceImpl.class).getEngine().getRuntimeService();
        return new MigrationHelper(runtimeService.createProcessInstanceModification(processInstanceId));
    }

    public MigrationHelper startBefore(String activityId) {
        modificationBuilder.startBeforeActivity(activityId);
        return this;
    }

    public MigrationHelper startBefore(String activityId, String name, String value) {
        modificationBuilder.startBeforeActivity(activityId).setVariable(name, value);
        return this;
    }

    public MigrationHelper startAfter(String activityId) {
        modificationBuilder.startAfterActivity(activityId);
        return this;
    }

    public MigrationHelper startAfter(String activityId, String name, String value) {
        modificationBuilder.startAfterActivity(activityId).setVariable(name, value);
        return this;
    }

    public MigrationHelper startTransition(String activityId) {
        modificationBuilder.startTransition(activityId);
        return this;
    }

    public MigrationHelper startTransition(String activityId, String name, String value) {
        modificationBuilder.startTransition(activityId).setVariable(name, value);
        return this;
    }

    public MigrationHelper cancelAll(String activityId) {
        modificationBuilder.cancelAllForActivity(activityId);
        return this;
    }

    public MigrationHelper cancelActivityInstance(String activityInstanceId) {
        modificationBuilder.cancelActivityInstance(activityInstanceId);
        return this;
    }

    public MigrationHelper cancelTransitionInstance(String activityInstanceId) {
        modificationBuilder.cancelTransitionInstance(activityInstanceId);
        return this;
    }

    public void execute() {
        modificationBuilder.execute();
    }
}