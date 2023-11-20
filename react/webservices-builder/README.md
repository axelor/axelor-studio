# Web services Builder (React + Vite)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules. Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Connect to Axelor

> #### Local Server running on http://localhost:8080/axelor-erp
>
> - First login into Local server i.e. http://localhost:8080/axelor-erp (admin/admin)
> - Change 'proxy' server's url and suburl in '.env' file
>   - Set `VITE_PROXY_TARGET` to http://localhost:8080
>   - Set `VITE_PROXY_CONTEXT` to /axelor-erp/
>   - Note: If the server doesn't have a suburl, set `VITE_PROXY_CONTEXT` to `/`
> - Try to run the app with a relative suburl i.e. on http://localhost:5173/axelor-erp/

> #### Live Server running on https://test.axelor.com/open-suite-master
>
> - First login into Local server i.e. https://test.axelor.com/open-suite-master (admin/@axadmin)
>   - Set `VITE_PROXY_TARGET` to http://localhost:8080
>   - Set `VITE_PROXY_CONTEXT` to /axelor-erp/
>   - Note: If the server doesn't have a suburl, set `VITE_PROXY_CONTEXT` to `/`
> - Try to run the app with a relative suburl i.e. on http://localhost:5173/open-suite-master/
> - Manually copy-paste CSRF-TOKEN and JSESSIONID from test.axelor.com server to localhost server (Developer Tools -> Application Tab -> Cookies Section), reload the page

> #### Check with Studio Record
>
> - Pass id to URL like below, which connect id=2 studio record
> - http://localhost:5173/axelor-erp/?id=2
> - http://localhost:5173/open-suite-master/?id=2

## Available Scripts

In the project directory, you can run:

### `pnpm start`

Runs the app in the development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.\
The page will reload if you make edits.\
You will also see any lint errors in the console.

### `pnpm build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.
