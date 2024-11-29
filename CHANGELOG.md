## 3.3.7 (2024-11-29)

#### Fix

* Fix missing visual error feedback on process node

  <details>
  
  Fix the char size error when saving a bpm instance current error when the error trace is too long
  
  </details>

* Fix Translation field issue
* Fix open studio menu button
* Fix generated user action view when the user path is a script

  <details>
  
  Fix the generated action view when the user path is an action view and directly using the script instead of browsing the properties
  
  </details>

* Fix studio app versions updating and formatting

  <details>
  
  Fix the app version update on server startup, and fix version regex
  
  </details>

* Fix studio sidebar boolean doesn't put the panel on the side anymore
* OpenStudioButton missing when viewCustomizationPermission = CAN_SHARE
* Fix Iteration and Database Connection Issue in Camunda BPM Process

  <details>
  
  Iteration and Database Connection Issue in Camunda BPM Process by initiating a transaction when deleting variables
  
  </details>

* BPM instance are not started when the record is created from an other bpm.

  <details>
  
  Resolved the issue where BPM instances were not starting when triggered by another BPM process. Added two configurable parameters in axelor-config.properties to address potential database connection issues; "studio.bpm.max.idle.connections" Controls the maximum number of idle database connections (default 10). And "studio.bpm.max.active.connections" Defines the maximum number of active database connections (default 50).
  
  </details>

* Improved script task display

  <details>
  
  Improved script task display when the script is too long
  
  </details>


## 3.3.6 (2024-11-22)

#### Fix

* Resolve Error while using studio helper in task configuration
* Resolve Bpm user task send email issue

  <details>
  
  Resolve BPM mail sending issue by changing the mail event storage in the bpmn file
  
  </details>

* Sub-process evaluated when it shouldn't.

  <details>
  
  Updated functionality to ensure that only local variables specific to the current execution scope are removed at the end of each process/sub-process, preserving the integrity of necessary global variables.
  
  </details>

* Add Built-in variable and custom variable to Query builder
* Resolve BPM view attributes on custom model

  <details>
  
  Resolve BPM view attributes creation on custom models
  
  </details>

* Resolve error when using self as data source

  <details>
  
  Resolve the issue with self source type, use targetModel as prefix before using the field name
  
  </details>

* Resolve Bpm builder createObject MethodNotFoundException

  <details>
  
  Resolve BPM builder createObject error by not using execution variable on generation
  
  </details>

* Resolve BPM node translation issue
* Fix Issue with `createVariable` Usage in Script Task for Query Generation Causing Deserialization Error

  <details>
  
  Replace the `createVariable` function with `createObject` to ensure correct type handling.
  
  </details>


## 3.2.6 (2024-11-19)

#### Fix

* Resolve Bpm user task send email issue

  <details>
  
  Resolve BPM mail sending issue by changing the mail event storage in the bpmn file
  
  </details>

* Resolve BPM view attributes on custom model

  <details>
  
  Resolve BPM view attributes creation on custom models
  
  </details>

## 3.3.5 (2024-11-14)

#### Fix

* BPM builder - Resolve bpm builder crash issue.
* Studio - internal server error onClick on the iconBackground.

  <details>
  
  change widget from TagSelect to SingleSelect for iconBackground field
  
  </details>

* Make custom variables not selectable after deletion

  <details>
  
  Select only valid custom variable available on AppBpm
  
  </details>

* Expression Builder Handling Null and Comparison Operators.

  <details>
  
  Resolve the problem when selecting a null operator and selecting a comparison operator after, this issue comes from the fieldValue not being well initialized
  
  </details>

* Fix invalid timer expression.

  <details>
  
  Resolve invalid timer expression by not allowing to use weeks and other elements on the same expression.
  
  </details>

* Displayed option doesn't match the generated expression

  <details>
  
  Added the missing in operator and change the template logic to handle it
  
  </details>


## 3.3.4 (2024-11-13)

#### Change

* Fix aop version on 7.2.1

  <details>
  
  Fix aop version on aop7.2.1
  
  </details>

## 3.2.5 (2024-11-12)

#### Fix

* BPM migration error.

  <details>

  introduces a method to migrate all active process instances with a specified WkfProcess to the latest deployed version of the process definition. This ensures uniformity across all instances by synchronizing them to the latest version as long as no major structural changes exist between versions.

  </details>


## 3.2.4 (2024-11-05)

#### Fix

* Replace ForkJoin pool usages by executor services

  <details>

    - Replace Fork join usage and use ExecutionService instead

  </details>


## 3.2.2 (2024-10-09)

#### Fix

* Batch processing takes much longer in 3.2.0

  <details>

  Improved batch processing performance for BPM instances.

  </details>



## 3.3.3 (2024-11-04)

#### Fix

* Responsive anomaly

  <details>
  
  - Fix CSS
  
  </details>

* DMN viewer - Fix alertClose on DMN viewer

  <details>
  
  Fix the alertClose not found error on DMN viewer
  
  </details>

* BPM builder - builder does not keep settings

  <details>
  
  Fix settings storage after script generation, store settings json in bpmn file
  
  </details>

* BPM - Fix script code editor for field configs
* StudioApp - error when exporting an app containing an action with type "Email"

  <details>
  
  Updated the Groovy template used during the export process removing references to template.birtTemplateSet, a field that does not exist in the Template object.
  
  </details>

* Replace ForkJoin pool usages by executor services

  <details>
  
  - Replace Fork join usage and use ExecutionService instead
  
  </details>


## 3.3.1 (2024-10-09)

#### Fix

* Update axelor-message version

  <details>
  
  - Update axelor message version to 3.2.0
  
  </details>


## 3.3.0 (2024-10-09)

#### Feature

* Display status of migration when deploy new changement in existing BPM model.

  <details>
  
  - When deploy new changes in existing BPM model , the status of the migrations process is displayed.
  - A loading icon is displayed once the deploy button is clicked
  - Deploy button is deactivated when deploy is in progress
  - A message that indicate how much instances is migrated and if the migration is successful or not is shown after deploy
  
  </details>

* Allow users to change the Hit Policy in Decision Model and Notation

  <details>
  
  - As a user, I want to be able to change the Hit Policy in DMN tables to control how results from multiple rules are combined.
  - The Hit Policy determines how the results of multiple rules are combined.
  
  </details>

* Add BPM custom variable support on bpm builder

  <details>
  
  - In the expression and script builders the user can use custom variables defined in application configuration
  
  </details>

* Implement Data Transformation in BPM Builders(Expression Builder)

  <details>
  
  - Add in the expression builder the possibility to use data transformations
  
  </details>

#### Change

* BPM code improvements

  <details>
  
  - Remove material ui from styles & components completely (Remove makeStyles,IconButton, colors(@material-ui/core/colors)), icons, InputAdornment, OutlinedInput)
  - Remove code duplication's
  - Improve component structures
  - Improve dialog title code with axelor ui properly
  - Fix Unique key & Uncontrolled components warning in components
  
  </details>

#### Fix

* Memory leak when large number of instances.

  <details>
  
  Resolved the memory leak caused by inefficient log handling for BPM instances. 
  Replaced ByteArrayOutputStream with BufferedOutputStream around FileOutputStream to reduce heap memory usage and improve performance.
  Logs are now written directly to disk.
  
  </details>

* Change field title for Menu/Action

  <details>
  
  - Changed Action configuration title :
    User/Team field path was changed to User or Team
    Deadline field path was changed to Deadline
    'is team field' was changed to 'Affect to team'
  
  </details>

* Batch processing takes much longer in 3.2.0

  <details>
  
  Improved batch processing performance for BPM instances.
  
  </details>

* Save delete content

  <details>
  
  - Save the latest content when using the keyboard shortcut on scripts
  
  </details>

* Deploy fail error management

  <details>
  
  - Do not start BPM when deployment is failed
  
  </details>


## 3.2.1 (2024-10-07)

#### Fix

* BAML Bug on instance generation

## 3.2.0 (2024-09-09)

#### Feature

* Add controller to check Studio Pro and Connect modules availability

  <details>
  
  - Using `Axelor connect` in BPM as a service task requires Studio Pro to be installed alongside with connect module.
  - Provide controller action to be used from front-end to check the availability of Studio Pro and Connect
  
  </details>

* Instead of selecting m2o fields from the model, allow expressions

  <details>
  
  - For the Actions on activity, the user can select either a team field or user field and expressions
  - Each of the user action fields is expecting a m2o (for team and users) or a date field in case of a deadline.
  
  </details>

* Trigger BPM instance by global listener

  <details>
  
  - Implement a global listener to trigger bpm instance on every entity creation / update 
  - Add a configuration on WkfProcess to allow using hibernate global listener or AOP observer to trigger the process
  
  </details>

* Improve automatic deployment of BPM

  <details>
  
  Change bpm automatic deployment from server start to a button triggered deployment,
  Add a new button "Load from sources", this buttons calls a method to search for bpmn file by code from sources and load it withoud deploying it
  this feature must be activated from app settings using allowBpmLoadingFromSources boolean
  
  </details>

* Update gradle node, node and pnpm plugins to latest version

  <details>
  
  Upgraded the Gradle Node plugin from 5.0.0 to 7.0.2.
  Upgraded Node.js from 18.16.1 to 22.7.0.
  Upgraded PNPM to version from 8.6.6 to 9.8.0.
  
  </details>

* Add Custom Variables in BPM Configurations

  <details>
  
  - Added support for custom variables in BPM app configurations.Each variable has a corresponding Groovy expression that is validated for syntax.
  - Valid variables can be used in BPM scripts.
  
  </details>

* Add translation functionality bpmn elements displayed in Merge-split tool

  <details>
  
  - Add translations for BPMN elements in the same way as used in BPM Studio.
  
  </details>

* Update the bpmn-js library to the latest version
* Add helper to retrieve process information in Camunda BPM

  <details>
  
  Introduced a new WkfProcessHelper class to access process information at runtime.
  The helper allows retrieving various details related to process instance and tasks.
  Methods include getProcessInfo, getActiveTasks, and getTaskById to facilitate process data extraction during execution.
  
  </details>

* Add buttons to unblock bpm instances

  <details>
  
  Add two buttons to unblock the bpm process instances. They can be found under the menu *App -> BPM components -> Technical Monitoring*.
  1. The first one is in the *Process Instances* menu, more precisely in the form view of a process instance.
      * This button will allow you to unblock the specific instance you select.
  2. The second button is in the *BPM Models* menu, in the form view of this menu.
      * This button will allow you to unblock all the instances linked to a given BPM model.
      * Even if all the instances of the model are not blocked for one model you can use it safely (it won't impact the non blocked instances).
  
  </details>

* Variable management

  <details>
  
  Implement a more efficient variable management system to ensure accessibility throughout the entire process.
  
  </details>

* A decision can be created by both real an custom models

#### Change

* Don't inject `MetaFiles` service in `WkfInstanceServiceImpl`

  <details>
  
  This service was unused so it has been removed from the fields and the constructor.
  
  </details>

* Studio builders refactoring

#### Fix

* Issue when changing browser zoom

  <details>
  
  - When zooming, the horizontal scrolling is not available in the properties, making right buttons unavailable.
  - Moreover, when canceling the resizing, properties panel remains compact.
  
  </details>

* Resolve Unable to close builder bug
* Selecting a node doesn't open the properties
* Fix Code editor on studio field settings
* When merging BPM models there is a breaking issue

  <details>
  
  When having selected a BPM model and then merging it with another model, the application went blank consequently to a 
  front-end issue.
  
  </details>

* Fix duplicate request when selecting BPM Model
* fix sending mail task
* Update xsd version on Studio elements

  <details>
  
  - Update xsd version on domains from 6.1 to 7.1
  - Update xsd version on views from 6.1 to 7.1
  - Update xsd version on import from 6.1 to 7.1
  
  </details>

* Incorrect variable handling causing some fields to be ignored

  <details>
  
  Fixed the issue where some fields were ignored due to incorrect variable handling,
  Updated serialization and deserialization of variables.
  Added configuration for serialization depth via `axelor-config.properties`:
  - Introduced property `studio.bpm.serialization.depth` to control the depth of serialization.
  - Default depth set to 5, with a maximum value of 10.
  
  </details>

* Include relational fields
* Alert when opening a process
* Scrolling is blocked in mapper
* Fix  apply CamelCase on MetaJsonField each time when navigate to another field

  <details>
  
  - the metaJsonField's name are automatically converted in CamelCase.
  - It's a nice for new field but not for already existing ones.
  
  </details>

* Duplicate menu don't generate a duplicate

  <details>
  
  Set the name of the studio action while creating/updating it.
  
  </details>


## 3.1.4 (2024-10-07)

#### Fix

* BAML Bug on instance generation

## 3.1.3 (2024-09-09)

#### Fix

* Issue when changing browser zoom

  <details>
  
  - When zooming, the horizontal scrolling is not available in the properties, making right buttons unavailable.
  - Moreover, when canceling the resizing, properties panel remains compact.
  
  </details>

* Fix Code editor on studio field settings
* Fix duplicate request when selecting BPM Model
* fix sending mail task
* Correct wrong translation

  <details>
  
  - Change in fr translation "Modèles standards importés" to "Importer les modèles standards"
  
  </details>

* Alert when opening a process
* Fix  apply CamelCase on MetaJsonField each time when navigate to another field

  <details>
  
  - the metaJsonField's name are automatically converted in CamelCase.
  - It's a nice for new field but not for already existing ones.
  
  </details>

* Fix Bad alignment in messages

## 3.1.2 (2024-07-24)

#### Fix

* When merging BPM models there is a breaking issue

  <details>
  
  When having selected a BPM model and then merging it with another model, the application went blank consequently to a 
  front-end issue.
  
  </details>

* Update xsd version on Studio elements

  <details>
  
  - Update xsd version on domains from 6.1 to 7.1
  - Update xsd version on views from 6.1 to 7.1
  - Update xsd version on import from 6.1 to 7.1
  
  </details>

* Builders refactoring

## 3.1.1 (2024-06-26)

#### Change

* Update dependencies to Axelor-message & Axelor-utils

#### Fix

* Fix unused exportation of files, when exporting an empty Studio App
* Change AOP version to 7.1.0
* Fix scrolling is blocked in mapper

## 3.1.0 (2024-05-30)

#### Feature

* Implement a websocket for the bpm

  <details>
  
  Add the collaboration in the BPM modeler
  
  Warning: This feature is only available if 
  AOP enterprise is activated
  
  </details>

* Synchronize BPM Task status with AOP task
* Integrate Builders in BAML

  <details>
  
  Generalise builders based on type if any and Remove all the static duplicate code and use the generalised builders to avail all features and designs.
  
  </details>

* Implement a patch feature to merge/Split bpmn diagrams

#### Change

* Display studio button using AOP 7.1 feature

  <details>
  
  The studio button is now added using ViewProcessorImpl class which implements ViewProcessor class of AOP 7.1. The previous solution used CustomMetaService, which has now been removed as it is no longer needed.
  
  </details>

#### Fix

* Resolve Bpm deprecated warning
* Improve memory management

  <details>
  
  Refacto of the front end to easily manage large bpmn models
  
  </details>

* Remove AccessConfig Model and unnecessary code

  <details>
  
  Objects deleted :
  AccessConfig,UserAccessConfig
  Services deleted :
  AccessConfigImportService.java
  AccessConfigImportServiceImpl.java
  
  </details>

* Remove unnecessary code

  <details>
  
  Remove unnecessary getNode method from WkfInstanceService
  
  </details>

* Remove AOS dependencies

  <details>
  
  remove importStandardWkfModels methode 
  remove demo data related to AOS
  remove data-wkf-models imported files related to AOS
  
  </details>

## 3.0.5 (2024-10-07)

#### Fix

* BAML Bug on instance generation
* Memory leak when large number of instances.

  <details>
  
  Resolved the memory leak caused by inefficient log handling for BPM instances. 
  Replaced ByteArrayOutputStream with BufferedOutputStream around FileOutputStream to reduce heap memory usage and improve performance.
  Logs are now written directly to disk.
  
  </details>


## 3.0.4 (2024-09-09)

#### Fix

* Fix duplicate request when selecting BPM Model
* Fix sending mail task
* Fix Wrong translation of "Import standard models"
* Fix  Alert when opening a process
* Fix  apply CamelCase on MetaJsonField each time when navigate to another field

  <details>
  
  - the metaJsonField's name are automatically converted in CamelCase.
  - It's a nice for new field but not for already existing ones.
  
  </details>

* Fix Bad alignment in messages

## 3.0.3 (2024-07-24)

#### Fix

* When merging BPM models there is a breaking issue

  <details>
  
  When having selected a BPM model and then merging it with another model, the application went blank consequently to a 
  front-end issue.
  
  </details>

* Update xsd version on Studio elements

  <details>
  
  - Update xsd version on domains from 6.1 to 7.0
  - Update xsd version on views from 6.1 to 7.0
  - Update xsd version on import from 6.1 to 7.0
  
  </details>

* Builders refactoring

## 3.0.2 (2024-06-26)

#### Fix

* Fix unused exportation of files, when exporting an empty Studio App
* Fix scrolling is blocked in mapper

## 3.0.1 (2024-04-26)

#### Fix

* Don't override AOP translations
* Reference to non existant element while opening the view
* Escalation variable is not persisted

## 3.0.0 (2024-04-04)

#### Feature

* BPM : Allow to display status of an event based gateway
* BPM : Colorize the diagram nodes where errors happens
* BPM : Update the bpmn-js-token-simulation
* BPM : For a given process instance allow to visualize process variable and values
* STUDIO : Studio properties improvisation

  <details>
  
  One should be able to hide the whole section from properties.
  Similarly, it's Allowed property to hide or show conditionally.
  Sections labels customisation is possible.
  In side panel widgets toolbar also, it is possible  to update visibility conditionally for sections or for particular field type & the same for divider's logic
  
  </details>

* BPM : DMN logs related to an instance execution should be displayed as well
* STUDIO : Add interface for ExportService and change methods to non-static
* BAML : Migrate BAML components to axelor ui components

  <details>
  
  Remove material ui & use axelor ui components as a alternative
  Add theme support like backend
  You can refer BPM or Studio for this migration.
  Basically completely migrate BAML to new theme & look using axelor ui
  
  </details>

* BPM : Migrate from react-ace to monaco-editor
* BPM : The executable option must be a label properly displayed
* STUDIO : Add icons and toolTips to guide the user

#### Change

* App builder : Use logger properly and with consistency

#### Fix

* STUDIO :  Studio label on conditions are not translated
* STUDIO : Fix Infinite loading When model bar search

  <details>
  
  When model doesn't have any panel and it's get selected view gets into a infinite loading.
  
  </details>

* BPM : OutOfMemory error due to large instance log text
* STUDIO :  Titles are not get in the node mapping
* BPM : Node translations are not working
* BPM : Fix Multiple BPM instance for a same record when throwing exception during the process execution
* STUDIO : Add action validate when saving the studio action

  <details>
  
  Verify filling the fields lines by the right values. No effect for this action will be triggered just an action validate
  
  </details>

* App builder : fix import Apps from App menu

## 2.2.1 (2024-03-29)

#### Fix

* Fix problem with userTask is blocking node when true expression set

## 2.2.0 (2024-03-14)

#### Feature

* BPM: Allow custom configuration to detect potential infinite loop in task evaluation

  <details>
  
  When the BPM engine evaluates a task, there are some mechanisms to ensure we don't enter a infinite loop. This mechanism is based on a maximal time execution and a maximal depth (to prevent an infinite recursion).
  These values are now configurable in 'App BPM', but the default values are kept for backward compatibility.
  
  </details>


## 2.1.0 (2024-02-23)

#### Fix

* BPM : Missing translation in the BPM
* BPM : Task listener script dialog issue
* BPM : Fix studio wkf model versioning and use code and version as unique key instead of suffixing the code

## 2.0.1 (2024-02-16)

#### Change

* App builder: Remove x-translate from the name field of App model

  <details>
  
  This change imply to verify all the cards and forms views of your Axelor apps 
  (all the models having a o2o relation with `com.axelor.studio.db.App`).
  
  </details>

#### Fix

* BPM : Order and filter records when clearing the process instance logs
* App builder: Fix issue when importing apps with app loader
* BPM: fix issue with Expression/Script builder generates a wrong condition with the integer selection field
* App builder: All module selected internal server error

## 2.0.0 (2024-01-25)

#### Feature

* BPM: Align bpm studio groovy syntax with AOP groovy syntax
* Web service: Track Webservices calls
* Studio : Go to studio from grid or form
* BPM : Add support of actions in service task
* BPM : Support timer event with multi tenant
* BPM: Pop-up on script

  <details>
  
  Add a feature to open Script on a popup to edit in a more friendly way the code written.
  
  </details>

* WS Connector: Add a new object for request order
* StudioAction : Domain can't be longer than 255 characters
* BPM : Get a visual feedback for the logs

  <details>
  
  Get a maximum information when an error occurs in the BPM execution
  
  </details>

* Menu Builder: Add view parameters
* AppBuilder : Move app menus to main app configuration
* BPM: Change The API endpoint to get and post the requests selected in the connector script
* App Builder : Allow to migrate instances separately
* APP BUILDER : Display 'code' field in select options of sourceVersion & targetVersion
* BPM: Optimize available display
* Studio : Change the studio react component path
* BPM : Allow auto-import for process in config app

  <details>
  
  Add a new configuration to import process from sources and deploy them while deploying the application
  
  </details>

* BPM : Allow process instance modification in the runtime
* Studio : migrate studio to axelor-ui
* App builder : Migrate BPM & DMN & Studio to axelor-ui

  <details>
  
  Migrate BPM designer to Axelor-ui template 
  Migrate DMN editor to Axelor-ui template
  Migrate Studio editor to Axelor-ui template
  
  </details>

#### Fix

* Remove user task conditions size limitation
* App Builder : Fix all old bad practices that remains
* AppBuilder : Fix French translations of studio, bpm, etc
* Studio : Code optimisation
* BPM : Fix french translations for studio bpm
* Improve error message data to clickable link
* BPM: Error when importing new BPM
* WS Builder: Limited size of the field URL in WsRequest object
* BPM: Ids in readonly for deployed BPM models
* BPM: Newly inserted element is selected but its properties not
* Menu Transformation is also called Request
* WS Builder : Headers issue - Change the API end-point used to get the key-value-headers
* WS Builder : Issue with authenticate button , the authentication done but the check box doesn't change to true
* STUDIO MENU : Remove the top Menu for the AOP V7 version
* StudioDashlet : colSpan not supported for AOP 7
* APP BUILDER : Update custom view templates
* BPM : Result Variable is not displayed after process deployment
* APP BUILDER : Studio shouldn't be accessible from any view

  <details>
  
  Added magic-wand icon to Open studio button
  
  </details>

* BPM : Code editing popup not fully implemented

  <details>
  
  The code editing popup should be available everywhere in the builder when a script can be used
  
  </details>

* App Builder : Fix WkfInstanceMigrationHistory typos
* App Builder : Duplicate StudioActionView on every save
* BPM : Correct conditional events
* BPM : Script dialog bug
* BPM : Unable to access some models when configuring BPM process in studio
* BPM : Non intuitive behavior on the DMN
* APP BUILDER : Translations are not working in react views
* BPM : Fix dirty tab feature
* BPM : opening linked DMN view issue

  <details>
  
  Linked DMN should be selected and loaded while opened from BPM
  
  </details>

* STUDIO : Studio is crashing over tab removal
* Allow the user to get messages from other models
* APP BUILDER : A menu can't have itself as a parent

  <details>
  
  When using the menu builder a menu can't have itself as a parent.
  
  </details>

* App Builder : Migrate icons from font awesome to bootstrap icons

## 1.3.4 (2023-11-03)

#### Fixed

* Anomaly #71447: Fix NPE upon save of a custom model with a menu

## 1.3.3 (2023-10-25)

#### Fixed

* Anomaly #70597: Fix StudioActionView duplication on every save

## 1.3.2 (2023-10-06)

#### Fixed

* Anomaly #70007: Fix apps images duplicating at each server startup

## 1.3.1 (2023-09-15)

#### Fixed

* Fix app config not initializing

  <details>
  
  If an app configuration contains required fields with default values, the configuration record 
  was not initialized leading to a no configuration popup message despite a configuration record
  existing.
  
  This has been fixed by also checking if all required fields have a non-null value.
  
  </details>


## 1.3.0 (2023-09-14)

#### Features

* STUDIO-65999 : WkfInstance: Migration history
* Web service: Add possibility to order request payloads
* BPM: Add a field 'Migration status' in WkfInstance
* Feature #65782 : WkfInstance: Restart from selected node
* WkfModel: Add a boolean 'New version on deploy'
* BPM: Add a new object 'WkfMigration'

#### Fixed

* Demo data: Fix Purchase Request demo data
* Wkf Deployment: Manage old menu removal
* Fix AOP version to 6.1.5

## 1.2.6 (2023-11-03)

#### Fixed

* Anomaly #71447: Fix NPE upon save of a custom model with a menu

## 1.2.5 (2023-10-25)

#### Fixed

* Anomaly #70597: Fix StudioActionView duplication on every save

## 1.2.4 (2023-10-06)

#### Fixed

* Anomaly #70007: Fix apps images duplicating at each server startup

## 1.2.3 (2023-08-25)

#### Fixed

* BPM Timer: Fix @RequestScoped and JPA context on timer call
* BPM : Error in error notification message

## 1.2.2 (2023-07-24)

#### Fixed

* StudioSelection : Custom selection is broken

## 1.2.1 (2023-07-13)

#### Features

* Add documentation for web service builder using Antora
* Update Utils and Message dependencies

#### Fixed

* Ws-builder , Hide authenticate button when no request is selected
* BPM, pass variables in call activity
* Add new parser for xml responses
* Fix export/import Web service components

## 1.2.0 (2023-07-03)

#### Changes

* BPM: Change title of the field 'App builder' to 'App' on bpm editor

#### Features

* Bump AOP version to 6.1.3
* Studio: Field size
* Add List of headers suggestions to the header builder in version XML of Ws-Builder

  <details>
  
  Add a list of headers to be chosen by the user , you can use the standard headers in HTTP/1.1 specification by the Internet Engineering Task Force (IETF)
  
  </details>

* BPM: Add support for date, datetime and user variable on completedIf condition
* BPM : Manage BPM exceptions / errors with AOP MailMessage
* Studio: Tab panel
* Handle response types at parsing to Json , and add some improvement in WS BUILDER

  <details>
  
  * when getting the response of execution of a request , we parse this response to Json Object .
  there are many types of response that can be at the response , until now we manage only responses that are compatible with APPLICATION_JSON_TYPE and APPLICATION_XML_TYPE , we have to manage all existing types
  additional points :
  * manage m2o and m2m in the payload builder
  * manage Repeated Requests by storing the result of each repeated occurrence
  * tool bar is  responsive for ws-Builder now
  * Add possibility to open the request and the authentication in a new tabs in ws builder
  * Add the features in WsAuthentication ( version Xml ) to the web service React App
  
  </details>

* Update xsd to 6.1
* Studio: Toolbar selections

#### Fixed

* Studio: Fix unable to export app from button on the card view
* Studio: Unnecessary spacer creation
* BPM: Fix BPM process infinite loop
* Studio: Separator widget
* DMN: Fix rule input cells
* Studio: Fix multiple issues while import the app
* DMN: Fix reload issue
* Studio: Property updates
* Studio: Fix App export issue in widget attrs
* BPM: Manage null and empty values for process instance id

## 1.1.3 (2023-11-03)

#### Fixed

* Anomaly #71447: Fix NPE upon save of a custom model with a menu

## 1.1.2 (2023-10-25)

#### Fixed

* Anomaly #70597: Fix StudioActionView duplication on every save

## 1.1.1 (2023-10-06)

#### Fixed

* Anomaly #70007: Fix apps images duplicating at each server startup

## 1.1.0 (2023-06-02)

#### Features

* BPM: Open the meta menu form for a menu generated by the process
* Change title for BPM Model import
* BPM: Add domain on menus
* BPM: Multiple menu from a node with roles

#### Fixed

* BPM: Fix context for menus
* Studio URL should ends with '/'
* BPM: Fix listout panel issue in View attributes properties
* BPM: Fix single result boolean on the query builder
* BPM: Fix error while use the IN operator in a script generated by the query builder
* BPM: Fix query builder operator on "Value from" change
* BPM: Fix empty operator selection on expression builder
* Unable to use hideIf, showIf and requiredIf as view attributes
* Replace deprecated classes from org.apache.commons.lang3 by org.apache.commons.text
* BPM: Fix wrong evaluation of IN operator in case of selection on expression builder
* Anomaly #59638: Fix all old bad practices from controllers

## 1.0.5

* Anomaly #71447: Fix NPE upon save of a custom model with a menu

## 1.0.4

* Anomaly #70597: Fix StudioActionView duplication on every save

## 1.0.3

* Anomaly #70007: Fix apps images duplicating at each server startup

## 1.0.2

* Anomaly #63849: Fix DMN breaking error
* Anomaly #64221: Inaccessible application in case of missing properties

## 1.0.1

* Anomaly #62216: Null Java Pointer : when save a Connector without a request
* Anomaly #62285: Error when loading transformation.csv
* Anomaly #62413: Fix workflow import and related code
* Anomaly #62621: Refactor WkfDashboardCommonService
* Anomaly #62661: MetaJsonModel can't be chosen on the context and parameter / payload builder
* Feature #62863: Readable file name for BPM export
* Anomaly #63014: BPM Studio: unable to save script on listener
* Anomaly #63064: Unique process id generation
* Anomaly #63142: [DMN]: Expression property
* Anomaly #63226: BPM : Issue on delete process
* Anomaly #63263: Expression builder: unable to validate expression on buttons

## 1.0.0

* Feature #49090: Web service
* Anomaly #53787: Fix Payloads Editing when adding new elements
* Feature #53844: Add Username / Password Tasks when click on authentification option instaed of the table
* Feature #55755: add List option to The payload builder
* Feature #55144: Add a time builder for timer events
* Feature #55354: Connector Part : execute of call connector action
* Anomaly #55389: Error when modification of a proprity of the request after switching from model to another
* Feature #55429: context Builder : Build the context to be chosen when we want to test the connector
* Feature #55441: Run test Button
* Feature #55644: Add and Edit Request from Authentication part or connector part
* Feature #55929: Create Groovy Script for the embedded payload ( conception + realisation )
* Anomaly #57099: Save only one model payload with the request
* Anomaly #57100: the call of an update request doesn't work
* Feature #57145: Fields Validation
* Feature #57268: Add option of multiple object inside a list in the json payload of the request ( Payload Builder - Parameter Builder )
* Anomaly #57973: [DMN] wrong evaluation in case of date
* Feature #59199: Support roles in task assignation
* Anomaly #59299: DMN : Fix record change in table mode, hide model option on input expression
* Feature #59634: [Studio] Support only if
* Anomaly #59722: AxelorMessageException : Keep exception class to avoid blocking
* Feature #59768: [SCRIPT] code highlighting
* Anomaly #60099: [STUDIO WS] Problem in API CALL
* Anomaly #60316: [Action Builder] Error in the generated script action
* Feature #60389: [STUDIO WS] Exportation of ws Studio with custom applications
* Anomaly #60513: [DMN] Duplicated id for decisions
* Anomaly #60571: [STUDIO WS] Exportation of ws Studio with custom applications : the connectors can't load the requests
* Anomaly #60577: AOP problem : the authentification with axelor instances dosn't work with the ws builder in AOP
* Anomaly #60678: Studio Addons : initApps issue
* Anomaly #60715: Error in view studio-team-task-form
* Anomaly #60716: Error in view studio-web-service-ws-request
* Anomaly #60735: BPM: Impossible to download BPMN
* Anomaly #60779: Auto install apps : aos.apps.install-apps in properties
* Feature #60780: Move auto installer apps from Base to Studio
* Feature #60896: Axelor-config : properties choices between AOS and AOP
* Anomaly #61460: Typo in action-wlf-model-method-onload
* Anomaly #61563: BPM modeler: selection of another model
* Feature #61778: Add a global simple context map
* Anomaly #62103: Multiple error for task assignation
* Feature #62104: Imporovement Token Mode
* Anomaly #62105: View attributes doesn’t work for a sub-process.
* Anomaly #62158: [STUDIO] Missing "show processus instance"
* Anomaly #62171: Authentication's Requests disapear when navigate from the connector
* Anomaly #62216: Null Java Pointer : when save a Connector without a request
* Anomaly #62270: Fix timer event execution
* Anomaly #62327: Expression builder: resize dy default
* Anomaly #62329: Expression builder: don't allow to change width
* Anomaly #62336: BPM : crash when click on multiselect property of nodes
* Anomaly #62418: Studio : Theme not apply
* Anomaly #62575: WsTokenHandler: Missing rollback on transactional
* Anomaly #62582: Errors while loading the bpm modeler page
* Anomaly #62584: Dashboard on process model is not working
* Anomaly #62586: Unable to get user full name in nodes
* Anomaly #62588: Builder error
* Feature #62626: Export/Import the new fields in wsAuthetication and parameters in wsRequest
* Feature #62628: Apps type and tag
* Anomaly #62789: Revert Survey feature
* Anomaly #62850: AppServiceImpl : exception on Windows when we try to install an app
