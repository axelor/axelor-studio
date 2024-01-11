package com.axelor.studio.bpm.service;

import com.axelor.app.AppSettings;
import com.axelor.common.FileUtils;
import com.axelor.i18n.I18n;
import com.axelor.script.GroovyScriptHelper;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.pojo.Instance;
import com.axelor.studio.bpm.pojo.MigrationConfig;
import com.axelor.studio.bpm.pojo.MigrationInstance;
import com.axelor.studio.bpm.script.AxelorBindingsHelper;
import com.axelor.studio.db.WkfProcessUpdate;
import com.axelor.studio.db.repo.WkfProcessUpdateRepository;
import com.axelor.studio.helper.MigrationHelper;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.List;
import javax.script.Bindings;
import javax.script.SimpleBindings;
import org.yaml.snakeyaml.Yaml;

public class ProcessInstanceModificationServiceImpl implements ProcessInstanceModificationService {
  protected final WkfProcessUpdateRepository wkfProcessUpdateRepository;

  protected static final String DEFAULT_EXPORT_PATH = "{java.io.tmpdir}/axelor/data-export";
  protected static final String EXPORT_PATH =
      AppSettings.get().getPath("data.export.dir", DEFAULT_EXPORT_PATH);
  protected static final String MIGRATION = "__migration__";
  protected static final String START_BEFORE_ACTIVITY = "startBefore\\(.+\\)";
  protected static final String START_BEFORE_ACTIVITY_SET_VARIABLE =
      "startBefore\\(\".+\", \".+\", \".+\"\\)";
  protected static final String START_AFTER_ACTIVITY = "startAfter\\(.+\\)";
  protected static final String START_AFTER_ACTIVITY_SET_VARIABLE =
      "startAfter\\(\".+\", \".+\", \".+\"\\)";
  protected static final String START_TRANSITION = "startTransition\\(.+\\)";
  protected static final String START_TRANSITION_SET_VARIABLE =
      "startTransition\\(\".+\", \".+\", \".+\"\\)";
  protected static final String CANCEL_ALL_FOR_ACTIVITY = "cancelAll\\(.+\\)";
  protected static final String CANCEL_ACTIVITY_INSTANCE = "cancelActivityInstance\\(.+\\)";

  protected static final String CANCEL_TRANSITION_INSTANCE = "cancelTransitionInstance\\(.+\\)";

  @Inject
  public ProcessInstanceModificationServiceImpl(
      WkfProcessUpdateRepository wkfProcessUpdateRepository) {
    this.wkfProcessUpdateRepository = wkfProcessUpdateRepository;
  }

  @Override
  public void execute(WkfProcessUpdate wkfProcessUpdate) throws IllegalStateException {
    try {
      Bindings bindings = AxelorBindingsHelper.getBindings(new SimpleBindings());
      bindings.put(MIGRATION, MigrationHelper.class);
      String groovyScript = generateGroovyScript(parse(wkfProcessUpdate));
      new GroovyScriptHelper(bindings).eval(groovyScript);
      setStatus(wkfProcessUpdate, WkfProcessUpdateRepository.STATUS_APPLIED);
    } catch (Exception e) {
      setStatus(wkfProcessUpdate, WkfProcessUpdateRepository.STATUS_ERROR);
      throw e;
    }
  }

  private String generateGroovyScript(MigrationConfig migrationConfig) {
    StringBuilder groovyScript = new StringBuilder();
    if (migrationConfig != null && migrationConfig.getMigration() != null) {
      List<MigrationInstance> migrations = migrationConfig.getMigration();
      for (MigrationInstance migration : migrations) {
        Instance instance = migration.getInstance();
        List<String> instanceNames = instance.getName();
        List<String> operations = instance.getOperations();
        for (String p : instanceNames) {
          groovyScript.append(MIGRATION + ".forProcess('").append(p).append("')");
          operations.forEach(ProcessInstanceModificationServiceImpl::matchesAnyPattern);
          for (String operation : operations) {
            groovyScript.append(".").append(operation);
          }
          groovyScript.append(".execute();\n");
        }
      }
    }
    return groovyScript.toString();
  }

  @Transactional(rollbackOn = Exception.class)
  public void setStatus(WkfProcessUpdate wkfProcessUpdate, int status) {
    wkfProcessUpdate = wkfProcessUpdateRepository.find(wkfProcessUpdate.getId());
    wkfProcessUpdate.setStatusSelect(status);
    wkfProcessUpdateRepository.save(wkfProcessUpdate);
  }

  @Transactional(rollbackOn = Exception.class)
  public void generateScript(WkfProcessUpdate wkfProcessUpdate, Path path) throws IOException {

    if (path.toString().endsWith("yaml")) {
      String fileContent = Files.readString(path);
      wkfProcessUpdate.setScript(fileContent);
      wkfProcessUpdateRepository.save(wkfProcessUpdate);
    } else {
      throw new IllegalArgumentException(I18n.get(BpmExceptionMessage.BPM_YAML_INVALID_FILE));
    }
  }

  private MigrationConfig parse(WkfProcessUpdate wkfProcessUpdate) {
    try {
      Yaml yaml = new Yaml();
      return yaml.loadAs(wkfProcessUpdate.getScript(), MigrationConfig.class);
    } catch (Exception e) {
      throw new IllegalArgumentException(I18n.get(BpmExceptionMessage.BPM_YAML_INVALID_FILE));
    }
  }

  @Override
  public Path export(WkfProcessUpdate wkfProcessUpdate) {
    try {
      Path tempFile = Files.createTempFile("exported_modification", ".yaml");
      Files.write(tempFile, wkfProcessUpdate.getScript().getBytes(), StandardOpenOption.WRITE);
      File exportFile = FileUtils.getFile(EXPORT_PATH, tempFile.getFileName().toString());
      Path exportPath = Paths.get(EXPORT_PATH);
      if (Files.notExists(exportPath)) {
        Files.createDirectories(exportPath);
      }
      Files.move(tempFile, exportFile.toPath());
      return exportPath.relativize(exportFile.toPath());
    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  private static void matchesAnyPattern(String input) {
    String[] patterns = {
      START_BEFORE_ACTIVITY,
      START_AFTER_ACTIVITY,
      CANCEL_ALL_FOR_ACTIVITY,
      START_TRANSITION,
      CANCEL_TRANSITION_INSTANCE,
      CANCEL_ACTIVITY_INSTANCE,
      START_BEFORE_ACTIVITY_SET_VARIABLE,
      START_AFTER_ACTIVITY_SET_VARIABLE,
      START_BEFORE_ACTIVITY_SET_VARIABLE,
      START_TRANSITION_SET_VARIABLE
    };

    if (Arrays.stream(patterns).noneMatch(input::matches)) {
      throw new IllegalArgumentException(
          String.format(I18n.get(BpmExceptionMessage.BPM_YAML_UNSUPPORTED_OPERATION), input));
    }
  }
}
