# Axelor Studio

The main repository for Studio and BPM

## Installation on a project using nexus dependencies

Add the following to the dependencies section of your build.gradle file:

```groovy
implementation 'com.axelor.addons:axelor-studio:x.y.z'
```

## Installation on a project as a git submodule

Firstly, clone the project as a submodule using this command:

```bash
git clone git@git.axelor.com:aop/addons/axelor-public/axelor-studio.git
```

Then, add the following lines to the settings.gradle file of your project:

```groovy
include 'modules:axelor-studio'
apply from: 'modules/axelor-studio/settings.gradle'
```

Then, add the following lines to the dependencies section of your build.gradle file:

```groovy
implementation project(':modules:axelor-studio')
```

And the following lines into the war task definition of your build.gradle file:

```groovy
if (providers.systemProperty("include.react").getOrNull() != null) {
  dependsOn ':modules:axelor-studio:reactCopy'
  mustRunAfter ':modules:axelor-studio:reactCopy'
}
```

Then, add this line in the style.gradle file of your project if any, in the allprojects section **right before** the line `apply plugin: com.diffplug.gradle.spotless.SpotlessPlugin`:

```groovy
if (!file('src/main/java').exists()) { return }
```

This is to prevent the spotless plugin from applying to the react subprojects in the axelor-studio module, which would cause an error.

Then, add the following lines to an ide.gradle file in the gradle directory of your project:

```groovy
allprojects {
  apply plugin: 'idea'
  apply plugin: 'eclipse'
  eclipse {
    project {
      resourceFilter {
        matcher {
          id = 'org.eclipse.core.resources.regexFilterMatcher'
          arguments = ['node_modules', 'build']
        }
      }
    }
  }
}
```

And apply this file in the build.gradle file of your project:

```groovy
apply from: 'gradle/ide.gradle'
```

Eventually, add the following line to the gradle.properties file of your project to minimize build times:

```properties
org.gradle.parallel=true
```

Finally, add the following lines to the axelor-config.properties file of your project:

```properties

# Install apps. This deprecate the old 'aos.apps.install-apps' property
studio.apps.install = all

# Enable utils api. This deprecate the old 'aos.api.enable' property
utils.api.enable = true

# Custom context values
# ~~~~~
context.app = com.axelor.studio.app.service.AppService
```

## General usage of Studio

To build a project with Studio for the first time you can use the following command in the root directory of the project:

```bash
# To build without studio's react apps (partial build) :
./gradlew clean assemble

# To build with studio's react apps (full build) :
./gradlew clean assemble -Dinclude.react

# To build with studio's react apps but without particular tasks, use exclusions, for example :
./gradlew clean assemble -Dinclude.react -xreactBuild -xreactClean
```

The reactBuild task will automatically install node dependencies and build the react apps in the axelor-studio module in the same time as java, xml and other tasks.

The reactClean task will clean the react apps in the axelor-studio module (deletion of node_modules and build folders).

Build results of axeolr-studio react apps will be copied in the webapp of your project and so will be included in the war by the studioReactCopy task which is made to run right before the war task.