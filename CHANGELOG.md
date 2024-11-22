## 2.0.9 (2024-11-22)

#### Fix

* Resolve error when using self as data source

  <details>
  
  Resolve the issue with self source type, use targetModel as prefix before using the field name
  
  </details>


## 2.0.8 (2024-10-22)

#### Fix

* Blank screen when opening BPM studio

  <details>
  
  - Fix the error in select component that caused blank screen on opening BPM
  
  </details>


## 2.0.7 (2024-10-17)

#### Fix

* Update axelor utils and message version to use aop 7.0.10

  <details>
  
  Update axelor utils and message version and use aop 7.0.10 fix
  
  </details>

* BAML Bug on instance generation

## 2.0.6 (2024-09-09)

#### Fix

* Alert when opening a process
* Fix duplicate request when selecting BPM Model
* Fix  apply CamelCase on MetaJsonField each time when navigate to another field

  <details>
  
  - the metaJsonField's name are automatically converted in CamelCase.
  - It's a nice for new field but not for already existing ones.
  
  </details>

* Correct wrong translation

  <details>
  
  - Change in fr translation "Modèles standards importés" to "Importer les modèles standards"
  
  </details>


## 2.0.5 (2024-07-24)

#### Fix

* Correct wrong translation

  <details>
  
  - Change in fr translation "Modèles standards importés" to "Importer les modèles standards"
  
  </details>

* Update xsd version on Studio elements

  <details>
  
  - Update xsd version on domains from 6.1 to 7.0
  - Update xsd version on views from 6.1 to 7.0
  - Update xsd version on import from 6.1 to 7.0
  
  </details>

* Builders refactoring

  <details>
  
  - Change used template for studio action, use groovy template instead of js templating.
  
  </details>


## 2.0.4 (2024-06-26)

#### Fix

* Fix unused exportation of files, when exporting an empty Studio App
* Fix scrolling is blocked in mapper

## 2.0.3 (2024-05-30)

#### Fix

* Fix NPE issue when importing Apps from Studio Apps menu

## 2.0.2 (2024-05-03)

#### Fix

* fix override AOP translations

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
