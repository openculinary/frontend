# RecipeRadar Frontend

The RecipeRadar Frontend is a user-facing, [local-first](https://www.inkandswitch.com/local-first.html) recipe search and meal planning application with support for multi-user collaboration.

It's distributed as a [Progressive Web Application](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) built using [webpack](https://webpack.js.org).

Source code for the application is divided into three Javascript components:

* `src/app` - RecipeRadar application functionality
* `src/feedback` - in-application feedback form based on [feedback.js](https://experiments.hertzen.com/jsfeedback)
* `src/sw` - application [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Install dependencies

Make sure to follow the RecipeRadar [infrastructure](../infrastructure) setup to ensure all cluster dependencies are available in your environment.

## Development

To install development tools and run linting and tests locally, execute the following commands:

```
yarn install
yarn exec make
```

## Local Deployment

To deploy the service to the local infrastructure environment, execute the following commands:

```
sudo sh -x ./build.sh
sh -x ./deploy.sh
```

If you have configured and run `haproxy` per the [infrastructure](../infrastructure) setup instructions, you should be able to run the application by navigating to `http://localhost` in a web browser.
