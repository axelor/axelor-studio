## MR acceptance checklist

This checklist encourages us to confirm any changes have been analyzed to reduce risks in quality, performance, reliability, security, and maintainability.

### General

* [ ] The title of the MR contains a clickable link to the issue and the title of the original issue Ex: Don't use deprecated icons #95.
* [ ] The pipeline completed successfully.
* [ ] My MR is mergeable (there are no conflicts with the target branch).
* [ ] All the commits in the ticket are related to the same topic.
* [ ] All the changes are relevant to the topic. I didn't push some changes by mistake.
* [ ] My changes follow our naming conventions (field names, view names, etc).
* [ ] I provided the translations.
* [ ] I tested the changes with the right user.
* [ ] I have added a changelog
* [ ] In case of a feature i have created both documentation technical and functionnal (with the help of the project manager)

### XML

* [ ] If I change the datamodel, I provide an SQL migration script.
* [ ] If I changed a selection, I provided the related extra-code.

### Java

* [ ] My code follow this guideline [Guideline](https://redmine.axelor.com/issues/59638)
* [ ] The business logic is only in the services.
* [ ] The queries are only in the repositories.

#### Controllers

* [ ] The exceptions are handled.
* [ ] Injection is done with `Beans.get(...)`.

#### Services

* [ ] Transactional methods are rollbacked (if necessary).
* [ ] I choosed the right visibility for my methods.
* [ ] The methods defined in my interface have the `@Override` annotation in their implementation.


/assign me
