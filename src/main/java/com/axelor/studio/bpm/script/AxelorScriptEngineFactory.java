/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.script;

import groovy.lang.GroovySystem;
import java.util.Arrays;
import java.util.List;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineFactory;

public class AxelorScriptEngineFactory implements ScriptEngineFactory {

  protected static final String VERSION = "1.0";

  protected static final String SHORT_NAME = "axelor";

  protected static final String LANGUAGE_NAME = "axelor";

  @Override
  public ScriptEngine getScriptEngine() {
    return new AxelorScriptEngine(this);
  }

  @Override
  public String getEngineName() {
    return "Axelor Script Engine";
  }

  @Override
  public String getEngineVersion() {
    return VERSION;
  }

  @Override
  public List<String> getExtensions() {
    return EXTENSIONS;
  }

  @Override
  public String getLanguageName() {
    return LANGUAGE_NAME;
  }

  @Override
  public String getLanguageVersion() {
    return GroovySystem.getVersion();
  }

  @Override
  public String getMethodCallSyntax(String obj, String m, String... args) {
    StringBuilder ret = new StringBuilder(obj + "." + m + "(");
    int len = args.length;
    if (len == 0) {
      ret.append(")");
      return ret.toString();
    }

    for (int i = 0; i < len; i++) {
      ret.append(args[i]);
      if (i != len - 1) {
        ret.append(",");
      } else {
        ret.append(")");
      }
    }
    return ret.toString();
  }

  @Override
  public List<String> getMimeTypes() {
    return MIME_TYPES;
  }

  @Override
  public List<String> getNames() {
    return NAMES;
  }

  @Override
  public String getOutputStatement(String toDisplay) {
    StringBuilder buf = new StringBuilder();
    buf.append("println(\"");
    int len = toDisplay.length();
    for (int i = 0; i < len; i++) {
      char ch = toDisplay.charAt(i);
      switch (ch) {
        case '"':
          buf.append("\\\"");
          break;
        case '\\':
          buf.append("\\\\");
          break;
        default:
          buf.append(ch);
          break;
      }
    }
    buf.append("\")");
    return buf.toString();
  }

  @Override
  public Object getParameter(String key) {
    return switch (key) {
      case ScriptEngine.NAME -> SHORT_NAME;
      case ScriptEngine.ENGINE -> getEngineName();
      case ScriptEngine.ENGINE_VERSION -> VERSION;
      case ScriptEngine.LANGUAGE -> LANGUAGE_NAME;
      case ScriptEngine.LANGUAGE_VERSION -> GroovySystem.getVersion();
      case "THREADING" -> "MULTITHREADED";
      case null, default -> throw new IllegalArgumentException("Invalid key");
    };
  }

  @Override
  public String getProgram(String... statements) {
    StringBuilder ret = new StringBuilder();
    Arrays.asList(statements).forEach(statement -> ret.append(statement).append('\n'));
    return ret.toString();
  }

  protected static final List<String> NAMES;
  protected static final List<String> EXTENSIONS;
  protected static final List<String> MIME_TYPES;

  static {
    NAMES = List.of(SHORT_NAME, LANGUAGE_NAME);
    EXTENSIONS = List.of("axelor");
    MIME_TYPES = List.of("application/x-groovy");
  }
}
