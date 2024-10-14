# RecipeRadar Frontend

The RecipeRadar Frontend is a recipe search and meal planning application.

It's distributed as a [Progressive Web Application](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) built using [webpack](https://webpack.js.org).

The application is intended to follow [local-first](https://www.inkandswitch.com/local-first.html) principles, but we have some work to do before we fully achieve that.

Source code for the application is divided into four JavaScript components:

* `src/app` - RecipeRadar application functionality
* `src/diagnostics` - service status and data investigation tools
* `src/feedback` - in-application feedback form based on [feedback.js](https://experiments.hertzen.com/jsfeedback)
* `src/sw` - application [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

The following resources are useful guides for designing ingredient and recipe rendering:

* [The Metric Kitchen - Style Guide](https://www.jsward.com/cooking/style.shtml)
* [Wikipedia - Cooking weights and measures](https://en.wikipedia.org/wiki/Cooking_weights_and_measures)

## Install dependencies

Make sure to follow the RecipeRadar [infrastructure](https://www.github.com/openculinary/infrastructure) setup to ensure all cluster dependencies are available in your environment.

## Development

To install development tools and run linting and tests locally, execute the following commands:

```sh
$ yarn install
$ make lint tests
```

## Local Deployment

To deploy the service to the local infrastructure environment, execute the following commands:

```sh
$ make
$ make deploy
```

If you have configured and run `haproxy` per the [infrastructure](https://www.github.com/openculinary/infrastructure) setup instructions, you should be able to run the application by navigating to `http://localhost` in a web browser.

## Internationalization

To gather the latest internationalization (i18n) resource strings from the application, execute the following commands:

```sh
$ npx run i18next-scanner
```

## Integrity

To calculate a base64-encoded SHA512 digest of the `index.html` file for integrity-check purposes, build the application (by running `make`), and then run the following command:

```sh
$ cat public/index.html | openssl dgst -sha512 -binary | base64 --wrap 0
```

This should produce a single line of output containing eighty-eight ASCII characters, and this should match the DNS B text record found for the application's deployment domain.
