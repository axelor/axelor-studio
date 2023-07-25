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
git clone git@git.axelor.com:aop/addons/axelor-public/axelor-studio.git --recurse-submodules
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
dependsOn ':modules:axelor-studio:reactCopy'
mustRunAfter ':modules:axelor-studio:reactCopy'
```

Then, add this line in the style.gradle file of your project if any, in the allprojects section **right before** the line `apply plugin: com.diffplug.gradle.spotless.SpotlessPlugin`:

```groovy
if (!file('src/main/java').exists()) { return }
```

This is to prevent the spotless plugin from applying to the react subprojects in the axelor-studio module, which would cause an error.

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
./gradlew clean assemble
```

Ths will automatically install node dependencies and build the react apps in the axelor-studio module in the same time as java, xml and other tasks.

Build results of axeolr-studio react apps will be copied in the webapp of your project and so will be included in the war by the studioReactCopy task which is made to run right before the war task.

**For all susbsequent builds**, the following command can be used to build without rebuilding the react apps:

```bash
./gradlew assemble
```

**Note:** Avoid using the clean task as much as possible as it will delete the react apps builds and they will have to be rebuilt again. If you really need to clean a module you can still use a command like this:

```bash
./gradlew :modules:demo-sale:clean
```
