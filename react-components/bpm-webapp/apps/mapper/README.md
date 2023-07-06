# Assignment Builder (Mapper)

This project is used to generate scripts dynamically using UI and bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Connect to Axelor

> #### Local Server running on http://localhost:8080/axelor-erp
>
> - First login into Local server i.e. http://localhost:8080/axelor-erp (admin/admin)
> - Change 'proxy' in package.json to http://localhost:8080.
> - Try to run app with relative suburl i.e. on http://localhost:3000/axelor-erp

> #### Live Server running on https://test.axelor.com/open-suite-master
>
> - First login into Local server i.e. https://test.axelor.com/open-suite-master (admin/@axadmin)
> - Change 'proxy' in package.json to https://test.axelor.com.
> - Try to run app with relative suburl i.e. on http://localhost:3000/open-suite-master
> - Manually copy paster CSRF-TOKEN and JSESSIONID from test.axelor.com server to localhost server (Developer Tools -> Application Tab -> Cookies Section), reload the page

> #### Check with Mapper Record
>
> - Pass id to URL like below, which connect id=2 mapper record
> - http://localhost:3000/axelor-erp/?id=2
> - http://localhost:3000/open-suite-master/?id=2

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
